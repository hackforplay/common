import { Charactor } from './Charactor';
import { World } from './World';

type H1 = (this: Charactor) => void;

export interface InternalState {
  world: World;
  id: string;
  defaultCostume?: string;
  created?: H1[];
}

export interface Utils {
  costume: ReturnType<typeof costume>;
  create: ReturnType<typeof create>;
  created: ReturnType<typeof created>;
}

export function createCreateAsset() {
  const world = new World();
  return (id: string) => createAsset(id, world);
}

let defaultWorld: World;
export function getDefaultWorld() {
  return defaultWorld || (defaultWorld = new World());
}

export function createAsset(id: string, world?: World) {
  world = world || getDefaultWorld();
  const state = { world, id };
  let num = 1;
  let utils: Utils;
  return (task: (utils: Utils) => void, cellId?: string) => {
    utils = utils || {
      costume: costume(state),
      create: create(state),
      created: created(state)
    };
    cellId = cellId || id + '_' + (num++).toString().padStart(5, '0');
    try {
      task(utils);
    } catch (error) {
      console.error(`Error in ${cellId}`);
      throw error;
    }
  };
}

function costume(state: InternalState) {
  return (name: string) => {
    state.defaultCostume = name;
    state.world.preloader.add(name, name);
  };
}

export function create(state: InternalState) {
  return ({ x = 0, y = 0, m = 0, d = 0 }) => {
    const chara = new Charactor(state.world);
    if (state.defaultCostume) {
      chara.costume(state.defaultCostume);
    }
    chara.x = x;
    chara.y = y;
    state.world.cameraSystem.container.addChild(chara.sprite);
    // TODO: call by AssetSystem
    if (state.created) {
      for (const handler of state.created) {
        handler.call(chara);
      }
    }
    state.world.preloader.on('load', () => {
      state.world.cameraSystem.container.addChild(chara.sprite);
    });
  };
}

function created(state: InternalState) {
  return (handler: (this: Charactor) => void) => {
    state.created = state.created || [];
    state.created.push(handler);
  };
}
