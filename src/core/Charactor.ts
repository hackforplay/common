import { Loader, Sprite } from 'pixi.js';
import { create } from './createAsset';
import * as settings from './settings';
import { skinLoader, SkinResource } from './skin-loader';
import { Dir, UnitVector } from './UnitVector';
import { World } from './World';

export class Charactor extends Sprite {
  atk = 1;
  damage?: number; // undefined means no damage
  forward = UnitVector.Down;
  hp?: number; // undefined means no life charactor
  weapons: string[] = []; // undefined item means empty damager
  readonly world: World;

  constructor(world: World) {
    super();
    this.world = world;
    this.world.addChild(this);
  }

  async attack(weaponNumber = 0) {
    const id = this.weapons[weaponNumber];
    if (id) {
      create({ id, world: this.world });
    } else {
      const damager = this.summon({});
      damager.damage = this.atk;
    }
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

  get d() {
    return this.forward.dir;
  }
  set d(value: Dir) {
    this.forward = UnitVector.fromDir(value);
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

  summon({ name = '', f = 1, r = 0, x = 0, y = 0 }) {
    const damager = new Charactor(this.world);
    damager.x = this.x + x + f * this.forward.x - r * this.forward.y;
    damager.y = this.y + y + f * this.forward.y + r * this.forward.x;
    return damager;
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
