import Vector2 from './math/vector2';
import RPGObject from './object/object';

export interface IDir {
  (self: RPGObject): Vector2;
}

export const up: IDir = () => new Vector2(0, -1);
export const right: IDir = () => new Vector2(1, 0);
export const down: IDir = () => new Vector2(0, 1);
export const left: IDir = () => new Vector2(-1, 0);

export const rightHand: IDir = self => self.forward.rotateDegree(90);
export const leftHand: IDir = self => self.forward.rotateDegree(-90);
export const behind: IDir = self => self.forward.scale(-1);

const m = -1;

/**
 *   0
 * 3   1
 *   2
 */
const _xRandom4 = [0, 1, 0, m];
const _yRandom4 = [m, 0, 1, 0];
export const random4: IDir = () => {
  const n = (Math.random() * 4) >> 0;
  return new Vector2(_xRandom4[n], _yRandom4[n]);
};
export const random = random4;

/**
 * 0 1 2
 * 7   3
 * 6 5 4
 */
const _xRandom8 = [m, 0, 1, 1, 1, 0, m, m];
const _yRandom8 = [m, m, m, 0, 1, 1, 1, 0];
export const random8: IDir = () => {
  const n = (Math.random() * 8) >> 0;
  return new Vector2(_xRandom8[n], _yRandom8[n]);
};

// synonyms
export const うえ = up;
export const みぎ = right;
export const ひだり = left;
export const した = down;
export const みぎて = rightHand;
export const ひだりて = leftHand;
export const うしろ = behind;
export const ランダム = random;
export const ランダム4 = random4;
export const ランダム8 = random8;
