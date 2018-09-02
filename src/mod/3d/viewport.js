import { Matrix } from 'mod/3d/math';

const Viewport = enchant.Class.create({
	fov: null,
	aspect: null,
	near: null,
	far: null,

	matrix: null,

	perspective(fov, aspect, near, far) {
		this.matrix = Matrix.perspective(fov, aspect, near, far);
	},

	getMatrix: function() {
		return this.matrix;
	}
});

export default Viewport;
