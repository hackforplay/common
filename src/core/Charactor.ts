import * as PIXI from 'pixi.js';
import * as settings from './settings';
import { Animation, ISkin, skinLoader, SkinResource } from './skinLoader';
import { Dir, UnitVector } from './UnitVector';
import { World } from './World';

export class Charactor {
  age = 0; // how long is it living
  atk = 1;
  damage?: number; // undefined means no damage
  forward = UnitVector.Down;
  hp?: number; // undefined means no life charactor
  lifetime = -1; // -1 means live infinite, otherwise it survives until age == lifetime
  penetrate = 0; // 0 means won't penetrate, -1 means infinite penetration
  penetratedCount = 0; // times it penetrated
  sprite: PIXI.Sprite = new PIXI.Sprite();
  weapons: (string | undefined)[] = []; // undefined item means empty damager
  readonly world: World;

  constructor(world: World) {
    this.world = world;
  }

  async animate(animationName: Animation) {
    if (this._spritessheet) {
      const frames = this._spritessheet.animations[animationName];
      if (!frames) return;
      const animatedSprite = new PIXI.AnimatedSprite(frames);
      this.sprite = animatedSprite;
      if (this._isLoop) {
        animatedSprite.loop = Boolean(this._isLoop[animationName]);
      }
      animatedSprite.play();
    }
  }

  async attack(weaponNumber = 0) {
    const name = this.weapons[weaponNumber];
    const damager = this.summon({ name, f: 1 });
    if (name === undefined) {
      damager.damage = this.atk;
      damager.lifetime = 1;
    }
  }

  /**
   * TODO: better structure for frames, animations and colliders
   */
  private _skin?: ISkin;
  private _spritessheet?: PIXI.Spritesheet;
  private _isLoop?: SkinResource['isLoop'];
  async costume(name: string) {
    return new Promise<void>((resolve, reject) => {
      // TODO: preload
      const loader = new PIXI.Loader(settings.baseUrl);
      loader.use(skinLoader);
      loader.add(name, name, undefined, (resource: SkinResource) => {
        this._skin = resource.data;
        this._spritessheet = resource.spritesheet;
        this._isLoop = resource.isLoop;
        this.sprite.texture = resource.texture;
        this.sprite.width = resource.data.sprite.width / 2;
        this.sprite.height = resource.data.sprite.height / 2;
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

  get height() {
    return this.sprite.height / settings.tileSize;
  }
  set height(value) {
    this.sprite.height = value * settings.tileSize;
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

  summon({ name = '', f = 0, r = 0, x = 0, y = 0, d = this.d }) {
    const newborn = this.world.createCharactor(name);
    newborn.x = this.x + x + f * this.forward.x - r * this.forward.y;
    newborn.y = this.y + y + f * this.forward.y + r * this.forward.x;
    newborn.d = d;
    return newborn;
  }

  get width() {
    return this.sprite.width / settings.tileSize;
  }
  set width(value) {
    this.sprite.width = value * settings.tileSize;
  }

  get x() {
    return this.sprite.x / settings.tileSize;
  }
  set x(value) {
    this.sprite.x = value * settings.tileSize;
  }

  get y() {
    return this.sprite.y / settings.tileSize;
  }
  set y(value) {
    this.sprite.y = value * settings.tileSize;
  }
}
