import { between } from 'hackforplay/utils/math-utils';
import { roundRect } from 'hackforplay/utils/canvas2d-utils';
import { Event, EventTarget } from 'enchantjs/enchant';

/**
 * Canvas にボタンをレンダリングするクラス
 * @extends EventTarget
 */
export default class ButtonRenderer extends EventTarget {
	constructor(text, { x, y, w, h }) {
		super();
		this.text = text;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;

		this.interactable = true;
	}

	isHover(x, y, context) {
		if (!this.interactable) return false;

		// 画面上の x, y 座標
		const screenX = this.x + context.currentTransform.e;
		const screenY = this.y + context.currentTransform.f;
		// x, y が範囲内に入っているか
		return (
			between(Hack.mouseX, screenX, screenX + this.w) &&
			between(Hack.mouseY, screenY, screenY + this.h)
		);
	}

	update(context) {
		if (!this.interactable) return;

		if (Hack.mouseInput.press) {
			this._isTouch = this.isHover(Hack.mouseX, Hack.mouseY, context);
		}
		if (
			Hack.mouseInput.release &&
			this._isTouch &&
			this.isHover(Hack.mouseX, Hack.mouseY, context)
		) {
			this._isTouch = false;
			this.dispatchEvent(new Event('click'));
		}
	}

	render(context, props) {
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

		const x = this.x + context.currentTransform.e;
		const y = this.y + context.currentTransform.f;

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
