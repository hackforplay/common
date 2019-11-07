import * as PIXI from 'pixi.js';
import { Animation, ISkin } from './skinLoader';
import { Dir } from './UnitVector';
import { World } from './World';

const cache = new WeakMap<PIXI.BaseTexture, PIXI.Texture[]>();

export class AnimationSystem {
  readonly world: World;

  constructor(world: World) {
    this.world = world;
  }

  update() {
    // 非ループアニメーションの終端処理
    this.world.charactors.forEach(chara => {
      if (chara.currentAnimationWillStop) {
        // アニメーション終了 => Idle へ
        chara.currentAnimation = Animation.Idle;
        chara.currentAnimationFrame = 0;
        chara.currentAnimationSince = chara.age;
        chara.currentAnimationWillStop = false;
      }
    });

    // アニメーションフレームの計算
    this.world.charactors.forEach(chara => {
      if (!chara.skin) return;
      let frames = chara.skin.frame && chara.skin.frame[chara.currentAnimation];
      const animations = frames && decode(frames); // TODO: cache
      if (!animations || animations.length < 1) {
        // アニメーションが全くない場合、ずっと frame=1 にする
        if (chara.currentAnimationFrame === 1) return;
        const textures = slice(chara.skin);
        chara.currentAnimationFrame = 1;
        const index = getIndex(chara.d, chara.skin.column, 1);
        const sprite = new PIXI.Sprite(textures[index]);
        sprite.width = chara.skin.sprite.width / 2;
        sprite.height = chara.skin.sprite.height / 2;
        chara.sprite = sprite;
        return;
      }

      let frame = chara.age - chara.currentAnimationSince;
      if (isLoop(chara.currentAnimation)) {
        frame = frame % animations.length;
      } else if (frame >= animations.length - 1) {
        frame = animations.length - 1;
        chara.currentAnimationWillStop = true;
      }
      const animationFrame = animations[frame];
      if (chara.currentAnimationFrame === animationFrame) return; // 向きが変わった場合を考慮していない！！！！！！！！
      chara.currentAnimationFrame = animationFrame;
      const textures = slice(chara.skin);
      const index = getIndex(chara.d, chara.skin.column, animationFrame);
      const sprite = new PIXI.Sprite(textures[index]);
      sprite.width = chara.skin.sprite.width / 2;
      sprite.height = chara.skin.sprite.height / 2;
      chara.sprite = sprite;
    });
  }
}

function isLoop(animation: Animation) {
  return animation === Animation.Idle || animation === Animation.Walk;
}

function getIndex(d: Dir, column: number, animationFrame: number) {
  if (d === Dir.Up) return animationFrame + 3 * column;
  if (d === Dir.Right) return animationFrame + 2 * column;
  if (d === Dir.Down) return animationFrame + 0 * column;
  if (d === Dir.Left) return animationFrame + 1 * column;
  return 0;
}

function slice(skin: ISkin) {
  const base = PIXI.BaseTexture.from(skin.image);
  let textures = cache.get(base);
  if (!textures) {
    textures = [];
    const { width, height } = skin.sprite;
    for (let y = 0; y < skin.row; y++) {
      for (let x = 0; x < skin.column; x++) {
        const frame = new PIXI.Rectangle(width * x, height * y, width, height);
        const texture = new PIXI.Texture(base, frame);
        textures.push(texture);
      }
    }
    cache.set(base, textures);
  }
  return textures;
}

function decode(args: (number | null)[]): number[] {
  const array = [];
  for (let index = 0; index < args.length; index += 2) {
    const n = args[index];
    const l = args[index + 1];
    if (l === null) {
      throw new Error('Invalid skin frame: ' + JSON.stringify(args));
    }
    if (n === null) {
      return array;
    }
    for (let i = 0; i < l; i++) array.push(n);
  }
  return array;
}
