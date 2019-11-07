import { Charactor } from './Charactor';
import { World } from './World';

export class DamageSystem {
  readonly world: World;

  constructor(world: World) {
    this.world = world;
  }

  update() {
    for (const damager of this.world.charactors) {
      const { damage, penetrate } = damager;
      if (damage === undefined) continue;
      if (damager.penetratedCount > penetrate) continue;

      for (const target of this.world.charactors) {
        if (target.hp === undefined) continue;
        if (isHit(target, damager)) {
          target.hp -= damage;
          damager.penetratedCount++;
          if (damager.penetratedCount > penetrate) {
            break;
          }
        }
      }
    }
  }
}

/**
 * TODO: position between previous position
 * @param param0
 * @param param1
 */
export function isHit(
  { x: l0, y: t0, width: w0, height: h0 }: Charactor,
  { x: l1, y: t1, width: w1, height: h1 }: Charactor
) {
  // Normarize
  if (w0 < 0) {
    l0 += w0;
    w0 = -w0;
  }
  if (h0 < 0) {
    t0 += h0;
    h0 = -h0;
  }
  if (w1 < 0) {
    l1 += w1;
    w1 = -w1;
  }
  if (h1 < 0) {
    t1 += h1;
    h1 = -h1;
  }
  // XYWH to TRBL
  const r0 = l0 + w0,
    b0 = t0 + h0,
    r1 = l1 + w1,
    b1 = t1 + h1;
  const horizontal =
    (l0 < l1 && l1 < r0) || (l0 < r1 && r1 < r0) || (l1 <= l0 && r0 <= r1); // intersect left || intersect right || included
  const vertical =
    (t0 < t1 && t1 < b0) || (t0 < b1 && b1 < b0) || (t1 <= t0 && b0 <= b1); // intersect top || intersect bottom || included
  return horizontal && vertical;
}
