import { Charactor } from './Charactor';
import { World } from './World';

type H1 = (this: Charactor) => void;

export interface InternalState {
  name: string;
  defaultCostume?: string;
  created?: H1[];
}

export type Utils = Parameters<
  Parameters<ReturnType<AssetSystem['createAsset']>>[0]
>[0];

export class AssetSystem {
  charactors = new Set<Charactor>();
  private newborns = new Map<string, Charactor[]>();
  states = new Map<string, InternalState>();
  readonly world: World;

  constructor(world: World) {
    this.world = world;
  }

  applyAsset(newborn: Charactor, name: string) {
    const array = this.newborns.get(name);
    if (array) {
      array.push(newborn);
    } else {
      this.newborns.set(name, [newborn]);
    }
  }

  private costume(state: InternalState) {
    return (name: string) => {
      state.defaultCostume = name;
      this.world.preloader.add(name, name);
    };
  }

  private create(state: InternalState) {
    return ({ x = 0, y = 0, m = 0, d = 0 }) => {
      const chara = this.world.createCharactor();
      chara.x = x;
      chara.y = y;
      chara.d = d;
      this.applyAsset(chara, state.name);
    };
  }

  createAsset(name: string) {
    const state = { name };
    this.states.set(name, state);
    let num = 1;
    let utils = {
      costume: this.costume(state),
      create: this.create(state),
      created: this.created(state)
    };
    return (task: (u: typeof utils) => void, cellId?: string) => {
      cellId = cellId || name + '_' + (num++).toString().padStart(5, '0');
      try {
        task(utils);
      } catch (error) {
        console.error(`Error in ${cellId}`);
        throw error;
      }
    };
  }

  private created(state: InternalState) {
    return (handler: (this: Charactor) => void) => {
      state.created = state.created || [];
      state.created.push(handler);
    };
  }

  update() {
    this.newborns.forEach((borns, name) => {
      const state = this.states.get(name);
      if (!state) return;
      for (const charactor of borns) {
        if (state.defaultCostume) {
          charactor.costume(state.defaultCostume);
        }
        if (state.created) {
          for (const handler of state.created) {
            handler.call(charactor);
          }
        }
      }
    });
    // Add to collection
    this.newborns.forEach(borns => {
      for (const newborn of borns) {
        this.charactors.add(newborn);
      }
    });
    this.newborns = new Map();
  }

  lateUpdate() {
    for (const living of Array.from(this.charactors)) {
      // Dead
      if (living.hp !== undefined && living.hp <= 0) {
        living.destroy();
        this.charactors.delete(living);
        continue;
      }
      // Over penetration
      if (living.penetrate >= 0 && living.penetratedCount > living.penetrate) {
        living.destroy();
        this.charactors.delete(living);
        continue;
      }
      // Lifetime
      living.age++;
      if (living.lifetime >= 0 && living.age > living.lifetime) {
        living.destroy();
        this.charactors.delete(living);
        continue;
      }
    }
  }
}
