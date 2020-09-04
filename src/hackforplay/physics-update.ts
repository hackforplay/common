import SAT from '../lib/sat.min';
import { getHack } from './get-hack';
import RPGObject from './object/object';
import './rpg-kit-main';

const Hack = getHack();

const previousIntersectsMap = new WeakMap<RPGObject, WeakSet<RPGObject>>();

/**
 * Physics Update (廃止予定)
 * isKinematic === false のオブジェクトに対して物理演算を行う
 * この処理はメインループの中で最も高負荷になることがあり、FPS を下げていることが分かった https://bit.ly/2YCTDYY
 * walk などの "マス目" を使った表現とも相性が良くないので、将来的に廃止する予定
 */
export function physicsUpdate() {
  if (!Hack.world || Hack.world._stop) return; // ゲームがストップしている

  const physics = RPGObject.collection.filter(function (item) {
    return (
      !item.isKinematic && !item._stop && item.map === Hack.map && !item.frozen
    );
  });

  for (const self of physics) {
    if (self._flyToward) {
      // flyToward() を使った Physics Update (暫定処理)
      const correction = 3.3; // 移動速度を walk と合わせるための係数
      self.velocityX = self._flyToward.x * self.speed * correction;
      self.velocityY = self._flyToward.y * self.speed * correction;
    } else {
      // force() を使った Physical Update (廃止予定)
      self.velocityX += self.accelerationX;
      self.velocityY += self.accelerationY;
    }
    self.x += self.velocityX;
    self.y += self.velocityY;

    self.updateCollider(); // TODO: 動的プロパティ
  }
}
/**
 * Physics Collision (廃止予定)
 * isKinematic === false のオブジェクト X に対して接触判定を行う (collisionFlag は関係ない)
 * X が isKinematic === true && collisionFlag == true のオブジェクト Y と接触していた場合、 X, Y 互いに "ぶつかったとき" トリガーを発火させる
 */
export function physicsCollision() {
  if (!Hack.world || Hack.world._stop) return; // ゲームがストップしている

  const physics = RPGObject.collection.filter(
    item => !item.isKinematic && !item._stop && item.map === Hack.map
  );

  const collidables = RPGObject.collection.filter(
    item => item.isKinematic && item.collisionFlag && item.map === Hack.map
  );

  for (const self of physics) {
    const colsSelf = self.collider || self.colliders?.[0];
    if (!colsSelf) continue; // collider がない

    // Intersects
    const intersects = collidables.filter(item => {
      const colsItem = item.collider || item.colliders?.[0];
      if (!colsItem) return false; // collider がない

      const response = new SAT.Response();
      const collided = SAT.testPolygonPolygon(colsSelf, colsItem, response);
      // 重なっていないのに collided になる場合がある.
      // その場合は overlap (重なりの大きさ) が 0 になっている
      return collided && response && response.overlap !== 0;
    });

    // Intersect on time (enter) or still intersect
    const previousHits = previousIntersectsMap.get(self);
    const entered =
      previousHits === undefined
        ? intersects
        : intersects.filter(item => !previousHits.has(item));
    previousIntersectsMap.set(self, new WeakSet(intersects));

    // Dispatch triggerenter event
    for (const item of entered) {
      self._ruleInstance?.runTwoObjectListener('ぶつかったとき', self, item);
      self._ruleInstance?.runTwoObjectListener('ぶつかったとき', item, self);
    }
  }
}
