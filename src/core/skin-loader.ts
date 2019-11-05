import * as PIXI from 'pixi.js';

export function skinLoader(
  resource: PIXI.LoaderResource,
  next: (err?: Error) => void
) {
  try {
    const skin = JSON.parse(resource.data) as ISkin;
    resource.texture = PIXI.Texture.from(skin.image);
    resource.data = skin;
  } catch (error) {
    throw error;
  }
  next();
}

export interface SkinResource extends PIXI.LoaderResource {
  data: ISkin;
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
