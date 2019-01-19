import test from 'ava';
import * as N from './numbers';

test('operating numbers', t => {
  t.is(helper('イコール', 2, 0), 0);
  t.is(helper('ふやす', 1, 3), 1 + 3);
  t.is(helper('へらす', 4, 3), 4 - 3);
  t.is(helper('かける', 2, 3), 2 * 3);
  t.is(helper('わる', 9, 3), 9 / 3);
  t.is(helper('以上にする', 4, 6), Math.max(4, 6));
  t.is(helper('以下にする', 9, 3), Math.min(9, 3));
  t.throws(() => helper('存在しない演算子', 0, 0), TypeError);
});

function helper(operator: string, previous: number, amount: number) {
  const operate = N.operator(operator);
  if (!operate) {
    throw new TypeError();
  }
  return operate(previous, amount);
}
