import { World } from './World';
import { Charactor } from './Charactor';

export class DamageSystem {
  readonly world: World;

  constructor(world: World) {
    this.world = world;
  }

  run() {
    const all = this.world.children as Charactor[];
    for (const damager of all) {
      const { damage } = damager;
      if (damage === undefined) continue;

      for (const target of all) {
        if (target.hp === undefined) continue;
        if (isHit(target, damager)) {
          target.hp -= damage;
          if (target.hp <= 0) {
            target.destroy();
          }
          damager.destroy();
          break;
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
  { position: { x: l0, y: t0 }, width: w0, height: h0 }: Charactor,
  { position: { x: l1, y: t1 }, width: w1, height: h1 }: Charactor
) {
  const r0 = l0 + w0,
    b0 = t0 + h0,
    r1 = l1 + w1,
    b1 = t1 + h1;
  const horizontal =
    (l0 < l1 && l1 < r0) || (l0 < r1 && r1 < r0) || (l1 < l0 && r0 < r1);
  const vertical =
    (t0 < t1 && t1 < b0) || (t0 < b1 && b1 < b0) || (t1 < t0 && b0 < b1);
  return horizontal && vertical;
}
