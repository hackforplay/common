import * as enchant from '../enchantjs/enchant';
import SAT from '../lib/sat.min';
import { getMaster, isOpposite } from './family';
import { getHack } from './get-hack';
import RPGObject from './object/object';

const previousHitsMap = new WeakMap<RPGObject, WeakSet<RPGObject>>();

export function damageUpdate() {
  const Hack = getHack();
  const nonDamagers = RPGObject.collection.filter(
    item =>
      !item.isInvincible &&
      !item.isDamageObject &&
      item.damageTime === 0 &&
      item.map === Hack.map // 今いるマップ
  ); // ダメージをうける可能性のあるオブジェクト

  const damagers = RPGObject.collection.filter(
    item =>
      item.isDamageObject &&
      item.map === Hack.map && // 異なるマップのダメージオブジェクトはスキップ
      !item.collisionFlag // collisionFlag が true なオブジェクトの当たり判定には未対応
  );

  for (const damager of damagers) {
    const attacker = getMaster(damager); // attacker が自分の場合は undefined かも知れない

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

    // 直前の処理で触れていないものだけを対象にする
    const previousHitsSet = previousHitsMap.get(damager);
    const newHits = previousHitsSet
      ? hits.filter(item => !previousHitsSet.has(item))
      : hits;
    previousHitsMap.set(damager, new WeakSet(hits));

    if (Hack.isPlaying) {
      // ゲームが継続している間しかダメージは入らないが、当たり判定はある
      for (const object of newHits) {
        if (object.hasHp) {
          object.damageTime = object.attackedDamageTime; // チカチカする
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
    }

    if (newHits.length > 0) {
      // もし貫通限界を超えたらオブジェクトを破棄する
      damager.addPenetratedCount();
    }
  }
}
