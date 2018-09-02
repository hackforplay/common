import 'hackforplay/core';

import gl from 'mod/3d/gl';
import { canvas } from 'mod/3d/gl';
import Viewport from 'mod/3d/viewport';
import Camera3D from 'mod/3d/camera3D';

import Framebuffer from 'mod/3d/frameBuffer';

import MapObject3D from 'mod/3d/mapObject3D';

import {
	Primitive,
	Ground2,
	Ground,
	Plane2DD,
	Plane2D,
	Line,
	Model2D,
	Shpere
} from 'mod/3d/primitive';

import 'mod/3d/player-input';
import 'mod/3d/extension';
import 'mod/3d/ui';

import { VertexShader, FragmentShader } from 'mod/3d/shader';

import defineShader from 'mod/3d/defineShader';
import defineModel3D from 'mod/3d/defineModel3D';

import { Vec3, Matrix } from 'mod/3d/math';

import Program from 'mod/3d/program';
import Renderer from 'mod/3d/renderer';

import ObjectRenderer from 'mod/3d/objectRenderer';
import { ObjectType, RenderPass } from 'mod/3d/objectRenderer';
import { plane2, plane, model2d, sky } from 'mod/3d/definePrimitive';

import renderSky from 'mod/3d/renderSky';

window.RPG3D = {};

// 2D の描画を行うか
RPG3D.render2D = false;

// fps メーターを表示するか
RPG3D.fpsMeterVisible = false;

import Texture from 'mod/3d/texture';
import { resize2 } from 'mod/3d/texture';

game.preload('enchantjs/avatarBg2.png');

