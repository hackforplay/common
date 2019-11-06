import * as PIXI from 'pixi.js';
import * as settings from './settings';
import { World } from './World';

export class CameraSystem {
  // TODO: CameraComponent
  readonly container: PIXI.Container;
  readonly sprite: PIXI.Sprite;
  readonly texture: PIXI.RenderTexture;
  readonly world: World;

  constructor(world: World) {
    this.world = world;
    this.container = new PIXI.Container();

    const cameraBase = new PIXI.BaseRenderTexture({
      width: settings.tileSize * settings.column,
      height: settings.tileSize * settings.row,
      scaleMode: PIXI.SCALE_MODES.NEAREST,
      resolution: 1
    });
    this.texture = new PIXI.RenderTexture(cameraBase);
    this.sprite = new PIXI.Sprite(this.texture);

    world.app.stage.addChild(this.sprite);
  }

  update() {
    this.world.app.renderer.render(this.container, this.texture);
  }
}
