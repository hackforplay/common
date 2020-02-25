import { log } from '@hackforplay/log';
import Vector2 from './math/vector2';
import { synonyms } from './synonyms/direction';
import { synonymize } from './synonyms/synonymize';

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
export const DirectionWithSynonym = synonymize(
  Direction,
  synonyms,
  chainedName => {
    const message = `むき に「${chainedName}」はないみたい`;
    log('error', message, '@hackforplay/common');
  }
);

const absolutes = [
  Direction.Up,
  Direction.Right,
  Direction.Down,
  Direction.Left
];

const dirToNumber = (direction: Direction) => {
  for (let index = 0; index < absolutes.length; index++) {
    if (direction === absolutes[index]) {
      return index;
    }
  }
  return 0;
};

/**
 * RPGObject::turn の実装
 * @param current 現在の向き
 * @param target 与えられた向き
 */
export function turn(current: Direction, target: Direction) {
  switch (target) {
    case Direction.Up:
    case Direction.Right:
    case Direction.Down:
    case Direction.Left:
      return target;
    case Direction.RightHand:
      const right = dirToNumber(current) + 1;
      return absolutes[right % 4];
    case Direction.Behind:
      const behind = dirToNumber(current) + 2;
      return absolutes[behind % 4];
    case Direction.LeftHand:
      const left = dirToNumber(current) + 3;
      return absolutes[left % 4];
    case Direction.Random:
    case Direction.RandomDiagonal: // 未実装
    default:
      // 予期せぬ引数が与えられた場合はランダム
      const rand = Math.floor(Math.random() * 4);
      return absolutes[rand];
  }
}

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
