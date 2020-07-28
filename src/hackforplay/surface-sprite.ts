import { Sprite, Texture } from 'pixi.js';

export default class SurfaceSprite extends Sprite {
  private element: HTMLCanvasElement;

  public context: CanvasRenderingContext2D;

  public constructor(width: number, height: number) {
    super();

    this.element = document.createElement('canvas');
    this.element.width = width;
    this.element.height = height;
    this.context = this.element.getContext('2d')!;

    this.texture = Texture.from(this.element);
    this.resize(width, height);
  }

  public resize(width: number, height: number) {
    this.element.width = width;
    this.element.height = height;
    this.width = width;
    this.height = height;
    this.updateTexture();
  }

  public updateTexture() {
    this.texture.update();
  }
}
