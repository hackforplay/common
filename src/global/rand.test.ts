import test from 'ava';
import { rand, randf } from './rand';

const itr = Array.from({ length: 100 });

test('rand(number)', t => {
  itr.forEach(() => {
    const r = rand(50);
    t.truthy(0 <= r && r <= 50);
    t.truthy(r % 1 === 0);
  });
});

test('rand(number, number)', t => {
  itr.forEach(() => {
    const r = rand(-50, 50);
    t.truthy(-50 <= r && r <= 50);
    t.truthy(r % 1 === 0);
  });
});

test('rand(array)', t => {
  const candidates = [1, 2, 4, 8, 16, 19, -7];
  itr.forEach(() => {
    const r = rand(candidates);
    t.truthy(candidates.includes(r));
  });
});

test('randf(number)', t => {
  itr.forEach(() => {
    const r = randf(50);
    t.truthy(0 <= r && r <= 50);
  });
});

test('randf(number, number)', t => {
  itr.forEach(() => {
    const r = randf(-50, 50);
    t.truthy(-50 <= r && r <= 50);
  });
});

test('randf(array)', t => {
  const candidates = [0.1, 0.2, 0.4, 0.8, 0.16, 0.19, -7.5];
  itr.forEach(() => {
    const r = randf(candidates);
    t.truthy(candidates.includes(r));
  });
});
