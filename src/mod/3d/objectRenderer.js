import 'hackforplay/core';

import gl from 'mod/3d/gl';

import Texture from 'mod/3d/texture';
import { Matrix } from 'mod/3d/math';
import Camera3D from 'mod/3d/camera3D';
import Program from 'mod/3d/program';

import { plane2, plane, model2d } from 'mod/3d/definePrimitive';

enchant.Class.createStatic = function() {
	return new (enchant.Class.create.apply(this, arguments))();
};

const ObjectType = {
	GROUND: 'ground',
	MODEL: 'model',

	SURFACE3D: 'surface3D',

	OBJ_MODEL: 'obj-model',

	BLOCK: 'block'
};

const RenderPass = {
	DEPTH: 'depth',
	MAIN: 'main'
};

const ObjectRenderer = enchant.Class.createStatic({
	nodes: null,

	initialize() {
		this.nodes = {};

		for (var key in ObjectType) {
			this.nodes[ObjectType[key]] = [];
		}
	},

	update() {
		Object.keys(this.nodes).forEach(function(key) {
			this.nodes[key] = [];
		}, this);

		RPGObject.collection.forEach(node => {
			// 非表示ノードは無視
			if (!node.visible) return;

			var type = null;

			if (node.isGround) {
				type = ObjectType.GROUND;
			} else {
				type = ObjectType.MODEL;
			}

			if (
				node.image._css === 'url(enchantjs/x2/dotmat.gif)' &&
				MapObject3D.get(node.frame)
			) {
				type = ObjectType.OBJ_MODEL;
			}

			if (node.isBlock) type = ObjectType.BLOCK;

			if (!type) return;

			node.type = type;

			this.nodes[type].push(node);
		});
	},

	render(node) {
		ObjectRenderer.render[node.type](node);
	}
});

ObjectRenderer.pass = RenderPass.DEPTH;

// 全てのオブジェクトで共通の行列処理を行う
ObjectRenderer.mainPassUniformMatrix = function(node, matrixM) {
	var matrixVP = Camera3D.active.matrixVP;
	var matrixMVP = Matrix.mulRow(matrixM, matrixVP);

	Program.uniform('mat4', 'matrix', false, matrixMVP);

	// メインパスなら
	if (ObjectRenderer.pass === RenderPass.MAIN) {
		var matrixLightVP = Camera3D.get('light').getMatrixVP();
		var matrixLightMVP = Matrix.mulRow(matrixM, matrixLightVP);

		Program.uniform('mat4', 'mMatrix', false, matrixM);
		Program.uniform('mat4', 'matrixLight', false, matrixLightMVP);
	}
};

ObjectRenderer.render[ObjectType.BLOCK] = function(node) {
	// テクスチャをバインド
	Texture.fromNode(node).bind();
	if (Texture.bindError) return;

	// M Matrix を更新
	if (!node.matrixM || node.requireUpdateMatrix3D) {
		var matrixT = Matrix.translate([
			node.position.x - 16,
			node.position.y,
			node.position.z - 16
		]);

		var matrixS = Matrix.scale([
			node.width * node.scaleX,
			(32 * (node.scaleX + node.scaleY)) / 2,
			node.height * node.scaleY
		]);

		var matrixM = Matrix.mulRow(matrixS, matrixT);

		node.matrixM = matrixM;

		node.requireUpdateMatrix3D = false;
	}

	ObjectRenderer.mainPassUniformMatrix(node, node.matrixM);

	MapObject3D.get('block').draw();
};

ObjectRenderer.render[ObjectType.GROUND] = function(node) {
	// テクスチャをバインド
	Texture.fromNode(node).bind();
	if (Texture.bindError) return;

	// M Matrix を更新
	if (!node.matrixM || node.requireUpdateMatrix3D) {
		var matrixT = Matrix.translate([node.x, 0, node.y]);
		var matrixS = Matrix.scale([32 * node.scaleX, 1.0, 32 * node.scaleY]);

		var matrixM = Matrix.mulRow(matrixS, matrixT);
		node.matrixM = matrixM;

		node.requireUpdateMatrix3D = false;
	}

	ObjectRenderer.mainPassUniformMatrix(node, node.matrixM);

	plane.draw();
};

ObjectRenderer.render[ObjectType.MODEL] = function(node) {
	// テクスチャをバインド
	Texture.fromNode(node).bind();
	if (Texture.bindError) return;

	// T, S Matrix を更新
	if (!node.matrixT || !node.matrixS || node.requireUpdateMatrix3D) {
		var matrixT = Matrix.translate(node.position.toArray());

		var matrixS = Matrix.scale([
			node.width * node.scaleX,
			node.height * node.scaleY,
			1.0
		]);

		node.matrixT = matrixT;
		node.matrixS = matrixS;

		node.requireUpdateMatrix3D = false;
	}

	var matrixM = Matrix.mulRow(node.matrixS, Camera3D.IV, node.matrixT);

	ObjectRenderer.mainPassUniformMatrix(node, matrixM);

	gl.disable(gl.DEPTH_TEST);
	model2d.draw();
	gl.enable(gl.DEPTH_TEST);
};

ObjectRenderer.render[ObjectType.OBJ_MODEL] = function(node) {
	// テクスチャをバインド
	Texture.fromNode(node).bind();
	if (Texture.bindError) return;

	// M Matrix を更新
	if (!node.matrixM || node.requireUpdateMatrix3D) {
		var matrixT = Matrix.translate([
			node.moveX + node.position.x - 16,
			node.moveY + node.position.y,
			node.moveZ + node.position.z - 16
		]);

		var matrixS = Matrix.scale([
			node.width * node.scaleX,
			(32 * (node.scaleX + node.scaleY)) / 2,
			node.height * node.scaleY
		]);

		var matrixM = Matrix.mulRow(matrixS, matrixT);

		node.matrixM = matrixM;

		node.requireUpdateMatrix3D = false;
	}

	ObjectRenderer.mainPassUniformMatrix(node, node.matrixM);

	MapObject3D.get(node.frame).draw();
};

export default ObjectRenderer;
export { ObjectType, RenderPass };
