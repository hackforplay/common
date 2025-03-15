import test from 'ava';
import { observeArray } from './observe-array';

test('observeArray', t => {
  const a = observeArray([1, 2, 3]);
  let count = 0;
  const assertIncreased = () => {
    t.true(a.mutatedCount > count); // トラップされる回数は環境によって違うのでテストしない. 増えたことだけテストする
    count = a.mutatedCount;
  };
  t.is(a.mutatedCount, 0);
  a[3] = 4; // [1, 2, 3, 4]
  assertIncreased();
  a.pop(); // [1, 2, 3]
  assertIncreased();
  a.push(0, 1); // [1, 2, 3, 0, 1]
  assertIncreased();
  a.reverse(); // [1, 0, 3, 2, 1]
  assertIncreased();
  a.shift(); // [0, 3, 2, 1]
  assertIncreased();
  a.sort(); // [0, 1, 2, 3]
  assertIncreased();
  a.splice(1, 1, 99); // [0, 99, 2, 3]
  assertIncreased();
  a.unshift(100); // [100, 0, 99, 2, 3]
  assertIncreased();
  t.deepEqual(Array.from(a), [100, 0, 99, 2, 3]);
});
