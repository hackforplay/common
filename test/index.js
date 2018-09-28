import test from 'ava';
import '@babel/polyfill';

test.cb('Import as a module and initialize game', t => {
  const { enchant, Hack, register } = require('../src');

  register(global);
  t.is(global.game, enchant.Core.instance);

  // 画像をローカルから取得する
  Hack.basePath = '';

  // ゲーム実行中にエラーが起きた場合はこの関数でエラーを吸い上げる
  feeles.throwError = error => {
    t.fail(error.message);
    t.end();
  };

  const gameOnLoad = require('./helpers/game').default;
  const hackOnLoad = require('./helpers/maps').default;

  game.onload = () => {
    // gameOnLoad より先に実行するイベント
    // lifelabel などが gameOnLoad 時に参照できない対策
    game.dispatchEvent(new enchant.Event('awake'));

    gameOnLoad();

    // Hack.player がないとき self.player を代わりに入れる
    if (self.player && !Hack.player) {
      Hack.player = self.player;
    }
    t.pass('game.onload');
    t.is(Hack.statusLabel, 'map1');
    t.end();
  };
  Hack.onload = () => {
    // Hack.maps を事前に作っておく
    Hack.maps = Hack.maps || {};
    hackOnLoad();
    t.pass('Hack.onload');
  };

  // game.onload と Hack.onload がどちらも終了すればパス
  t.plan(4);

  // ゲームスタート
  Hack.start();
});

test('Global Map constructor instead of enchant.Map', t => {
  const { register, enchant } = require('../src');
  register(global);
  t.not(window.Map, enchant.Map);
  t.is(typeof window.Map.prototype.has, 'function');
});
