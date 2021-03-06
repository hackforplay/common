import enchant from '../enchantjs/enchant';

enchant.Node.prototype.stop = function () {
  this._stop = true;
};

enchant.Node.prototype.resume = function () {
  this._stop = false;
};

enchant.Core.prototype._tick = function () {
  const e = new enchant.Event('enterframe');
  let now = window.getTime();
  const elapsed = (e.elapsed = now - this.currentTime);
  this.currentTime = now;
  this._actualFps = elapsed > 0 ? 1000 / elapsed : 0;
  const nodes = this.currentScene.childNodes.slice();
  const push = Array.prototype.push;

  while (nodes.length) {
    const node = nodes.pop();

    // added
    if (node._stop) continue;

    ++node.age;
    node.dispatchEvent(e);
    if (node.childNodes) {
      push.apply(nodes, node.childNodes);
    }
  }
  this.currentScene.age++;
  this.currentScene.dispatchEvent(e);
  this.dispatchEvent(e);
  this.dispatchEvent(new enchant.Event('exitframe'));
  this.frame++;
  now = window.getTime();
  this._requestNextFrame(1000 / this.fps - (now - this._calledTime));
};
