import test from 'ava';
import '@babel/polyfill';

test('Hack.statusLabel', t => {
  const { Hack } = require('../src');

  t.is(Hack.statusLabel, null);
  Hack.statusLabel = 'hoge';
  t.is(Hack.statusLabel, 'hoge');
});
