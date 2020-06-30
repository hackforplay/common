import test from 'ava';
import { observeArray } from './observe-array';

test('observeArray', t => {
  const a = observeArray([1, 2, 3]);
  t.is(a.mutatedCount, 0);
  a[3] = 4; // [1, 2, 3, 4]
  t.is(a.mutatedCount, 1);
  a.pop(); // [1, 2, 3]
  t.is(a.mutatedCount, 2);
  a.push(0, 1); // [1, 2, 3, 0, 1]
  t.is(a.mutatedCount, 5);
  a.reverse(); // [1, 0, 3, 2, 1]
  t.is(a.mutatedCount, 9);
  a.shift(); // [0, 3, 2, 1]
  t.is(a.mutatedCount, 14);
  a.sort(); // [0, 1, 2, 3]
  t.is(a.mutatedCount, 18);
  a.splice(1, 1, 99); // [0, 99, 2, 3]
  t.is(a.mutatedCount, 20);
  a.unshift(100); // [100, 0, 99, 2, 3]
  t.is(a.mutatedCount, 26);
  t.deepEqual(Array.from(a), [100, 0, 99, 2, 3]);
});
