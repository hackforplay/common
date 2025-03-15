import * as enchant from '../../enchantjs/enchant';
import { getHack } from '../get-hack';
import { convertHankakuToZenkaku } from './textarea';
import { fillTextWithBorders, getBorderWidth } from './fill-text-with-borders';

/**
 * ui.enchant.js の MutableText のように使えるラベル
 * ただし PixelMplus フォントを使ってレンダリングする
 * 描画領域の最大幅 (width) の指定は実装していない
 * 外部からアクセスされることのないプロパティは実装しない
 * - widthItemNum:  ASCII コード１文字あたりの文字幅
 * - _imageAge:     省メモリ化のための内部変数
 * - row:           １行あたりに収められる文字数
 * -
 */
export class MutableText extends enchant.Sprite {
  static fontFamily = 'mplus, monospace';

  fontSize: number;
  private _text = '';
  width = 0;
  height = 0;

  _cvsCache = undefined;
  childNodes = undefined;
  _stop = false;

  constructor(x?: number, y?: number) {
    super(x, y);

    this.fontSize = 12;
    this.x = x;
    this.y = y;
  }

  setText(value: string) {
    if (!getHack()?.disableZenkakuMode) {
      value = convertHankakuToZenkaku(value);
    }
    this._text = value;
    const border = getBorderWidth(this.fontSize) + 1;
    this.width = getWidth(value, this.fontSize) + border * 2;
    this.height = this.fontSize + border * 2;
    this.image = new enchant.Surface(this.width, this.height);
    const context = this.image.context as CanvasRenderingContext2D;
    if (context) {
      fillTextWithBorders(
        context,
        this.fontSize,
        'white',
        'black',
        value,
        border,
        this.fontSize
      );
    }
  }

  get text() {
    return this._text;
  }
  set text(value) {
    // setter で高負荷な処理をするアンチパターンを踏んでいたので
    // 比較処理を追加した
    if (value !== this._text) {
      this.setText(value);
    }
  }
}

let ctx: CanvasRenderingContext2D;
function getWidth(text: string, fontSize: number) {
  ctx = ctx || document.createElement('canvas').getContext('2d');
  if (!ctx) {
    // 計算できないので等幅として扱う
    return text.length * fontSize;
  }
  ctx.font = `${fontSize}px ${MutableText.fontFamily}`;
  const { width } = ctx.measureText(text);
  if (width === 0 && text !== '') {
    // 計算できないので等幅として扱う
    return text.length * fontSize;
  }
  return width;
}
