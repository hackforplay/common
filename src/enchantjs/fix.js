import { errorInEvent } from '../hackforplay/stdlog';
import enchant, { CanvasRenderer } from './enchant';

if (enchant.Core.instance !== null) {
  throw new Error(
    'enchant/fix.js has loaded after game.start(). Please import it before'
  );
}

/**
 * 1 度だけ呼ばれるイベントリスナーを追加する
 * @param {string}   type     イベント名
 * @param {function} listener リスナー
 */
enchant.EventTarget.prototype.once = function once(type, listener) {
  this.on(type, function callback() {
    this.removeEventListener(type, callback);
    listener.apply(this, arguments);
  });
};

// Easing を文字列で指定できるようにする
const initializeTween = enchant.Tween.prototype.initialize;
enchant.Tween.prototype.initialize = function $initialize(params) {
  if (typeof params.easing === 'string') {
    params.easing = enchant.Easing[params.easing.toUpperCase()];
  }

  initializeTween.call(this, params);
};

// Event の第二引数に props を追加する
const initializeEvent = enchant.Event.prototype.initialize;
enchant.Event.prototype.initialize = function $initialize(name, props) {
  initializeEvent.call(this, name);

  if (!props) return;

  for (const key of Object.keys(props)) {
    const value = props[key];
    this[key] = value;
  }
};

enchant.Node.prototype.contains = function contains(x, y) {
  return (
    this.x <= x &&
    this.x + this.width >= x &&
    this.y <= y &&
    this.y + this.height >= y
  );
};

enchant.Node.prototype.name = 'Node';

// Node#order を追加
Object.defineProperty(enchant.Node.prototype, 'order', {
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
enchant.Group.prototype.sortChildren = function sortChildren() {
  this.childNodes.sort((a, b) => {
    return a.order - b.order;
  });

  if (!this._layers) return;

  for (const key of Object.keys(this._layers)) {
    const layer = this._layers[key];
    layer.childNodes.sort((a, b) => {
      return a.order - b.order;
    });
  }
};

/**
 * タイムラインの再生終了まで待機する
 * @return {Promise} Promise
 */
enchant.Timeline.prototype.async = function async() {
  return new Promise(resolve => {
    this.then(resolve);
  });
};

enchant.Map.prototype.cvsRender = function cvsRender(context) {
  if (!this.width || !this.height) return;

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

  const core = enchant.Core.instance;
  const surface = new enchant.Surface(width, height);
  this._surface = surface;
  const canvas = surface._element;
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
  let image, tileWidth, tileHeight, dx, dy;
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
  const row = (image.width / tileWidth) | 0;
  const col = (image.height / tileHeight) | 0;
  const left = Math.max(((x + dx) / tileWidth) | 0, 0);
  const top = Math.max(((y + dy) / tileHeight) | 0, 0);
  const right = Math.ceil((x + dx + width) / tileWidth);
  const bottom = Math.ceil((y + dy + height) / tileHeight);

  const source = image._element;
  const context = this._context;

  context.clearRect(x, y, width, height);
  for (let i = 0, len = this._data.length; i < len; i++) {
    const data = this._data[i];
    const r = Math.min(right, data[0].length);
    const b = Math.min(bottom, data.length);
    for (y = top; y < b; y++) {
      for (x = left; x < r; x++) {
        const n = data[y][x];
        if (0 <= n && n < row * col) {
          const sx = (n % row) * tileWidth;
          const sy = ((n / row) | 0) * tileHeight;
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

const canvasRenderer = CanvasRenderer.instance;

canvasRenderer.targetSurface = null;

canvasRenderer.render = function (context, node, event) {
  if (this.targetSurface) context = this.targetSurface.context;

  node.dispatchEvent(
    new enchant.Event('prerender', {
      canvasRenderer
    })
  );

  CanvasRenderer.prototype.render.call(this, context, node, event);

  node.dispatchEvent(
    new enchant.Event('postrender', {
      canvasRenderer
    })
  );
};

/*
CanvasRenderer.instance.render = function(context, node, event) {

	// safari 対策
	if (!node.scene && !node._scene) return;

	context = this.override || context;

	// render start
	this.listener.emit('renderStart', node);

	CanvasRenderer.prototype.render.call(this, context, node, event);

	// render end
	this.listener.emit('renderEnd', node);

	node.dispatchEvent(new enchant.Event(enchant.Event.RENDERED));
};

CanvasRenderer.instance.listener.on('renderStart', (node) => {

	if (!Hack.map || node !== enchant.Core.instance.rootScene._layers.Canvas) return;

	CanvasRenderer.instance.override = Hack.map._surface.context;

});
*/

function extend(base, func) {
  const init = base.prototype.initialize;
  base.prototype.initialize = function () {
    init.apply(this, arguments);
    func.call(this);
  };
}

extend(enchant.Group, function () {
  // 自動で子要素をソートするか
  // 重いのでデフォルトは false
  this.autoSorting = false;

  this.on('childadded', () => {
    if (this.autoSorting) {
      this.sortChildren();
    }
  });
});

extend(enchant.Scene, function () {
  // シーンは自動で子要素をソートする
  this.autoSorting = true;
});

const _addEventListener = enchant.EventTarget.prototype.addEventListener;
enchant.EventTarget.prototype.addEventListener = function addEventListener(
  type,
  listener
) {
  if (typeof listener !== 'function') {
    throw new TypeError(
      `Invalid listener ${listener} on addEventListener of type ${type}`
    );
  }
  _addEventListener.apply(this, arguments);
};

/**
 * dispatchEvent の例外を全て catch して IDE に流す
 */
enchant.EventTarget.prototype.dispatchEvent = function dispatchEvent(event) {
  try {
    event.target = this;
    event.localX = event.x - this._offsetX;
    event.localY = event.y - this._offsetY;
    if (
      'on' + event.type in this &&
      typeof this['on' + event.type] === 'function'
    ) {
      const res = this['on' + event.type](event);
      reportAsyncError(res, event, this);
    }
    let listeners = this._listeners[event.type];
    if (listeners != null) {
      listeners = listeners.slice();
      for (let i = 0, len = listeners.length; i < len; i++) {
        const res = listeners[i].call(this, event);
        reportAsyncError(res, event, this);
      }
    }
  } catch (error) {
    // イベントリスナーが同期関数だった場合の例外処理
    errorInEvent(error, this, event.type);
  }
};

/**
 * イベントリスナーが非同期関数だった場合の例外処理
 * @param {Promise|void} maybePromise
 */
function reportAsyncError(maybePromise, event, _this) {
  if (maybePromise instanceof Promise) {
    maybePromise.catch(error => errorInEvent(error, _this, event.type));
  }
}

/**
 * フォーカスが外れたとき, 全ての入力をオフにする
 */
window.addEventListener('blur', () => {
  const core = enchant.Core.instance;
  if (!core) return;
  const manager = core.keyboardInputManager;
  for (const key of Object.keys(manager.valueStore)) {
    if (manager.valueStore[key] === true) {
      // BinaryInput かつ state が true のとき
      manager.changeState(key, false);
    }
  }
});
