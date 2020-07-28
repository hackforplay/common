import { Sprite, Texture } from 'pixi.js';

export default class SurfaceSprite extends Sprite {
  private _element: HTMLCanvasElement;

  public context: CanvasRenderingContext2D;

  public constructor(width: number, height: number) {
    super();

    this._element = document.createElement('canvas');
    this._element.width = width;
    this._element.height = height;
    this.context = this._element.getContext('2d')!;

    this.texture = Texture.from(this._element);
    this.resize(width, height);
  }

  public resize(width: number, height: number) {
    this._element.width = width;
    this._element.height = height;
    this.width = width;
    this.height = height;
    this.updateTexture();
  }

  public updateTexture() {
    this.texture.update();
  }
}
