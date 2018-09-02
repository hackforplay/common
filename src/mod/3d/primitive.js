import gl from 'mod/3d/gl';
import Renderer from 'mod/3d/renderer';
import Program from 'mod/3d/program';

// プリミティブ定義

var VBO = function(data) {
	var vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	return vbo;
};

var IBO = function(data) {
	var ibo = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	return ibo;
};

var Primitive = enchant.Class.create({
	use: function() {
		var program = Program.active;

		if (Program.active === null) return console.error('');

		this.bindProgram(program);
		this.bindBuffer();

		Renderer.activePrimitive = this;
	},

	create: function(vertex, index, uv) {
		this._vertex = vertex;
		this._index = index;
		this._uv = uv;

		this.vertex = VBO(vertex);
		this.index = IBO(index);
		this.uv = VBO(uv);

		this.length = index.length;
	},

	bindProgram: function(program) {
		program.bind('position', this.vertex, 3);
		program.bind('uv', this.uv, 2);

		if (this.normal) {
			program.bind('normal', this.normal, 3);
		}

		return this;
	},

	bindBuffer: function() {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index);

		return this;
	},

	mode: gl.TRIANGLES,

	draw: function() {
		//
		if (Renderer.activePrimitive !== this) {
			this.use();
		}

		gl.drawElements(this.mode, this.length, gl.UNSIGNED_SHORT, 0);
	}
});

var createPrimitive = function(_class, check) {
	var Class = enchant.Class.create(Primitive, _class);

	if (!check) return Class;

	Class.backup = [];

	Class.from = function() {
		var args = Array.prototype.slice.call(arguments);

		var backup = Class.backup.filter(function(backup) {
			return check(backup, args);
		});

		var instance = null;

		if (backup.length) {
			instance = backup[0];
		} else {
			instance = new (Function.prototype.bind.apply(
				Class,
				[null].concat(args)
			))();
			Class.backup.push(instance);
		}

		return instance;
	};

	return Class;
};

var Line = createPrimitive(
	{
		initialize: function(v1, v2) {
			var vertex = v1.concat(v2);

			var uv = [0, 0, 1, 1];
			var index = [0, 1];

			this.mode = gl.LINES;

			this.create(vertex, index, uv);

			this._argumentsText = vertex.toString();
		},

		bindProgram: function(program) {
			program.bind('position', this.vertex, 3);

			return this;
		}
	},
	function(backup, newArgs) {
		return backup._argumentsText === newArgs[0].concat(newArgs[1]).toString();
	}
);

var Plane2D = enchant.Class.create(Primitive, {
	initialize: function() {
		var vertex = [0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1];

		var uv = [0, 0, 1, 0, 0, 1, 1, 1];
		var index = [0, 1, 2, 1, 2, 3];
		this.create(vertex, index, uv);
	}
});

var Model2D = enchant.Class.create(Primitive, {
	initialize: function() {
		var vertex = [-0.5, 1, 0, 0.5, 1, 0, -0.5, 0, 0, 0.5, 0, 0];

		var uv = [0, 0, 1, 0, 0, 1, 1, 1];
		var index = [0, 1, 2, 1, 2, 3];
		this.create(vertex, index, uv);
	}
});

var Ground = enchant.Class.create(Primitive, {
	initialize: function(x, y) {
		var vertex = [0, 0, 0, x, 0, 0, 0, 0, y, x, 0, y];

		var uv = [0, 0, x, 0, 0, y, x, y];
		var index = [0, 1, 2, 1, 2, 3];
		this.create(vertex, index, uv);
		return;
	}
});

var Ground2 = enchant.Class.create(Primitive, {
	initialize: function(x, y, m) {
		var vertex = [
			// 上
			-m,
			0,
			-m,
			x + m,
			0,
			-m,
			0,
			0,
			0,
			x,
			0,
			0,
			// 右
			x,
			0,
			0,
			x + m,
			0,
			-m,
			x,
			0,
			y,
			x + m,
			0,
			y + m,
			// 下
			0,
			0,
			y,
			x,
			0,
			y,
			-m,
			0,
			y + m,
			x + m,
			0,
			y + m,
			// 左
			-m,
			0,
			-m,
			0,
			0,
			0,
			-m,
			0,
			y + m,
			0,
			0,
			y
		];

		var uv = [];

		vertex.forEach(function(v, i) {
			if (i % 3 === 1) return;

			uv.push(v);
		});

		var index = [
			0,
			1,
			2,
			1,
			2,
			3,
			4,
			5,
			6,
			5,
			6,
			7,
			8,
			9,
			10,
			9,
			10,
			11,
			12,
			13,
			14,
			13,
			14,
			15
		];

		this.create(vertex, index, uv);
		return;
	}
});

const Shpere = enchant.Class.create(Primitive, {
	initialize(x, y, r) {
		// this.drawType = gl.LINE_STRIP;

		var latitudeBands = x;
		var longitudeBands = y;
		var radius = r;

		var vertexPositionData = [];
		var normalData = [];
		var textureCoordData = [];
		for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
			var theta = (latNumber * Math.PI) / latitudeBands;
			var sinTheta = Math.sin(theta);
			var cosTheta = Math.cos(theta);

			for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
				var phi = (longNumber * 2 * Math.PI) / longitudeBands;
				var sinPhi = Math.sin(phi);
				var cosPhi = Math.cos(phi);

				var x = cosPhi * sinTheta;
				var y = cosTheta;
				var z = sinPhi * sinTheta;
				var u = 1 - longNumber / longitudeBands;
				var v = 1 - latNumber / latitudeBands;

				normalData.push(x);
				normalData.push(y);
				normalData.push(z);
				textureCoordData.push(u);
				textureCoordData.push(v);
				vertexPositionData.push(radius * x);
				vertexPositionData.push(radius * y);
				vertexPositionData.push(radius * z);
			}
		}

		var indexData = [];
		for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
			for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
				var first = latNumber * (longitudeBands + 1) + longNumber;
				var second = first + longitudeBands + 1;
				indexData.push(first);
				indexData.push(second);
				indexData.push(first + 1);

				indexData.push(second);
				indexData.push(second + 1);
				indexData.push(first + 1);
			}
		}

		this.create(vertexPositionData, indexData, textureCoordData);
	}
});

const SkyShpere = enchant.Class.create(Shpere, {
	initialize(x, y, r) {
		Shpere.call(this, x, y, r);
	},

	bindProgram(program) {
		program.bind('position', this.vertex, 3);
		return this;
	}
});

var Plane2DD = enchant.Class.create(Primitive, {
	initialize: function(width, height) {
		var vertex = [0, 0, 0, width, 0, 0, 0, height, 0, width, height, 0];
		var uv = [0, 1, 1, 1, 0, 0, 1, 0];
		var index = [0, 1, 2, 1, 2, 3];
		this.create(vertex, index, uv);
	}
});

export {
	Primitive,
	Ground2,
	Ground,
	Plane2DD,
	Plane2D,
	Line,
	Model2D,
	Shpere,
	SkyShpere
};
