import * as enchant from '../enchantjs/enchant';
import SAT from '../lib/sat.min';
import { default as RPGObject } from './object/object';
import { isOpposite } from './family';
import game from './game';

game.on('enterframe', update);
export function unregister() {
  game.off('enterframe', update);
}

interface DamagePair {
  damager: RPGObject;
  damage?: number;
  attacker?: RPGObject;
}

const damagePairs: DamagePair[] = [];

/**
 * ダメージを与える MOD を生成する
 * @param damage
 * @param attacker
 */
export default function createDamageMod(damage?: number, attacker?: RPGObject) {
  return function damageMod(this: RPGObject) {
    this.isDamageObject = true; // ダメージ処理を行うフラグ
    this.collisionFlag = false; // ダメージオブジェクトそのものは, ぶつからない
    damagePairs.push({
      damager: this,
      damage,
      attacker
    });
  };
}

export function update() {
  const nonDamagers = RPGObject.collection.filter(item => !item.isDamageObject);

  for (const pair of [...damagePairs]) {
    // まだ damage object としてのこっているか
    const index = damagePairs.indexOf(pair);
    if (index === -1) continue;
    const { damager, attacker } = pair;
    const damage =
      typeof pair.damage === 'number' ? pair.damage : <number>damager.atk;
    if (
      !damager.parentNode ||
      !damager.isDamageObject ||
      damager.collisionFlag
    ) {
      damagePairs.splice(index, 1); // 配列から削除する
      continue;
    }

    // 接触している RPGObject を取得する
    const hits = nonDamagers.filter(item => {
      const cols1 = damager.colliders ? damager.colliders : [damager.collider];
      const cols2 = item.colliders ? item.colliders : [item.collider];
      for (const col1 of cols1) {
        for (const col2 of cols2) {
          const response = new SAT.Response();
          const collided = SAT.testPolygonPolygon(col1, col2, response);
          if (collided && response && response.overlap !== 0) {
            // 重なっていないのに collided になる場合がある.
            // その場合は overlap (重なりの大きさ) が 0 になっている
            return true;
          }
        }
      }
      return false;
    });

    // 攻撃する
    for (const object of hits) {
      // ダメージ処理
      //   従来は onattacked イベントハンドラを使っていたが,
      //   処理を上書きされないようここに移した
      if (!object.damageTime && isOpposite(object, damager)) {
        // ダメージ判定が起こる状態で, 敵対している相手(もしくはその関係者)なら

        object.damageTime = object.attackedDamageTime; // チカチカする
        if (typeof object.hp === 'number') {
          object.hp -= damage; // 体力が number なら減らす
        }
        // イベントを発火させる
        object.dispatchEvent(
          new enchant.Event('attacked', {
            attacker: attacker || damager, // attacker は弾などのエフェクトの場合もある
            item: attacker || damager, // 引数名の統一
            damage
          })
        );
      }
    }
  }
}
