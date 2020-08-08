const window = require('./setup-jsdom').window;
const gl = require('gl');

// headless-gl が使えるかどうかのテスト
const ctx = gl(10, 10, { stencil: true });
if (ctx.getContextAttributes().stencil !== true) {
  throw new Error(
    `ctx.getContextAttributes().stencil === ${
      ctx.getContextAttributes().stencil
    }`
  );
}
const loseContext = ctx.getExtension('WEBGL_lose_context');
if (loseContext) {
  loseContext.loseContext();
}

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
