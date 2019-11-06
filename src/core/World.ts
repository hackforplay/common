import * as PIXI from 'pixi.js';
import { AssetSystem } from './AssetSystem';
import { CameraSystem } from './CameraSystem';
import { Charactor } from './Charactor';
import { DamageSystem } from './DamageSystem';
import * as settings from './settings';

export interface IDisposable {
  dispose(): void;
}

export class World {
  app = new PIXI.Application({});
  assetSystem = new AssetSystem(this); // TODO: private
  cameraSystem = new CameraSystem(this); // TODO: private
  damageSystem = new DamageSystem(this); // TODO: private
  players: Charactor[] = [];
  preloader = new PIXI.Loader(settings.baseUrl);

  constructor() {
    const container = document.getElementById('hackforplay-common-container');
    if (!container) {
      throw new Error('#hackforplay-common-container not found');
    }
    container.appendChild(this.app.view);

    this._disposers.push(beFlexible(this));
  }

  get charactors() {
    return this.assetSystem.charactors;
  }

  createAsset(name: string) {
    return this.assetSystem.createAsset(name);
  }

  createCharactor(name?: string) {
    const chara = new Charactor(this);
    this.cameraSystem.container.addChild(chara.sprite);
    this.preloader.on('load', () => {
      this.cameraSystem.container.addChild(chara.sprite);
    });
    this.assetSystem.applyAsset(chara, name || '');
    return chara;
  }

  private _disposers: IDisposable[] = [];
  dispose() {
    for (const disposer of this._disposers) {
      disposer.dispose();
    }
  }

  static _defaultInstance?: World;
  static getDefault(): World {
    return World._defaultInstance || (World._defaultInstance = new World());
  }

  start() {
    this.preloader.load();
    this.app.ticker.add(() => {
      this.update();
    });
  }

  update() {
    this.damageSystem.update();
    this.assetSystem.update();
    this.cameraSystem.update();

    this.assetSystem.lateUpdate();
  }
}

function beFlexible({ app, cameraSystem }: World) {
  function resize() {
    if (!app.view.parentElement) return;
    const rect = app.view.parentElement.getBoundingClientRect();
    const { width, height } =
      rect.width * settings.ratio > rect.height
        ? { width: rect.height / settings.ratio, height: rect.height } // 横長
        : { width: rect.width, height: rect.width * settings.ratio }; // 縦長
    app.renderer.resize(width, height);
    cameraSystem.sprite.width = width;
    cameraSystem.sprite.height = height;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  return {
    dispose() {
      window.removeEventListener('resize', resize);
    }
  };
}
