import { default as enchant } from '../enchantjs/enchant';
import '../enchantjs/ui.enchant';
import RPGObject from './object/object';

type Line = {
  text: string;
  width: number;
  height: number;
};

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

  private lines: Line[] = [];

  /**
   * enchant.js で使われる描画関数
   */
  public cvsRender(ctx: CanvasRenderingContext2D) {
    // 改行文字ごとに分割
    const lineTexts = this.text.split('\n');

    ctx.textBaseline = 'top';
    ctx.font = this.font;
    if (this.previousText !== this.text) {
      // テキストの内容が変わったので、幅と高さを再計算する
      this.lines = lineTexts.map<Line>(text => {
        const metrics = ctx.measureText(text);
        return {
          height: metrics.fontBoundingBoxDescent,
          text,
          width: metrics.width
        };
      });
      this.previousText = this.text;
    }

    const p = this.padding;
    let y = 0;
    for (let i = this.lines.length - 1; i >= 0; i--) {
      const { height, text, width } = this.lines[i];
      ctx.fillStyle = this.background;
      ctx.fillRect(-width / 2 - p, y - p, width + p * 2, height + p * 2); // 背景色を塗る
      ctx.fillStyle = this.color;
      ctx.fillText(text, -width / 2, y); // テキストを描画する
      y -= height + p * 2;
    }
  }
}
