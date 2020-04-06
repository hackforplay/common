// ここからゲームがはじまったときのルール
rule.ゲームがはじまったとき(async function () {
  Hack.changeMap('map1'); // map1 をロード

  const player = rule.つくる('プレイヤー');
  window.player = player;
  player.locate(3, 5); // いる ばしょ

  const item1 = rule.つくる('スライム');
  item1.locate(8, 5, 'map1'); // いる ばしょ
  item1.forward = [1, 0]; // むき

  const item2 = rule.つくる('スライム');
  item2.locate(9, 5, 'map1'); // いる ばしょ

  const item3 = rule.つくる('イモムシ');
  item3.locate(12, 5, 'map1'); // いる ばしょ

  const item4 = rule.つくる('コウモリ');
  item4.locate(9, 2, 'map1'); // いる ばしょ

  const item5 = rule.つくる('ドラゴン');
  item5.locate(2, 8, 'map1'); // いる ばしょ

  const item6 = rule.つくる('ウロボロス');
  item6.locate(4, 8, 'map1'); // いる ばしょ

  const item7 = rule.つくる('ミノタウルス');
  item7.locate(6, 8, 'map1'); // いる ばしょ

  const item8 = rule.つくる('ハート');
  item8.locate(8, 8, 'map1'); // いる ばしょ

  const item9 = rule.つくる('コイン');
  item9.locate(12, 8, 'map1'); // いる ばしょ

  const item10 = rule.つくる('スター');
  item10.locate(14, 8, 'map1'); // いる ばしょ

  const item11 = rule.つくる('ふしぎなカギ');

  const item12 = rule.つくる('ゴールちてん');
  item12.locate(10, 8, 'map1'); // いる ばしょ

  /*+ キャラクター アイテム */
});
// ここまでゲームがはじまったときのルール

// ここからプレイヤーのルール
window.__sandbox_context_name = 'プレイヤー';
rule.つくられたとき(async function () {
  // Player.set(this);
  this.family = ('▼ ファミリー', Family.プレイヤー);
  this.hp = 3; // 体力
  this.atk = 1; // こうげき力
  /*+ このキャラクターになにかする ゲーム全体になにかする 条件 */
});
rule.たおされたとき(async function () {
  Hack.gameover(); // ゲームオーバー
  this.destroy(); // プレイヤーを消す
});
/*+ ルールついか */
// ここまでプレイヤーのルール

// ここからスライムのルール
window.__sandbox_context_name = 'スライム';

// ここからキャラクターがつくられたとき行うルール
rule.つくられたとき(function () {
  this.family = ('▼ ファミリー', Family.ドクリツ);
  this.hp = 3;
  this.atk = 1;
  /*+ このキャラクターになにかする ゲーム全体になにかする 条件 */
});
// ここからキャラクターがつくられたとき行うルール
// ここからキャラクターがつねに行うルール
rule.つねに(async function () {
  await this.attack();
  /*+ このキャラクターになにかする ゲーム全体になにかする 条件 */
});
// ここまでキャラクターがつねに行うルール
// ここからキャラクターがたおされたときのルール
rule.たおされたとき(async function () {
  Hack.score += 1;
  /*+ このキャラクターになにかする ゲーム全体になにかする 条件 */
});
// ここまでキャラクターがたおされたときのルール
/*+ ルールついか */

// ここまでスライムのルール

// ここからゴールちてんのルール
window.__sandbox_context_name = 'ゴールちてん';

// ここからキャラクターがつくられたとき行うルール
rule.つくられたとき(function () {
  Hack.log('おしろがみえるだろう あれがゴールだ'); // ヒントをだす
  /*+ このキャラクターになにかする ゲーム全体になにかする 条件 */
});
// ここまでキャラクターがつくられたとき行うルール
// ここからキャラクターがふまれたときのルール
rule.item = 'プレイヤー'; // ふむキャラクター
rule.ふまれたとき(async function (item) {
  Hack.gameclear(); // ゲームクリア
  item.destroy(); // ふんだキャラクターをけす
  Hack.log('ゲームクリアです。おめでとう！'); // メッセージを出す
  /*+ このキャラクターになにかする ゲーム全体になにかする 条件 */
});
// ここまでキャラクターがふまれたときのルール
/*+ ルールついか */

// ここまでゴールちてんのルール

// ここからイモムシのルール
window.__sandbox_context_name = 'イモムシ';

// ここからキャラクターがつくられたとき行うルール
rule.つくられたとき(async function () {
  this.family = ('▼ ファミリー', Family.ドクリツ);
  this.hp = 2;
  this.atk = 1;
  /*+ このキャラクターになにかする ゲーム全体になにかする 条件 */
});
// ここまでキャラクターがつくられたとき行うルール
// ここからキャラクターがつねに行うルール
rule.つねに(async function () {
  await this.walk(); // あるく
  await this.turn(1); // ターンする
  /*+ このキャラクターになにかする 条件 */
});
// ここまでキャラクターがつねに行うルール
// ここからキャラクターがたおされたときのルール
rule.たおされたとき(async function () {
  Hack.score += 1;
  /*+ このキャラクターになにかする ゲーム全体になにかする 条件 */
});
// ここまでキャラクターがたおされたときのルール
/*+ ルールついか */

// ここまでイモムシのルール

// ここからコウモリ
window.__sandbox_context_name = 'コウモリ';

