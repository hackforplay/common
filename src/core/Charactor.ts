import { Loader, Sprite } from 'pixi.js';
import * as settings from './settings';
import { skinLoader, SkinResource } from './skin-loader';
import { World } from './World';

export class Charactor extends Sprite {
  readonly world: World;

  constructor(world: World) {
    super();
    this.world = world;
  }

  async costume(name: string) {
    return new Promise<void>((resolve, reject) => {
      // TODO: preload
      const loader = new Loader(settings.baseUrl);
      loader.use(skinLoader);
      loader.add(name, name, undefined, (resource: SkinResource) => {
        super.texture = resource.texture;
        super.width = resource.data.sprite.width / 2;
        super.height = resource.data.sprite.height / 2;
        resolve();
      });
      loader.load();
    });
  }

  private _p = 0; // 0 is not player
  get p() {
    return this._p;
  }
  set p(p) {
    if (p) {
      this.world.players[p] = this;
    }
  }

  get x() {
    return super.x / settings.tileSize;
  }
  set x(value) {
    super.x = value * settings.tileSize;
  }
  get y() {
    return super.y / settings.tileSize;
  }
  set y(value) {
    super.y = value * settings.tileSize;
  }
}
