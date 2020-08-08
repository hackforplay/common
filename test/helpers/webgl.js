const window = require('./setup-jsdom').window;
const gl = require('gl');

// headless-gl が使えるかどうかのテスト
const {
  WebGLRenderingContext
} = require('gl/src/javascript/webgl-rendering-context');
new WebGLRenderingContext(
  1,
  1,
  true,
  true,
  false,
  false,
  true,
  false,
  false,
  false
);

// WebGLRenderingContext をうまく取り出せないので、とりあえず何か入れる
window.WebGLRenderingContext = global.WebGLRenderingContext = true;

/**
 * Canvas mock
 * Ref: https://github.com/jsdom/jsdom/blob/2a9482c3a808d2c76602b0e7498048d83d00a4f0/lib/jsdom/living/nodes/HTMLCanvasElement-impl.js#L16-L21
 */
const getContextOrigin = window.HTMLCanvasElement.prototype.getContext;
window.HTMLCanvasElement.prototype.getContext = function getContext(
  contextId,
  options
) {
  if (contextId === 'webgl') {
    this._webglContext =
      this._webglContext || gl(this.width, this.height, options);
    return this._webglContext;
  }
  return getContextOrigin.apply(this, arguments);
};
