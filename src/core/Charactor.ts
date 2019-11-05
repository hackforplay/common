import { Loader, Sprite } from 'pixi.js';
import * as settings from './settings';
import { skinLoader, SkinResource } from './skin-loader';

export class Charactor extends Sprite {
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
