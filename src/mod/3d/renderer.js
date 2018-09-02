import gl from 'mod/3d/gl';

// Renderer

// 仮
var Renderer = {};

Renderer.activePrimitive = null;

Renderer.clear = function(r, g, b, a) {
	gl.clearColor(r, g, b, a);
	gl.clearDepth(1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};

Renderer.setFrameBuffer = function(frameBuffer) {
	gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
};

export default Renderer;
