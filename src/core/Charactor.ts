import * as PIXI from 'pixi.js';
import * as settings from './settings';
import { Animation, ISkin, skinLoader, SkinResource } from './skinLoader';
import { Dir, UnitVector } from './UnitVector';
import { World } from './World';

export class Charactor {
  age = 0; // how long is it living
  atk = 1;
  currentAnimation = Animation.Idle;
  currentAnimationIndex = -1; // -1 means never animate
  currentAnimationSince = -1; // -1 means never animate
  currentAnimationWillStop = false; // true means stop animation next frame
  damage?: number; // undefined means no damage
  forward = UnitVector.Down;
  hp?: number; // undefined means no life charactor
  lifetime = -1; // -1 means live infinite, otherwise it survives until age == lifetime
  penetrate = 0; // 0 means won't penetrate, -1 means infinite penetration
  penetratedCount = 0; // times it penetrated
  skin?: ISkin;
  weapons: (string | undefined)[] = []; // undefined item means empty damager
  readonly world: World;

  constructor(world: World) {
    this.world = world;
  }

  animate(animationName: Animation) {
    this.currentAnimation = animationName;
    this.currentAnimationSince = this.age;
  }

  async attack(weaponNumber = 0) {
    const name = this.weapons[weaponNumber];
    const damager = this.summon({ name, f: 1 });
    if (name === undefined) {
      damager.damage = this.atk;
      damager.lifetime = 1;
    }
    this.animate(Animation.Attack);
  }

  async costume(name: string) {
    return new Promise<void>((resolve, reject) => {
      // TODO: preload
      const loader = new PIXI.Loader(settings.baseUrl);
      loader.use(skinLoader);
      loader.add(name, name, undefined, (resource: SkinResource) => {
        this.skin = resource.data;
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

  destroy() {
    this.sprite.destroy();
  }

  private _height = 1;
  get height() {
    return this._height;
  }
  set height(value) {
    this._height = value;
    const origin = this.skin
      ? this.skin.sprite.height / settings.skinResolution
      : 0;
    this.sprite.height = value * origin;
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

  private _sprite?: PIXI.Sprite;
  get sprite() {
    if (!this._sprite) {
      this._sprite = new PIXI.Sprite();
      this.world.cameraSystem.container.addChild(this._sprite);
    }
    return this._sprite;
  }
  set sprite(value) {
    if (this._sprite) {
      value.position = this._sprite.position;
      this._sprite.destroy();
      this.world.cameraSystem.container.removeChild(this._sprite);
    }
    this._sprite = value;
    this.world.cameraSystem.container.addChild(this._sprite);
    // call setter
    this.x = this.x;
    this.y = this.y;
    this.width = this.width;
    this.height = this.height;
  }

  summon({ name = '', f = 0, r = 0, x = 0, y = 0, d = this.d }) {
    const newborn = this.world.createCharactor(name);
    newborn.x = this.x + x + f * this.forward.x - r * this.forward.y;
    newborn.y = this.y + y + f * this.forward.y + r * this.forward.x;
    newborn.d = d;
    return newborn;
  }

  private _width = 1;
  get width() {
    return this._width;
  }
  set width(value) {
    this._width = value;
    const origin = this.skin
      ? this.skin.sprite.width / settings.skinResolution
      : 0;
    this.sprite.width = value * origin;
  }

  private _x = 0;
  get x() {
    return this._x;
  }
  set x(value) {
    this._x = value;
    const offset = this.skin ? this.skin.sprite.x / settings.skinResolution : 0;
    this.sprite.x = value * settings.tileSize + offset;
  }

  private _y = 0;
  get y() {
    return this._y;
  }
  set y(value) {
    this._y = value;
    const offset = this.skin ? this.skin.sprite.y / settings.skinResolution : 0;
    this.sprite.y = value * settings.tileSize + offset;
  }
}
