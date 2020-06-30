import * as enchant from '../enchantjs/enchant';
import SAT from '../lib/sat.min';
import { objectsInDefaultMap } from './cache';
import { getMaster, isOpposite } from './family';
import { default as game } from './game';
import { getHack } from './get-hack';
import RPGObject from './object/object';

const previousHitsMap = new WeakMap<RPGObject, WeakSet<RPGObject>>();
let damageObjects = [] as IDamageObject[];

export function damageUpdate() {
  const Hack = getHack();
  const nonDamagers = RPGObject.collection.filter(
    item =>
      !item.isInvincible &&
      !item.isDamageObject &&
      item.damageTime === 0 &&
      item.map === Hack.map // 今いるマップ
  ); // ダメージをうける可能性のあるオブジェクト

  // ダメージを与える可能性のあるオブジェクト
  // IDamageObject | RPGObject (isDamageObject)
  const damageObjectsInMap = damageObjects.filter(
    item => item.map === Hack.map
  );
  for (const item of objectsInDefaultMap()) {
    if (!item.isDamageObject) continue; // ダメージを持たない
    if (item.collisionFlag) continue; // collisionFlag が true なオブジェクトの当たり判定には未対応
    const collider = item.collider || item.colliders?.[0];
    if (!collider) continue; // collider がない
    damageObjectsInMap.push({
      attacker: item, // attacker が自分の場合がある
      collider,
      damage: item.damage,
      item: getMaster(item) || item, // 召喚者を与える
      map: item.map,
      onDamage() {
        // もし貫通限界を超えたらオブジェクトを破棄する
        item.addPenetratedCount();
      },
      reference: item,
      until: Infinity
    });
  }

  for (const damager of damageObjectsInMap) {
    // 接触している RPGObject を取得する
    const hits = nonDamagers.filter(item => {
      if (!isOpposite(item, damager.attacker)) {
        return false; // 敵対関係ではない
      }
      const col2 = item.collider || item.colliders?.[0];
      if (!col2) {
        return false;
      }
      const response = new SAT.Response();
      const collided = SAT.testPolygonPolygon(damager.collider, col2, response);
      // 重なっていないのに collided になる場合がある.
      // その場合は overlap (重なりの大きさ) が 0 になっている
      return collided && response && response.overlap !== 0;
    });

    // 直前の処理で触れていないものだけを対象にする
    const previousHitsSet = previousHitsMap.get(damager.reference);
    const newHits = previousHitsSet
      ? hits.filter(item => !previousHitsSet.has(item))
      : hits;
    previousHitsMap.set(damager.reference, new WeakSet(hits));

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
            attacker: damager.item, // attacker は弾などのエフェクトの場合もある
            item: damager.item, // 引数名の統一
            damage: damager.damage
          })
        );
      }
    }

    if (newHits.length > 0) {
      damager.onDamage();
    }
  }

  // 古くなったダメージオブジェクトを削除
  damageObjects = damageObjects.filter(item => item.until > game.frame);
}

interface IDamageObjectOptions {
  /**
   * ダメージを与える能力を持つ存在自身
   * ビームの場合はビーム、通常攻撃の場合は攻撃者
   */
  attacker: RPGObject;
  collider: any;
  damage: number;
  /**
   * "こうげきされたとき" トリガーに与える主体
   */
  item: RPGObject;
  map: any;
  /**
   * ダメージを与えたフレームに一度だけコールされる関数
   */
  onDamage(): void;
  /**
   * 何フレーム目 (game.frame) まで存在し続けるか
   */
  until: number;
}

interface IDamageObject extends IDamageObjectOptions {
  /**
   * 連続してダメージを与え続けないようにするための参照
   */
  reference: any;
}

/**
 * RPGObject でなない、プレーンなダメージオブジェクトを生成する
 */
export function createDamageObject(options: IDamageObjectOptions) {
  const damageObject = {
    ...options,
    reference: {} // ユニークなオブジェクトの参照を与える
  };
  damageObjects.push(damageObject);
  return damageObject;
}

/**
 * For debug
 */
export function getCurrentDamgeObjects() {
  return damageObjects;
}
