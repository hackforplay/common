import Vector2 from './math/vector2';

export enum Direction {
  Up = 'up',
  Right = 'right',
  Down = 'down',
  Left = 'left',
  RightHand = 'right hand',
  LeftHand = 'left hand',
  Behind = 'behind',
  Random = 'random',
  RandomDiagonal = 'random diagonal'
}

/**
 * 日本語のシノニム
 */
export enum Direction {
  うえ = 'up',
  みぎ = 'right',
  した = 'down',
  ひだり = 'left',
  みぎて = 'right hand',
  ひだりて = 'left hand',
  うしろ = 'behind',
  ランダム = 'random',
  ななめありランダム = 'random diagonal'
}

/**
 *
 * @param current 現在の向き（ベクトル）
 * @param dir
 */
export function getDirection() {}

const m = -1;

/**
 *   0
 * 3   1
 *   2
 */
const _xRandom4 = [0, 1, 0, m];
const _yRandom4 = [m, 0, 1, 0];
export const random4 = () => {
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
export const random8 = () => {
  const n = (Math.random() * 8) >> 0;
  return new Vector2(_xRandom8[n], _yRandom8[n]);
};
