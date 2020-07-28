import { BaseTexture, Container, Sprite, Texture } from 'pixi.js';
import { EnchantSurface } from '../enchantjs/types';
import { computeFrame } from './utils/computeFrame';

export default class PixiMap extends Container {
  public name = '';

  private _data?: number[][];

  private _image?: EnchantSurface;

  private _baseTexture: BaseTexture | undefined;

  public set image(image: EnchantSurface) {
    this._image = image;
    this._baseTexture = new BaseTexture(image._element);

    if (this._baseTexture.valid) this._renderMap();
    this._baseTexture.on('loaded', () => {
      this._renderMap();
    });
  }

  // TODO: boolean にするか検討する
  public collisionData: (0 | 1)[][] = [];

  public readonly tileWidth: number;
  public readonly tileHeight: number;

  public get width() {
    if (!this._data) return 0;
    return this.tileWidth * this._data[0].length;
  }

  public get height() {
    if (!this._data) return 0;
    return this.tileHeight * this._data.length;
  }

  public constructor(tileWidth: number, tileHeight: number) {
    super();

    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
  }

  // TODO: RenderTexture などに描画してキャッシュできないか検討する
  private _renderMap() {
    if (!this._data) return;
    if (!this._baseTexture?.valid) return;

    const data = this._data;

    for (let y = 0; y < data.length; y++) {
      for (let x = 0; x < data[y].length; x++) {
        const frame = computeFrame(
          data[y][x],
          this.tileWidth,
          this.tileHeight,
          this._baseTexture.width,
          this._baseTexture.height
        );

        const sprite = new Sprite(new Texture(this._baseTexture, frame));
        sprite.x = x * this.tileWidth;
        sprite.y = y * this.tileHeight;
        this.addChild(sprite);
      }
    }
  }

  public loadData(data: number[][]) {
    this._data = data;
    this._renderMap();
  }

  public hitTest(x: number, y: number): boolean {
    if (!this._data) return false;
    if (x < 0 || this.width <= x || y < 0 || this.height <= y) {
      return false;
    }

    const width = this._image?.width ?? 0;
    const height = this._image?.height ?? 0;
    const tileWidth = this.tileWidth || width;
    const tileHeight = this.tileHeight || height;
    x = (x / tileWidth) | 0;
    y = (y / tileHeight) | 0;
    if (this.collisionData != null) {
      return this.collisionData[y] && !!this.collisionData[y][x];
    } else {
      const data = this._data;
      let n;
      if (
        data[y] != null &&
        (n = data[y][x]) != null &&
        0 <= n &&
        n < ((width / tileWidth) | 0) * ((height / tileHeight) | 0)
      ) {
        return true;
      }
      return false;
    }
  }

  public getData(x: number, y: number) {
    return this._data?.[y]?.[x] ?? -1;
  }
}
