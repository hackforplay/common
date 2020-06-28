import enchant from '../enchantjs/enchant';
import '../enchantjs/ui.enchant';
import game from './game';
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
    return !item.isKinematic && !item._stop;
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
 * isKinematic === false のオブジェクトに対して接触判定を行う
 * isKinematic なオブジェクトと接触していた場合は "ぶつかったとき" トリガーを発火させる
 */
export function physicsCollision() {
  if (!Hack.world || Hack.world._stop) return; // ゲームがストップしている

  const physics = RPGObject.collection.filter(
    item => !item.isKinematic && !item._stop
  );

  physics.map(function (self) {
    // Intersects
    const intersects = self.intersect(RPGObject) as RPGObject[]; // TODO: これはバグ? intersect はマップに依らない判定のはず
    intersects.splice(intersects.indexOf(self), 1); // ignore self

    // Intersect on time (enter) or still intersect
    const previousHits = previousIntersectsMap.get(self);
    const entered =
      previousHits === undefined
        ? intersects
        : intersects.filter(item => !previousHits.has(item));
    previousIntersectsMap.set(self, new WeakSet(intersects));

    // Dispatch triggerenter event
    entered
      .filter(function (item) {
        return item.isKinematic;
      })
      .forEach(function (item) {
        self._ruleInstance?.runTwoObjectListener('ぶつかったとき', self, item);
        self._ruleInstance?.runTwoObjectListener('ぶつかったとき', item, self);
      });
  });
}
