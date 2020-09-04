import enchant, { CanvasRenderer } from './enchant';

if (enchant.Core.instance !== null) {
  throw new Error(
    'enchant/fix.js has loaded after game.start(). Please import it before'
  );
}

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
