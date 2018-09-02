import {
	Event,
	EventTarget,
	Node,
	Group,
	Tween,
	Easing,
	Timeline
} from 'enchantjs/enchant';

/**
 * 1 度だけ呼ばれるイベントリスナーを追加する
 * @param {string}   type     イベント名
 * @param {function} listener リスナー
 */
EventTarget.prototype.once = function once(type, listener) {
	this.on(type, function callback() {
		this.removeEventListener(type, callback);
		listener.apply(this, arguments);
	});
};

// Easing を文字列で指定できるようにする
const initializeTween = Tween.prototype.initialize;
Tween.prototype.initialize = function $initialize(params) {
	if (typeof params.easing === 'string') {
		params.easing = Easing[params.easing.toUpperCase()];
	}

	initializeTween.call(this, params);
};

// Event の第二引数に props を追加する
const initializeEvent = Event.prototype.initialize;
Event.prototype.initialize = function $initialize(name, props) {
	initializeEvent.call(this, name);

	if (!props) return;

	for (const [key, value] of Object.entries(props)) {
		this[key] = value;
	}
};

Node.prototype.contains = function contains(x, y) {
	return (
		this.x <= x &&
		this.x + this.width >= x &&
		this.y <= y &&
		this.y + this.height >= y
	);
};

Node.prototype.name = 'Node';

// Node#order を追加
Object.defineProperty(Node.prototype, 'order', {
	get() {
		return this._order || 0;
	},
	set(value) {
		if (value === this._order) return;
		this._order = value;

		// childNodes の並びを再計算
		if (
			this.parentNode &&
			this.parentNode.sortChildren &&
			this.parentNode.autoSorting
		) {
			this.parentNode.sortChildren();
		}
	}
});

// 子要素を order でソートする
Group.prototype.sortChildren = function sortChildren() {
	this.childNodes.sort((a, b) => {
		return a.order - b.order;
	});

	if (!this._layers) return;

	for (const layer of Object.values(this._layers)) {
		layer.childNodes.sort((a, b) => {
			return a.order - b.order;
		});
	}
};

/**
 * タイムラインの再生終了まで待機する
 * @return {Promise} Promise
 */
Timeline.prototype.async = function async() {
	return new Promise(resolve => {
		this.then(resolve);
	});
};

enchant.Map.prototype.cvsRender = function cvsRender(context) {
	if (!this.width || !this.height) return;

	const core = Core.instance;
	const canvas = this._context.canvas;

	this.updateBuffer();
	context.save();
	context.setTransform(1, 0, 0, 1, 0, 0);
	context.drawImage(canvas, 0, 0);
	context.restore();
};

enchant.Map.prototype.redraw = function redraw(x, y, width, height) {
	x = 0;
	y = 0;
	width = this.width;
	height = this.height;

	var core = enchant.Core.instance;
	var surface = new enchant.Surface(width, height);
	this._surface = surface;
	var canvas = surface._element;
	canvas.style.position = 'absolute';
	if (enchant.ENV.RETINA_DISPLAY && core.scale === 2) {
		canvas.width = width * 2;
		canvas.height = height * 2;
		this._style.webkitTransformOrigin = '0 0';
		this._style.webkitTransform = 'scale(0.5)';
	} else {
		canvas.width = width;
		canvas.height = height;
	}
	this._context = canvas.getContext('2d');

	if (this._image == null) {
		return;
	}
	var image, tileWidth, tileHeight, dx, dy;
	if (this._doubledImage) {
		image = this._doubledImage;
		tileWidth = this._tileWidth * 2;
		tileHeight = this._tileHeight * 2;
		dx = -this._offsetX * 2;
		dy = -this._offsetY * 2;
		x *= 2;
		y *= 2;
		width *= 2;
		height *= 2;
	} else {
		image = this._image;
		tileWidth = this._tileWidth;
		tileHeight = this._tileHeight;
		dx = -this._offsetX;
		dy = -this._offsetY;
	}
	var row = (image.width / tileWidth) | 0;
	var col = (image.height / tileHeight) | 0;
	var left = Math.max(((x + dx) / tileWidth) | 0, 0);
	var top = Math.max(((y + dy) / tileHeight) | 0, 0);
	var right = Math.ceil((x + dx + width) / tileWidth);
	var bottom = Math.ceil((y + dy + height) / tileHeight);

	var source = image._element;
	var context = this._context;
	var canvas = context.canvas;

	context.clearRect(x, y, width, height);
	for (var i = 0, len = this._data.length; i < len; i++) {
		var data = this._data[i];
		var r = Math.min(right, data[0].length);
		var b = Math.min(bottom, data.length);
		for (y = top; y < b; y++) {
			for (x = left; x < r; x++) {
				var n = data[y][x];
				if (0 <= n && n < row * col) {
					var sx = (n % row) * tileWidth;
					var sy = ((n / row) | 0) * tileHeight;
					context.drawImage(
						source,
						sx,
						sy,
						tileWidth,
						tileHeight,
						x * tileWidth - dx,
						y * tileHeight - dy,
						tileWidth,
						tileHeight
					);
				}
			}
		}
	}

	if (this.overwrite) {
		// RPGMap の background or foreground に画像が指定されている場合、その画像で上書きする
		surface.draw(this.overwrite, x, y, width, height);
	}
};

enchant.Event.RESIZE = 'resize';
enchant.Event.RENDERED = 'rendered';

import { CanvasRenderer } from 'enchantjs/enchant';

const canvasRenderer = CanvasRenderer.instance;

canvasRenderer.targetSurface = null;

canvasRenderer.render = function(context, node, event) {
	if (this.targetSurface) context = this.targetSurface.context;

	node.dispatchEvent(
		new Event('prerender', {
			canvasRenderer
		})
	);

	enchant.CanvasRenderer.prototype.render.call(this, context, node, event);

	node.dispatchEvent(
		new Event('postrender', {
			canvasRenderer
		})
	);
};

/*
enchant.CanvasRenderer.instance.render = function(context, node, event) {

	// safari 対策
	if (!node.scene && !node._scene) return;

	context = this.override || context;

	// render start
	this.listener.emit('renderStart', node);

	enchant.CanvasRenderer.prototype.render.call(this, context, node, event);

	// render end
	this.listener.emit('renderEnd', node);

	node.dispatchEvent(new enchant.Event(enchant.Event.RENDERED));
};

enchant.CanvasRenderer.instance.listener.on('renderStart', (node) => {

	if (!Hack.map || node !== enchant.Core.instance.rootScene._layers.Canvas) return;

	enchant.CanvasRenderer.instance.override = Hack.map._surface.context;

});
*/

function extend(base, func) {
	const init = base.prototype.initialize;
	base.prototype.initialize = function() {
		init.apply(this, arguments);
		func.call(this);
	};
}

extend(enchant.Group, function() {
	// 自動で子要素をソートするか
	// 重いのでデフォルトは false
	this.autoSorting = false;

	this.on('childadded', a => {
		if (this.autoSorting) {
			this.sortChildren();
		}
	});
});

extend(enchant.Scene, function() {
	// シーンは自動で子要素をソートする
	this.autoSorting = true;
});
