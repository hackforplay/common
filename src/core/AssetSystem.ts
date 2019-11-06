import { createAsset } from './createAsset';
import { World } from './World';

export class AssetSystem {
  readonly world: World;

  constructor(world: World) {
    this.world = world;
  }

  createAsset(id: string) {
    return createAsset(id, this.world);
  }
}
