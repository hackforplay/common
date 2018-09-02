import 'hackforplay/core';

import gl from 'mod/3d/gl';

import Program from 'mod/3d/program';

RPGObject.prototype.getSource = function() {
	// 3D の拡張に対応している
	if (this.staticSource) {
		return this.staticSource;
	}

	// node.color は未対応
	if (this.originalTexture) {
		return this.originalTexture._element.originalSource;
	}

	// H4P エディタ拡張
	if (this.image && this.image._element.originalSource) {
		return this.image._element.originalSource;
	}

	if (this.image && this.image._element.getAttributeNode('src')) {
		return this.image._element.getAttributeNode('src').value;
	}
};

// x を 2 以上かつ x 以上の 2 の冪に変換する
var pow2 = function(x) {
	if (x < 2) return 2;
	return Math.pow(2, (1 + Math.log2(x - 1)) | 0);
};

var for2d = function(x, y, callback) {
	for (var a = 0; a < x; ++a) {
		for (var b = 0; b < y; ++b) {
			callback(a, b);
		}
	}
};

var tex = null;

class N_Texture {
	constructor(enchantjs_image) {
		this._enchantjs_image = enchantjs_image;

		const element = enchantjs_image._element;

		// テクスチャオブジェクトの生成
		var texture = gl.createTexture();
		this.texture = texture;
		gl.bindTexture(gl.TEXTURE_2D, texture);

		this.w = element.width;
		this.h = element.height;

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			element
		);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	bind(unit) {
		if (this.texture === null) return false;

		if (tex === this.texture) return;
		tex = this.texture;

		unit = unit || 0;

		gl.activeTexture(gl['TEXTURE' + unit]);

		gl.bindTexture(gl.TEXTURE_2D, this.texture);
	}
}

const Texture = {};

// リサイズ済みリスト
Texture.created = {};

// 読み込み中
Texture.loading = {};

// サイズ上書き
Texture.constSize = {};

Texture.lastResult = null;

Object.defineProperty(Texture, 'bindError', {
	get: function() {
		return !Texture.lastResult;
	}
});

window.Texture = Texture;

const noneCanvas = document.createElement('canvas').toDataURL();

Texture.list = {};

const resize2 = (function() {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');

	return function(source, _w, _h, node) {
		const src = source;

		if (!source) return;

		// console.log(source);

		if (Texture.created[source]) {
			return console.log('生成済み', source);
		}

		var image = null;

		var asset = game.assets[source];

		if (!asset) {
			console.error(source);
		}

		var image = asset._element;

		Texture.created[source] = true;

		const iw = image.width;
		const ih = image.height;

		const w = pow2(iw);
		const h = pow2(ih);

		canvas.width = w;
		canvas.height = h;

		context.drawImage(image, 0, 0, w, h);

		const url = canvas.toDataURL();

		enchant.Core.instance.load(url, '', function() {
			const texture = new N_Texture(this);

			texture.src = src;

			// リサイズ前の大きさ
			texture.baseW = iw;
			texture.baseH = ih;

			Texture.list[src] = texture;
		});
	};
})();

Texture.collection = {};

// rpg object からテクスチャを取得
Texture.fromNode = function(node) {
	var source = node.getSource();

	if (!source) {
		//console.warn('Node のテクスチャが不明です', node);
		Texture.lastResult = false;
		return {
			bind() {}
		};
	}

	if (!Texture.created[source]) {
		console.warn(
			'テクスチャが生成されていません, 次の画像を変換します.',
			source
		);

		// 生成
		resize2(source, node.width, node.height, node);
	}

	if (!Texture.list[source]) {
		//console.warn('テクスチャが生成されていません', source);
		Texture.lastResult = false;

		return {
			bind() {}
		};
	}

	Texture.lastResult = true;

	const texture = Texture.list[source];

	const sx = (1.0 / texture.w) * (texture.w / texture.baseW);
	const sy = (1.0 / texture.h) * (texture.h / texture.baseH);

	// 3D 描画時の frame を上書きする
	if (node.frameOverride) {
		node = node.frameOverride();
	}

	var x = node._frameLeft * sx;
	var y = node._frameTop * sy;

	var z = node.width * sx;
	var w = node.height * sy;

	/*
	x += 0.01;
	y += 0.01;
	*/

	Program.uniform('vec4', 'uvScale', [x, y, z, w]);

	return texture;
};

Texture.from = function(source) {
	return new Texture(source);
};

export { resize2 };
export default Texture;
