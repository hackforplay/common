import { Vec3, Matrix } from 'mod/3d/math';
import Viewport from 'mod/3d/viewport';

import Camera from 'hackforplay/camera';

// カメラに次元の概念を追加する
Camera.prototype.dimension = 3;

// カメラ
var Camera3D = enchant.Class.create({
	viewport: null,

	target: null,
	position: null,
	up: null,

	initialize(name) {
		this.name = name;

		Camera3D.collection[name] = this;

		this.target = new Vec3(0, 0, 0);
		this.position = new Vec3(0, 0, 0);

		this.up = new Vec3(0, 1, 0);

		this.viewport = new Viewport();
	},

	matrix: null,
	matrixVP: null,

	update: function() {
		this.matrix = Matrix.lookAt(
			this.position.toArray(),
			this.target.toArray(),
			this.up.toArray()
		);

		this.matrixVP = Matrix.mulRow(this.matrix, this.viewport.matrix);
	},

	// ビュー行列 * プロジェクション行列を取得する
	getMatrixVP: function() {
		return this.matrixVP;
	}
});

Camera3D.collection = {};

Camera3D.active = null;

Camera3D.get = function(name) {
	return Camera3D.collection[name] || null;
};

Camera3D.set = function(name) {
	return (Camera3D.active = Camera3D.get(name));
};

export default Camera3D;