// ここからキャラクターがつくられたとき行うルール
rule.つくられたとき(async function () {
  this.family = ('▼ ファミリー', Family.ドクリツ);
  this.hp = 3;
  this.atk = 1;
});
// ここまでキャラクターがつくられたとき行うルール
// ここからキャラクターがつねに行うルール
rule.つねに(async function () {
  const moveX = 32 * Math.sign(window.player.mapX - this.mapX);
  const moveY = 32 * Math.sign(window.player.mapY - this.mapY);
  this.forward = [moveX, moveY];
  await this.walk(); // あるく
  await this.attack(); // こうげきする
  await this.wait(1); // やすむ
  /*+ このキャラクターになにかする 条件 */
});
// ここまでキャラクターがつねに行うルール
// ここからキャラクターがたおされたときのルール
rule.たおされたとき(async function () {
  Hack.score += 1;
  /*+ このキャラクターになにかする ゲーム全体になにかする 条件 */
});
// ここまでキャラクターがたおされたときのルール
/*+ ルールついか */

// ここまでコウモリ

// ここからウロボロス
window.__sandbox_context_name = 'ウロボロス';

// ここからキャラクターがつくられたとき行うルール
rule.つくられたとき(async function () {
  this.family = ('▼ ファミリー', Family.ドクリツ);
  this.hp = 10;
  this.atk = 1;
});
// ここからキャラクターがつねに行うルール
rule.つねに(async function () {
  await this.wait(4); // 少しやすむ
  await this.attack(); // こうげきする
  /*+ このキャラクターになにかする 条件 */
});
// ここまでキャラクターがつねに行うルール
// ここからキャラクターがたおされたときのルール
rule.たおされたとき(async function () {
  Hack.score += 1;
  /*+ このキャラクターになにかする ゲーム全体になにかする 条件 */
});
// ここまでキャラクターがたおされたときのルール
/*+ ルールついか */

// ここまでウロボロス

// ここからドラゴン
window.__sandbox_context_name = 'ドラゴン';

// ここからキャラクターがつくられたとき行うルール
rule.つくられたとき(async function () {
  this.family = ('▼ ファミリー', Family.ドクリツ);
  this.hp = 10;
  this.atk = 1;
  this.scale(2); // 大きさ
});
// ここからキャラクターがたおされたときのルール
rule.たおされたとき(async function () {
  Hack.score += 1;
  /*+ このキャラクターになにかする ゲーム全体になにかする 条件 */
});
// ここまでキャラクターがたおされたときのルール
/*+ ルールついか */

// ここまでドラゴン

// ここからミノタウルス
window.__sandbox_context_name = 'ミノタウルス';

// ここからキャラクターがつくられたとき行うルール
rule.つくられたとき(async function () {
  this.family = ('▼ ファミリー', Family.ドクリツ);
  this.hp = 10;
  this.atk = 1;
  this.scale(2, 2);
});
// ここからキャラクターがこうげきされたときに行うルール
rule.こうげきされたとき(async function () {
  await this.attack(); // こうげきする
  /*+ このキャラクターになにかする 条件 */
});
// ここまでキャラクターがこうげきされたときに行うルール
// ここからキャラクターがたおされたときのルール
rule.たおされたとき(async function () {
  Hack.score += 1;
  /*+ このキャラクターになにかする ゲーム全体になにかする 条件 */
});
// ここまでキャラクターがたおされたときのルール
/*+ ルールついか */

// ここまでミノタウルス

// ここからハート
window.__sandbox_context_name = 'ハート';

// ここからキャラクターがつくられたとき行うルール
rule.つくられたとき(async function () {});
// ここからキャラクターがふまれたときのルール
rule.item = 'プレイヤー';
rule.ふまれたとき(async function (item) {
  item.hp += 1;
  this.destroy();
  /*+ このキャラクターになにかする ゲーム全体になにかする 条件 */
});
// ここまでキャラクターがふまれたときのルール
/*+ ルールついか */

// ここまでハート

// ここからコイン
window.__sandbox_context_name = 'コイン';

// ここからキャラクターがつくられたとき行うルール
rule.つくられたとき(async function () {
  this.velocity(1, 0);
  this.force(0, 0.5);
});
// ここからキャラクターがぶつかったときのルール
rule.item = 'プレイヤー';
rule.ぶつかったとき(async function (item) {
  this.destroy();
  Hack.score += 1;
  /*+ このキャラクターになにかする ゲーム全体になにかする 条件 */
});
// ここまでキャラクターがぶつかったときのルール
/*+ ルールついか */

// ここまでコイン

// ここからスター
window.__sandbox_context_name = 'スター';

// ここからキャラクターがつくられたとき行うルール
rule.つくられたとき(async function () {});
// ここまでキャラクターがつくられたとき行うルール
// ここからキャラクターがふまれたときのルール
rule.item = 'プレイヤー';
rule.ふまれたとき(async function (item) {
  item.damageTime = 100;
  this.destroy();
  /*+ このキャラクターになにかする ゲーム全体になにかする 条件 */
});
// ここまでキャラクターがふまれたときのルール
/*+ ルールついか */

// ここまでスター

// ここからふしぎなカギ
window.__sandbox_context_name = 'ふしぎなカギ';

// ここからキャラクターがつくられたとき行うルール
rule.つくられたとき(async function () {
  this.locate(random(0, 15), random(0, 10), 'map1');
});
// ここまでキャラクターがつくられたとき行うルール
// ここからキャラクターがふまれたときのルール
rule.item = 'プレイヤー';
rule.ふまれたとき(async function () {
  Hack.log('カチャリ という おと が きこえた');
  this.destroy();
  /*+ このキャラクターになにかする ゲーム全体になにかする 条件 */
});
// ここまでキャラクターがふまれたときのルール
/*+ ルールついか */

// ここまでふしぎなカギ
