import * as PIXI from 'pixi.js';

export enum Animation {
  Idle = 'idle',
  Walk = 'walk',
  Attack = 'attack',
  Dead = 'dead'
}

export interface ISpritessheetSize {
  w: number;
  h: number;
}

export interface ISpritessheetRect extends ISpritessheetSize {
  x: number;
  y: number;
}

export interface ISpritessheetFrame {
  anchor?: PIXI.IPoint;
  frame: ISpritessheetRect;
  rotated?: boolean;
  sourceSize?: ISpritessheetSize;
  spriteSourceSize?: PIXI.IPoint;
  trimmed?: boolean;
}

export interface ISpritessheet {
  animations?: { [key in Animation]?: number[] };
  frames: ISpritessheetFrame[];
  meta: {
    app: string;
    format: 'RGBA8888';
    frameTags: any[];
    image?: string;
    layers: any[];
    scale: number | string;
    size: ISpritessheetSize;
    version: string;
  };
}

export interface SkinResource extends PIXI.LoaderResource {
  data: ISkin;
  isLoop: { [key in Animation]: boolean };
}

export function skinLoader(
  resource: PIXI.LoaderResource & Partial<SkinResource>,
  next: (err?: Error) => void
) {
  try {
    const skin = JSON.parse(resource.data) as ISkin;
    resource.data = skin;
    const baseTexture = PIXI.BaseTexture.from(skin.image);
    const [data, isLoop] = convert(skin);
    const spritesheet = new PIXI.Spritesheet(baseTexture, data);
    resource.spritesheet = spritesheet;
    resource.isLoop = isLoop;
    spritesheet.parse(textures => {
      resource.texture = textures[0];
      resource.textures = textures;
      next();
    });
  } catch (error) {
    throw error;
  }
}

export interface ISkin {
  name: string;
  image: string;
  column: number;
  row: number;
  sprite: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  collider: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  direction: 1 | 4;
  mayRotate: boolean;
  frame?: {
    idle?: (number | null)[];
    walk?: (number | null)[];
    attack?: (number | null)[];
    dead?: (number | null)[];
  };
}

const defaultSkinAnimationFrames: {
  [key in ISkin['direction']]: { [animation in Animation]: (number | null)[] }
} = {
  1: {
    idle: [1, 1],
    walk: [0, 10],
    attack: [0, 12, null, 1],
    dead: [0, 1, null, 1]
  },
  4: {
    idle: [1, 1],
    walk: [0, 3, 1, 3, 2, 3, 1, 1],
    attack: [3, 4, 4, 4, 5, 4, null, 1],
    dead: [1, 1, null, 1]
  }
};

function convert(skin: ISkin): [ISpritessheet, SkinResource['isLoop']] {
  const frames: ISpritessheetFrame[] = [];
  for (let y = 0; y < skin.row; y++) {
    for (let x = 0; x < skin.column; x++) {
      frames.push({
        frame: {
          x: x * skin.sprite.width,
          y: y * skin.sprite.height,
          w: skin.sprite.width,
          h: skin.sprite.height
        }
      });
    }
  }

  const anims = skin.frame || defaultSkinAnimationFrames[skin.direction];

  const idle = anims.idle && decode(anims.idle);
  const walk = anims.walk && decode(anims.walk);
  const attack = anims.attack && decode(anims.attack);
  const dead = anims.dead && decode(anims.dead);

  return [
    {
      frames,
      animations: {
        idle: idle && idle[0],
        walk: walk && walk[0],
        attack: attack && attack[0],
        dead: dead && dead[0]
      },
      meta: {
        app: 'https://www.hackforplay.xyz',
        format: 'RGBA8888',
        frameTags: [],
        layers: [],
        scale: 1,
        size: {
          w: skin.column * skin.sprite.width,
          h: skin.row * skin.sprite.height
        },
        version: '1.0'
      }
    },
    {
      idle: Boolean(idle && idle[1]),
      walk: Boolean(walk && walk[1]),
      attack: Boolean(attack && attack[1]),
      dead: Boolean(dead && dead[1])
    }
  ];
}

export function decode(args: (number | null)[]): [number[], boolean] {
  const array = [];
  for (let index = 0; index < args.length; index += 2) {
    const n = args[index];
    const l = args[index + 1];
    if (l === null) {
      throw new Error('Invalid skin frame: ' + JSON.stringify(args));
    }
    if (n === null) {
      return [array, false];
    }
    for (let i = 0; i < l; i++) array.push(n);
  }
  return [array, true];
}
