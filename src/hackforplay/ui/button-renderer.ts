import { utils } from 'pixi.js';
import { getHack } from '../get-hack';
import { roundRect } from '../utils/canvas2d-utils';
import { between } from '../utils/math-utils';

const Hack = getHack();

/**
 * Canvas にボタンをレンダリングするクラス
 */
export default class ButtonRenderer extends utils.EventEmitter {
  public text: string;
  public x: number;
  public y: number;
  public w: number;
  public h: number;
  public interactable: boolean;

  public constructor(
    text: string,
    { x, y, w, h }: { x: number; y: number; w: number; h: number }
  ) {
    super();
    this.text = text;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    this.interactable = true;
  }

  public isHover(x: number, y: number, context: CanvasRenderingContext2D) {
    if (!this.interactable) return false;

    // 画面上の x, y 座標
    const screenX = this.x + context.getTransform().e;
    const screenY = this.y + context.getTransform().f;

    // x, y が範囲内に入っているか
    return (
      between(x, screenX, screenX + this.w) &&
      between(y, screenY, screenY + this.h)
    );
  }

  public update(context: CanvasRenderingContext2D) {
    if (!this.interactable) return;

    if (
      Hack.mouseInput.clicked &&
      this.isHover(Hack.mouseX, Hack.mouseY, context)
    ) {
      this.emit('click');
    }
  }

  public render(context: CanvasRenderingContext2D, props: any) {
    this.update(context);

    props = Object.assign(
      {
        backgroundColor: '#fff',
        borderColor: '#000',
        radius: 4,
        alpha: 1.0,
        borderWidth: 2,
        hoverBorderWidth: 4,
        color: '#000',
        align: 'center',
        baseline: 'middle',
        font: '20px sans-serif',
        padding: 4
      },
      props
    );

    context.globalAlpha = props.alpha;

    if (this.isHover(Hack.mouseX, Hack.mouseY, context)) {
      props.borderWidth = props.hoverBorderWidth;
    }

    const bw = props.borderWidth;

    context.fillStyle = props.borderColor;

    roundRect(
      context,
      this.x - bw / 2,
      this.y - bw / 2,
      this.w + bw,
      this.h + bw,
      4
    ).fill();

    context.fillStyle = props.backgroundColor;
    context.shadowBlur = 0;

    roundRect(
      context,
      this.x + bw / 2,
      this.y + bw / 2,
      this.w - bw,
      this.h - bw,
      props.radius
    ).fill();

    context.fillStyle = props.color;
    context.textAlign = props.align;
    context.textBaseline = props.baseline;
    context.font = props.font;

    context.fillText(
      this.text,
      this.x + this.w / 2,
      this.y + this.h / 2,
      this.w - props.padding * 2
    );

    context.globalAlpha = 1.0;
  }
}
