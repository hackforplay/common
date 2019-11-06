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
  assetSystem = new AssetSystem(this);
  cameraSystem = new CameraSystem(this);
  charactors: Charactor[] = [];
  damageSystem = new DamageSystem(this);
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

  private _disposers: IDisposable[] = [];
  dispose() {
    for (const disposer of this._disposers) {
      disposer.dispose();
    }
  }

  start() {
    this.preloader.load();
    this.app.ticker.add(() => {
      this.update();
    });
  }

  update() {
    this.damageSystem.run();
    this.cameraSystem.update();
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
