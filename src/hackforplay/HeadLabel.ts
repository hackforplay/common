import { default as enchant } from '../enchantjs/enchant';
import '../enchantjs/ui.enchant';
import RPGObject from './object/object';

/**
 * キャラクターの頭上に表示するラベル
 */
export class HeadLabel extends enchant.Entity {
  private node: RPGObject;
  /**
   * 表示する文字列
   */
  public text = '';
  /**
   * 文字が変化したことを検知するための変数
   */
  private previousText = '';

  /**
   * 文字の余白
   */
  public padding = 4;
  /**
   * 文字の色
   */
  public color = 'rgba(255,255,255)';
  /**
   * 背景色
   */
  public background = 'rgba(0,0,0,0.5)';
  /**
   * CanvasRenderingContext2D に与えるフォント
   */
  public font = '14px mplus';
  /**
   * 描画領域の幅
   */
  public width = 0;
  /**
   * 描画領域の高さ
   */
  public height = 0;

  constructor(node: RPGObject) {
    super();
    this.node = node;
    node.parentNode?.addChild(this);
  }

  public onenterframe() {
    // 追従させる
    if (
      this.node.parentNode &&
      this.parentNode &&
      this.node.parentNode !== this.parentNode
    ) {
      this.node.parentNode.addChild(this);
    }
  }

  public onprerender() {
    // 追従させる
    this.x = this.node.x + this.node.width / 2 - this.width / 2;
    this.y = this.node.y;
  }

  /**
   * enchant.js で使われる描画関数
   */
  public cvsRender(ctx: CanvasRenderingContext2D) {
    ctx.textBaseline = 'top';
    ctx.font = this.font;
    if (this.previousText !== this.text) {
      // テキストの内容が変わったので、幅と高さを再計算する
      const metrics = ctx.measureText(this.text);
      this.width = metrics.width;
      this.height = metrics.actualBoundingBoxDescent;
      this.previousText = this.text;
    }

    // 背景色を塗る
    ctx.fillStyle = this.background;
    const p = this.padding;
    ctx.fillRect(-p, -p, this.width + p * 2, this.height + p * 2);

    // テキストを描画する
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, 0, 0);
  }
}
