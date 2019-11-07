import test from 'ava';
import { isHit } from './DamageSystem';

type XYWH = [number, number, number, number];

const cases: [XYWH, XYWH, boolean][] = [
  [[0, 0, 1, 1], [0, 0, 2, 2], true],
  [[1, 1, 3, 3], [2, 2, 1, 1], true],
  [[1, 1, 1, 1], [2, 1, 1, 1], false],
  [[0, 0, -1, -1], [-2, -2, 1, 1], false],
  [[0, 0, -1, -1], [-2, -2, 1.5, 1.5], true],
  [[0, 0, 2, 1], [1, 0, 2, 1], true],
  [[0, 0, 2, 1], [2, 0, 2, 1], false],
  [[0, 0, 1, 2], [0, 1, 1, 2], true],
  [[0, 0, 1, 2], [1, 2, 1, 2], false]
];

const rect = ([x, y, width, height]: XYWH) => ({ x, y, width, height });

test('isHit', t => {
  for (const [a, b, expect] of cases) {
    t.is(isHit(rect(a), rect(b)), expect, `[${a.join()}], [${b.join()}]`);
    t.is(isHit(rect(b), rect(a)), expect, `[${b.join()}], [${a.join()}]`);
  }
});
