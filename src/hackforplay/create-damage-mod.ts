import * as enchant from '../enchantjs/enchant';
import SAT from '../lib/sat.min';
import RPGObject from './object/object';
import { isOpposite } from './family';
import game from './game';

game.on('enterframe', update);
export function unregister() {
  game.off('enterframe', update);
}

const attackerMap = new WeakMap<RPGObject, RPGObject>();

/**
 * ダメージを与える MOD を生成する
 * @param damage
 * @param attacker
 */
export default function createDamageMod(damage?: number, attacker?: RPGObject) {
  return function damageMod(this: RPGObject) {
    this.isDamageObject = true; // ダメージ処理を行うフラグ
    this.collisionFlag = false; // ダメージオブジェクトそのものは, ぶつからない
    this.damage = damage !== undefined ? damage : this.atk;
    if (attacker) {
      attackerMap.set(this, attacker);
    }
  };
}

export function update() {
  const nonDamagers = RPGObject.collection.filter(
    item => !item.isDamageObject && item.damageTime === 0 && item.scene
  ); // ダメージをうける可能性のあるオブジェクト

  const damagers = RPGObject.collection.filter(
    item =>
      item.isDamageObject &&
      item.scene && // 異なるマップのダメージオブジェクトはスキップ
      !item.collisionFlag // collisionFlag が true なオブジェクトの当たり判定には未対応
  );

  for (const damager of damagers) {
    const attacker = attackerMap.get(damager); // attacker が自分の場合は undefined かも知れない

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
            return isOpposite(item, damager); // 敵対関係のものだけを残す
          }
        }
      }
      return false;
    });

    for (const object of hits) {
      object.damageTime = object.attackedDamageTime; // チカチカする
      if (object.hasHp) {
        // TODO: これって nonDamagers の条件式に書くべきじゃ無いか?
        object.hp -= damager.damage; // 体力が number なら減らす
      }
      // イベントを発火させる
      object.dispatchEvent(
        new enchant.Event('attacked', {
          attacker: attacker || damager, // attacker は弾などのエフェクトの場合もある
          item: attacker || damager, // 引数名の統一
          damage: damager.damage
        })
      );
    }

    if (hits.length > 0) {
      // もし貫通限界を超えたらオブジェクトを破棄する
      damager.addPenetratedCount();
    }
  }
}
