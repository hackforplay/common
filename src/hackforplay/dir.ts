import { default as Vector2 } from './math/vector2';

export function up() {
  return new Vector2(0, -1);
}
export function right() {
  return new Vector2(1, 0);
}

export function down() {
  return new Vector2(0, 1);
}

export function left() {
  return new Vector2(-1, 0);
}

export const random = random4;
const m = -1;

/**
 *   0
 * 3   1
 *   2
 */
const _xRandom4 = [0, 1, 0, m];
const _yRandom4 = [m, 0, 1, 0];
export function random4() {
  const n = (Math.random() * 4) >> 0;
  return new Vector2(_xRandom4[n], _yRandom4[n]);
}

/**
 * 0 1 2
 * 7   3
 * 6 5 4
 */
const _xRandom8 = [m, 0, 1, 1, 1, 0, m, m];
const _yRandom8 = [m, m, m, 0, 1, 1, 1, 0];
export function random8() {
  const n = (Math.random() * 8) >> 0;
  return new Vector2(_xRandom8[n], _yRandom8[n]);
}

// synonyms
export const うえ = up;
export const みぎ = right;
export const ひだり = left;
export const した = down;
export const ランダム = random;
export const ランダム4 = random4;
export const ランダム8 = random8;
