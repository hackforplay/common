import { Core, Node, Event, Sprite, Surface, Group } from 'enchantjs/enchant';
import 'enchantjs/ui.enchant';
import 'enchantjs/fix';
import 'hackforplay/rpg-kit-main';
import Hack from './hack';

import { clamp } from 'hackforplay/utils/math-utils';

class Camera extends Sprite {
	constructor(x, y, w, h) {
		super(w, h);

		// this.opacity = 0.5;

		w = w || game.width;
		h = h || game.height;

		this.image = new Surface(w, h);

		this.w = w;
		this.h = h;

		this.x = x || 0;
		this.y = y || 0;

		this.background = '#000';

		this.enabled = true;
		this.target = null;
		this.center = null;
		this.clip = true;
		this.clipScaleFunction = Math.min;
		this.clamp = true;
		this.scale = 1.0;

		this.border = false;
		this.borderColor = '#000';
		this.borderLineWidth = 1;

		Hack.cameraGroup.addChild(this);
		Camera.collection.push(this);
	}

	get w() {
		return this.width;
	}
	set w(value) {
		this.width = value;
	}

	get h() {
		return this.height;
	}
	set h(value) {
		this.height = value;
	}

	resize(w, h) {
		w = Math.ceil(w);
		h = Math.ceil(h);

		if (!w || !h) return;
		if (this.w === w && this.h === h) return;

		this._width = w;
		this._height = h;

		if (this.image) {
			this.image.width = w;
			this.image.height = h;
			this.image._element.width = w;
			this.image._element.height = h;
		}

		this.dispatchEvent(new Event(Event.RESIZE));

		return this;
	}

	getCenter() {
		// center 固定
		if (this.center) return this.center;

		// target
		if (this.target && this.target instanceof RPGObject) {
			return this.target.center;
		}

		// マップの中心
		if (Hack.map) {
			const map = Hack.map;

			return {
				x: map.width / 2,
				y: map.height / 2
			};
		}

		console.error('Camera#getCenter');
	}

	getScale() {
		// クリップしない
		if (!this.clipScaleFunction) return this.scale;

		const x = Hack.map.width / this.w;
		const y = Hack.map.height / this.h;

		const clip = this.clipScaleFunction(x, y);
		if (this.scale > clip) return clip;

		return this.scale;
	}

	// 描画範囲を取得する
	getRenderRect() {
		var center = this.getCenter();

		var x = center.x;
		var y = center.y;

		var scale = this.getScale();

		var w = this.width * scale;
		var h = this.height * scale;

		x -= w / 2;
		y -= h / 2;

		var rect = {
			x: x,
			y: y,
			width: w,
			height: h
		};

		if (this.clamp) rect = this.clampRect(rect);

		return rect;
	}

	// 描画範囲を画面に収める
	clampRect(rect) {
		const { w, h } = this.getVisionSize();

		var over = false;

		var _d_x = false;
		var _d_y = false;

		if (w < rect.width) {
			_d_x = true;
			rect.x = (rect.width - w) / 2;
		}
		if (h < rect.height) {
			_d_y = true;
			rect.y = (rect.height - h) / 2;
		}

		var b = false;

		if (w > Hack.map.width) {
			_d_x = true;
			rect.x = -(w - Hack.map.width) / 2;
		}

		if (h > Hack.map.height) {
			_d_y = true;
			rect.y = -(h - Hack.map.height) / 2;
		}

		if (over || b) {
			return rect;
		}

		if (!_d_x) rect.x = clamp(rect.x, 0.0, Hack.map.width - w);
		if (!_d_y) rect.y = clamp(rect.y, 0.0, Hack.map.height - h);

		return rect;
	}

	_rectScale(rect, scale) {
		rect.x *= scale;
		rect.y *= scale;
		rect.width *= scale;
		rect.height *= scale;
		return rect;
	}

	// スクリーン座標をゲーム内座標に変換する
	projection(screenX, screenY) {
		const renderRect = this.getRenderRect();
		return [
			renderRect.x + (screenX - this.x) * (renderRect.width / this.width),
			renderRect.y + (screenY - this.y) * (renderRect.height / this.height)
		];
	}

	// カメラ上の座標を計算する
	getNodeRect(node) {
		var renderRect = this.getRenderRect();
		var scale = this.getScale();

		var x = node.x - renderRect.x;
		var y = node.y - renderRect.y;

		var rect = {
			x: x,
			y: y,
			width: node.width,
			height: node.height
		};

		return this._rectScale(rect, 1.0 / scale);
	}

	getVisionSize() {
		const scale = this.getScale();
		return {
			w: this.w * scale,
			h: this.h * scale
		};
	}

	zoom(value) {
		this.scale /= value;
	}

	borderStyle(lineWidth, color) {
		this.border = true;
		this.borderLineWidth = lineWidth;
		this.borderColor = color;
	}

	drawBorder() {
		if (!this.border) return;
		const context = this.image.context;
		context.strokeStyle = this.borderColor;
		context.lineWidth = this.borderLineWidth;
		context.strokeRect(0, 0, this.w, this.h);
	}

	render() {
		const context = this.image.context;

		var center = this.getCenter();

		if (!center) return;

		var x = center.x;
		var y = center.y;

		var rect = this.getRenderRect();
		var r = rect;

		if (this.background) {
			context.fillStyle = this.background;
			context.fillRect(0, 0, this.w, this.h);
		}

		this.image.context.drawImage(
			Hack.map._surface._element,

			r.x,
			r.y,
			r.width,
			r.height,
			0,
			0,
			this.w,
			this.h
		);

		this.drawBorder();
	}

	remove() {
		super.remove();
		Camera.collection = Camera.collection.filter(camera => {
			return camera !== this;
		});
	}

	_computeFramePosition() {
		// サイズが変更されたときに呼ばれる
		super._computeFramePosition();
		this.resize(this.w, this.h);
	}
}

Camera.collection = [];

// カメラを並べる
Camera.arrange = function(x, y, border, filter) {
	var for2d = function(x, y, callback) {
		for (var a = 0; a < x; ++a) {
			for (var b = 0; b < y; ++b) {
				callback(a, b);
			}
		}
	};

	// 枠を表示する
	if (border === undefined ? true : border) {
		Camera.collection.forEach(function(camera) {
			camera.border = true;
		});
	}

	// 並べるカメラだけ取得
	var index = 0;
	var cameras = Camera.collection.filter(
		filter ||
			function(camera) {
				return camera.enabled;
			}
	);

	// 再配置
	for2d(y, x, function(y2, x2) {
		if (index >= cameras.length) return;
		var camera = cameras[index++];

		camera.moveTo((game.width / x) * x2, (game.height / y) * y2);
		camera.resize(game.width / x, game.height / y);
	});
};

Camera.layout = Camera.arrange;

window.Camera = Camera;
Camera.main = Hack.camera;

export default Camera;
