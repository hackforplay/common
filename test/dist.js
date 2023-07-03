import test from 'ava';

test('[dev] Bundled js expose Hack, game, rule and enchant', t => {
  require('../dist/register');
  t.is(typeof window.Hack, 'object');
  t.is(typeof window.game, 'object');
  t.is(typeof window.rule, 'object');
  t.is(typeof window.enchant, 'function');
});

test('[prod] Bundled js expose Hack, game, rule and enchant', t => {
  require('../dist/register.min');
  t.is(typeof window.Hack, 'object');
  t.is(typeof window.game, 'object');
  t.is(typeof window.rule, 'object');
  t.is(typeof window.enchant, 'function');
});
