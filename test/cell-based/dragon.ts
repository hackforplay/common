/**
 * Jupytor Notebook 的な書き方。セル単位でコードを書く
 * セルごとに編集、実行、複製、削除が出来る
 * ドキュメント単位でキャラクターを切り替えられる
 */

import { create, init, setThis, loop, bump } from '../../src/index'; // このコードは全てのセルの実行直前に自動挿入される。表にはかかれない
setThis('.dragon/red'); // このコードは全てのセルの実行直前に自動挿入される。表にはかかれない

/**
 * # これはドラゴンについて書かれたコードです
 */

/*
 * ## まずはドラゴンをマップに配置しましょう
 *
 * x は 左 から何マス目か,
 * y は 上 から何マス目か,
 * z は どのマップか,
 * f は 顔の向きが 0:右, 1:上, 2: 左, 3: 下 を表します
 */

create({ x: 7, y: 5, z: 1, f: 2 });

/**
 * ## ドラゴンのつよさは？
 */
init(async function() {
  this.hp = 3;
  this.atk = 1;
});

/**
 * ## ドラゴンは、どんな風にうごく？
 *
 * ここに書かれたコードは、ずっとくり返すようになっています
 */
loop(async function() {
  await this.attack();
  await this.wait(1);
});

/**
 * ## ドラゴンとキャラクターとぶつかったときは、どうなる？
 *
 * ```
 * if (item.is('.player/_1')) {
 *
 * }
 * ```
 * を使うと、特定のキャラクターとぶつかった時に何をするかが書けるよ
 */

bump(async function(item: any) {
  if (item.is('.player/_1')) {
    await this.attack();
  }
});