const main = async function() {
	game.fps = 30;

	resize2('enchantjs/avatarBg2.png', 320, 50);
	resize2('enchantjs/x2/dotmat.gif', 32, 32);

	await defineShader(FragmentShader, VertexShader);

	// プログラム定義

	Program.new('color', 'vs2', 'fs2');
	Program.new('texture-simple', 'texture-simple', 'texture-simple');

	// マップ描画用
	Program.new('map', 'map', 'map');

	Program.new('fog', 'fog', 'fog');

	Program.new('color-simple', 'vertex-simple', 'fragment-simple');

	Program.new('block', 'vs-texture', 'fs-block');

	Program.new('shadow', 'vertex-shadow', 'fragment-shadow');
	Program.new('shadow2', 'vertex-shadow2', 'fragment-shadow2');

	Program.new('sky', 'sky', 'sky');

	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.enable(gl.BLEND);

	var cameraMain = new Camera3D('main');

	cameraMain.viewport.perspective(70, 480 / 320, 10.0, 800);

	var cameraLight = new Camera3D('light');

	cameraLight.viewport.perspective(100, 1 / 1, 10.0, 800);

	// カメラを向く行列
	var matrixIV = null;

	gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

	var CPOS = [240, 30, 300];
	var PPOS = [0, 0, 0];

	// gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);

	var depthBuffer = new Framebuffer(1024, 1024);

	gl.depthFunc(gl.LEQUAL);

	var count = 0;
	var matrixTex = new Float32Array([
		0.5,
		0.0,
		0.0,
		0.0,
		0.0,
		0.5,
		0.0,
		0.0,
		0.0,
		0.0,
		1.0,
		0.0,
		0.5,
		0.5,
		0.0,
		1.0
	]);

	function renderObjects(camera2D) {
		const { w, h } = camera2D;

		var B = ObjectRenderer.nodes[ObjectType.MODEL];
		var D = ObjectRenderer.nodes[ObjectType.OBJ_MODEL];
		var blocks = ObjectRenderer.nodes[ObjectType.BLOCK];

		const nodes_GROUND = ObjectRenderer.nodes[ObjectType.GROUND];

		gl.enable(gl.DEPTH_TEST);

		var cameraPos = cameraMain.position;

		// console.warn(cameraPos);

		var models = B.concat(D).concat(blocks);

		models.forEach(node => {
			var pos = node.position;

			node._cameraDistance = Vec3.sub(pos, cameraPos).length();
		});

		models.sort((a, b) => {
			return b._cameraDistance - a._cameraDistance;
		});

		nodes_GROUND.forEach(node => {
			ObjectRenderer.render(node);
		});

		models.forEach(node => {
			gl.depthMask(!node.alpha);

			ObjectRenderer.render(node);
		});

		gl.depthMask(true);
	}

	window.Camera3D = Camera3D;

	game.on('enterframe', () => ++count);

	function render(x, y, w, h, camera2D) {
		canvas.width = w;
		canvas.height = h;

		// 深度描画パス
		ObjectRenderer.pass = RenderPass.DEPTH;

		// フレームバッファをバインド
		Renderer.setFrameBuffer(depthBuffer.frameBuffer);
		Renderer.clear(0, 0, 0, 0);
		gl.viewport(0, 0, depthBuffer.width, depthBuffer.height);

		Program.use('shadow');

		var _x = Math.sin(count * 0.005) * 200;
		var _y = Math.cos(count * 0.005) * 200;

		// ライト視点のカメラ
		var cameraLight = Camera3D.set('light');
		cameraLight.target.set(240, 0, 160);
		cameraLight.position.set(240 + _x, 200, 160 + _y);
		cameraLight.update();

		// メインカメラ
		var cameraMain = Camera3D.get('main');
		var pos = Vec3.add(CPOS, PPOS);
		cameraMain.target.set(CPOS[0], CPOS[1], CPOS[2]);
		cameraMain.position.set(pos[0], pos[1], pos[2]);
		cameraMain.update();

		// カメラを向く行列
		matrixIV = Matrix.inverse(cameraMain.matrix);
		matrixIV[12] = 0;
		matrixIV[13] = 0;
		matrixIV[14] = 0;

		Camera3D.IV = matrixIV;

		renderObjects(camera2D);

		// フレームバッファのバインドを解除
		Renderer.setFrameBuffer(null);
		Renderer.clear(1, 0, 1, 1);

		gl.viewport(0, 0, w, h);

		// メインパス
		ObjectRenderer.pass = RenderPass.MAIN;

		Camera3D.set('main');

		renderSky();

		Program.use('shadow2');

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, depthBuffer.texture);
		Program.uniform('tex2', 'texture2', 1);

		var matrixTexProj = Matrix.mulRow(cameraLight.getMatrixVP(), matrixTex);

		Program.uniform('mat4', 'matrixTex', false, matrixTexProj);

		gl.enable(gl.DEPTH_TEST);

		renderObjects(camera2D);

		// 反映
		gl.flush();
	}

	const Camera2D = Camera;

	// 2D のレンダリングを停止する
	const renderCamera2D = Camera2D.prototype.render;
	Camera2D.prototype.render = function() {
		if (this.dimension !== 2) return;
		renderCamera2D.call(this);
	};

	Hack.world.on('postrender', () => {
		const context = game.rootScene._layers.Canvas.context;

		context.setTransform(1, 0, 0, 1, 0, 0);

		// WebGL の canvas を描画
		ObjectRenderer.update();

		for (const camera of Camera.collection) {
			// 3D カメラではない
			if (camera.dimension !== 3) continue;

			const { x, y, w, h } = camera;

			const context = camera.image.context;

			updateCameraPos(camera);

			render(x, y, w, h, camera);

			context.drawImage(canvas, 0, 0, w, h, 0, 0, w, h);

			camera.drawBorder();
		}
	});

	var sp = 3;
	var an = 0;
	var sa = 0.05;

	let cameraPlayerBind = true;

	// G キーで移動方法を変更する
	Key.g.observe(function() {
		if (!this.clicked) return;

		cameraPlayerBind = !cameraPlayerBind;
	});

	let pCameraDistance = 100;
	let pCameraHeight = 30;

	function updateCameraPos(camera2D) {
		cameraMain.viewport.perspective(70, camera2D.w / camera2D.h, 10.0, 800);

		if (Key.q.pressed) {
			an -= sa;
		}

		if (Key.e.pressed) {
			an += sa;
		}

		// 視線をプレイヤーに
		if (cameraPlayerBind) {
			if (Key.w.pressed) {
				pCameraDistance -= 3;
			}

			if (Key.s.pressed) {
				pCameraDistance += 3;
			}

			if (Key.r.pressed) {
				pCameraHeight += 3;
			}

			if (Key.f.pressed) {
				pCameraHeight -= 3;
			}

			pCameraDistance = Math.max(10, pCameraDistance);
			pCameraHeight = Math.max(0, pCameraHeight);

			CPOS = camera2D.target.position.toArray();

			CPOS[1] += 50;

			PPOS = [
				Math.sin(an) * pCameraDistance,
				pCameraHeight,
				Math.cos(an) * pCameraDistance
			];
		} else {
			if (Key.w.pressed) {
				CPOS[0] += Math.sin(an + Math.PI) * sp;
				CPOS[2] += Math.cos(an + Math.PI) * sp;
			}

			if (Key.s.pressed) {
				CPOS[0] += Math.sin(an) * sp;
				CPOS[2] += Math.cos(an) * sp;
			}

			if (Key.d.pressed) {
				CPOS[0] += Math.sin(an + Math.PI / 2) * sp;
				CPOS[2] += Math.cos(an + Math.PI / 2) * sp;
			}
			if (Key.a.pressed) {
				CPOS[0] += Math.sin(an - Math.PI / 2) * sp;
				CPOS[2] += Math.cos(an - Math.PI / 2) * sp;
			}

			if (Key.r.pressed) {
				CPOS[1] += sp;
			}
			if (Key.f.pressed) {
				CPOS[1] -= sp;
			}

			if (CPOS[1] < 0) CPOS[1] = 0;

			PPOS = [Math.sin(an) * 100, 50, Math.cos(an) * 100];
		}

		(() => {
			if (!camera2D.target) return;

			const { position, target } = Camera3D.get('main');

			const aaa = Vec3.sub(position, target);

			const vv = Math.atan2(aaa.x, aaa.z);

			camera2D.target.cameraDirection = (vv + Math.PI) / (Math.PI * 2);
		})();
	}
};

Hack.on('load', function() {
	var start = game.onload;
	game.onload = function() {
		main();

		start.apply(this, arguments);

		// map object 3d
		defineModel3D(MapObject3D);
	};
});
