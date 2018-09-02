import gl from 'mod/3d/gl';

const Framebuffer = enchant.Class.create({
	initialize(width, height) {
		this.width = width;
		this.height = height;

		var frameBuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

		var depthBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
		gl.renderbufferStorage(
			gl.RENDERBUFFER,
			gl.DEPTH_COMPONENT16,
			width,
			height
		);

		gl.framebufferRenderbuffer(
			gl.FRAMEBUFFER,
			gl.DEPTH_ATTACHMENT,
			gl.RENDERBUFFER,
			depthBuffer
		);

		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		//
		var type = gl.RGB;

		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			type,
			width,
			height,
			0,
			type,
			gl.UNSIGNED_BYTE,
			null
		);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			texture,
			0
		);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		this.frameBuffer = frameBuffer;
		this.depthBuffer = depthBuffer;
		this.texture = texture;
	}
});

export default Framebuffer;
