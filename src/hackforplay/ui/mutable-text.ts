import { BaseTexture, Container, Rectangle, Sprite, Texture } from 'pixi.js';
import { getHack } from '../get-hack';

const Hack = getHack();

export default class MutableText extends Container {
  private _text = '';
  private _sprites: Sprite[] = [];

  public fontSize: number;
  public widthItemNum: number;
  public returnLength = 0;
  public maxWidth = 480;

  private static _baseTexture = new BaseTexture(
    Hack.basePath + 'resources/enchantjs/font0.png'
  );

  public constructor() {
    super();
    this.fontSize = 16;
    this.widthItemNum = 16;

    this.text = '';
    if (arguments[2]) {
      this.row = Math.floor(arguments[2] / this.fontSize);
    }
  }

  public setText(text: string) {
    const newSprites = Array.from(
      { length: text.length - this._sprites.length },
      () => new Sprite(Texture.EMPTY)
    );

    for (const sprite of newSprites) {
      this.addChild(sprite);
    }

    this._sprites.push(...newSprites);

    for (let i = 0; i < this._sprites.length; i++) {
      this._sprites[i].visible = text.length - 1 >= i;
    }

    this._text = text;
    if (!this.returnLength) {
      this.width = Math.min(this.fontSize * this._text.length, this.maxWidth);
    } else {
      this.width = Math.min(this.returnLength * this.fontSize, this.maxWidth);
    }
    this.height =
      this.fontSize * (Math.ceil(this._text.length / this.row) || 1);

    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      let charPos = 0;
      if (charCode >= 32 && charCode <= 127) {
        charPos = charCode - 32;
      }
      const x = charPos % this.widthItemNum;
      const y = (charPos / this.widthItemNum) | 0;

      const sprite = this._sprites[i];

      sprite.texture = new Texture(
        MutableText._baseTexture,
        new Rectangle(
          x * this.fontSize,
          y * this.fontSize,
          this.fontSize,
          this.fontSize
        )
      );
      sprite.width = this.fontSize;
      this;
      sprite.position.set(
        (i % this.row) * this.fontSize,
        ((i / this.row) | 0) * this.fontSize
      );
    }
  }

  public get text() {
    return this._text;
  }

  public set text(value: string) {
    this.setText(value);
  }

  public get row() {
    return this.returnLength || this.width / this.fontSize;
  }

  public set row(row) {
    this.returnLength = row;
    this.text = this.text;
  }
}
