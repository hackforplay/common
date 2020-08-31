import test from 'ava';
import {
  MissingGlobal,
  useGlobals,
  emitGlobalsChangedIfNeeded
} from './globals';

test('Test subscribeGlobal', t => {
  t.plan(2);
  const g = useGlobals('g');
  g['a'] = 0;
  emitGlobalsChangedIfNeeded(() => {
    t.is(g['a'], 0);
  });

  g['a'] += 1;
  emitGlobalsChangedIfNeeded(() => {
    t.is(g['a'], 1);
  });
  emitGlobalsChangedIfNeeded(() => {
    t.is(g['a'], 1); // will not call
  });

  g['a'] += 1;
});

test('MissingGlobal', t => {
  const g = useGlobals('g');
  const error = t.throws(() => {
    g['b'] += 1;
  });
  t.true(error instanceof MissingGlobal);
});

test('All globals has same reference', t => {
  const g1 = useGlobals('g1');
  const g2 = useGlobals('g2');

  g1['object'] = {};
  t.is(g1['object'], g2['object']);
});
