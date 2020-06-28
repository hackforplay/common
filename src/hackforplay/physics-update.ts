import enchant from '../enchantjs/enchant';
import '../enchantjs/ui.enchant';
import game from './game';
import { getHack } from './get-hack';
import RPGObject from './object/object';
import './rpg-kit-main';

const Hack = getHack();

/**
 * Physics Update (廃止予定)
 * isKinematic === false のオブジェクトに対して物理演算を行う (現状では衝突判定も行っている)
 * この処理はメインループの中で最も高負荷になることがあり、FPS を下げていることが分かった https://bit.ly/2YCTDYY
 * walk などの "マス目" を使った表現とも相性が良くないので、将来的に廃止する予定
 *
 * [Case]                     : [Event]     : [Note]
 * Kinematics ===> Kinematics	: oncollided	: Need collisionFlag is true
 * Physics    ===> Physics    : oncollided	: Need collisionFlag is true, Change velocity
 * Physics    ===> Kinematics	: ontriggered	: Ignore collisionFlag, Don't change velocity
 */

export function physicsUpdate() {
  if (!Hack.world || Hack.world._stop) return; // ゲームがストップしている
  const frame = game.collisionFrames || 10;
  const physicsPhantom = RPGObject.collection.filter(function (item) {
    return !item.isKinematic && !item.collisionFlag && !item._stop;
  });
  const physicsCollision = RPGObject.collection.filter(function (item) {
    return !item.isKinematic && item.collisionFlag && !item._stop;
  });

  __physicsUpdateOnFrame(1, 1, physicsPhantom);
  for (let tick = 1; tick <= frame; tick++) {
    __physicsUpdateOnFrame(tick, frame, physicsCollision);
  }
  for (const item of physicsPhantom) {
    item.updateCollider(); // TODO: 動的プロパティ
  }
}

function __physicsUpdateOnFrame(
  tick: number,
  frame: number,
  physics: RPGObject[]
) {
  physics
    .map(function (self) {
      if (self._flyToward) {
        // flyToward() を使った Physics Update (暫定処理)
        const correction = 3.3; // 移動速度を walk と合わせるための係数
        self.velocityX = self._flyToward.x * self.speed * correction;
        self.velocityY = self._flyToward.y * self.speed * correction;
      } else {
        // force() を使った Physical Update (廃止予定)
        self.velocityX += self.accelerationX / frame;
        self.velocityY += self.accelerationY / frame;
      }
      self.x += self.velocityX / frame;
      self.y += self.velocityY / frame;
      // Intersects
      const intersects = self.intersect(RPGObject) as RPGObject[]; // TODO: これはバグ? intersect はマップに依らない判定のはず
      intersects.splice(intersects.indexOf(self), 1); // ignore self

      // Intersect on time (enter) or still intersect
      const entered = intersects.filter(function (item) {
        return (
          !self._preventFrameHits || self._preventFrameHits.indexOf(item) < 0
        );
      });
      self._preventFrameHits = intersects; // Update cache
      // Dispatch triggerenter event
      entered
        .filter(function (item) {
          return item.isKinematic;
        })
        .forEach(function (item) {
          self._ruleInstance?.runTwoObjectListener(
            'ぶつかったとき',
            self,
            item
          );
          self._ruleInstance?.runTwoObjectListener(
            'ぶつかったとき',
            item,
            self
          );
        });
      return {
        self: self,
        hits: entered.filter(function (item) {
          return !item.isKinematic && item.collisionFlag;
        })
      } as any;
    })
    .filter(function (item) {
      // ===> Physics collision
      return item.self.collisionFlag;
    })
    .filter(function (item) {
      const self = item.self;
      const event = (item.event = new enchant.Event('collided'));
      const hits = (event.hits = item.hits);
      const calc = (item.calc = {
        x: self.x,
        y: self.y,
        vx: self.velocityX,
        vy: self.velocityY
      });
      if (hits.length > 0) {
        // Hit objects
        event.hit = hits[0];
        const m1 = self.mass,
          m2 = hits[0].mass;
        calc.vx =
          ((m1 - m2) * self.velocityX + 2 * m2 * hits[0].velocityX) / (m1 + m2);
        calc.vy =
          ((m1 - m2) * self.velocityY + 2 * m2 * hits[0].velocityY) / (m1 + m2);
        event.map = false;
      } else if (self.collideMapBoader) {
        // マップの端にぶつかる処理
        const mapHitX =
            (self.velocityX < 0 && self.x <= 0) ||
            (self.velocityX > 0 && self.x + self.width >= game.width),
          mapHitY =
            (self.velocityY < 0 && self.y <= 0) ||
            (self.velocityY > 0 && self.y + self.height >= game.height);
        calc.x = mapHitX
          ? Math.max(0, Math.min(game.width - self.width, self.x))
          : self.x;
        calc.y = mapHitX
          ? Math.max(0, Math.min(game.height - self.height, self.y))
          : self.y;
        // calc.vx = (mapHitX ? -1 : 1) * self.velocityX;
        // calc.vy = (mapHitY ? -1 : 1) * self.velocityY;
        event.map = mapHitX || mapHitY;
      }
      event.item = event.hit; // イベント引数の統一
      return event.map || hits.length > 0;
    })
    .filter(function (item) {
      const self = item.self;
      const calc = item.calc;
      self.x = calc.x;
      self.y = calc.y;
      self.velocityX = calc.vx;
      self.velocityY = calc.vy;
      return true;
    })
    .forEach(function (obj) {
      obj.self.dispatchEvent(obj.event);
    });
}
