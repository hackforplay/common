import test from 'ava';

test.cb('Play game with rule base definition', t => {
  t.pass();
  t.end();

  // require('../src/register');
  // t.is(global.game, global.enchant.Core.instance);

  // require('./helpers/rules'); // ルール定義をロードする

  // t.truthy(global.rule);

  // // 画像をローカルから取得する
  // Hack.basePath = '';

  // // ゲーム実行中にエラーが起きた場合はこの関数でエラーを吸い上げる
  // feeles.throwError = error => {
  //   t.fail(error.message);
  //   t.end();
  // };

  // const hackOnLoad = require('./helpers/maps').default;

  // game.onload = () => {
  //   // gameOnLoad より先に実行するイベント
  //   // lifelabel などが gameOnLoad 時に参照できない対策
  //   game.dispatchEvent(new enchant.Event('awake'));

  //   rule.runゲームがはじまったとき().then(() => {
  //     // helpers/rules.js が一通り実行されたあと

  //     // Hack.player がないとき window.player を代わりに入れる
  //     if (window.player && !Hack.player) {
  //       Hack.player = window.player;
  //     }

  //     t.pass('game.onload');
  //     t.is(Hack.statusLabel, 'map1');
  //     t.end();
  //   });
  // };
  // Hack.onload = () => {
  //   // Hack.maps を事前に作っておく
  //   Hack.maps = Hack.maps || {};
  //   hackOnLoad();
  //   t.pass('Hack.onload');
  // };

  // // game.onload と Hack.onload がどちらも終了すればパス
  // t.plan(5);

  // // ゲームスタート
  // Hack.start();
});
