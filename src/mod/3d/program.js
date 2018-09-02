import gl from 'mod/3d/gl';

import { VertexShader, FragmentShader } from 'mod/3d/shader';
// Program
{
	var Program = enchant.Class.create({
		initialize: function(vs, fs) {
			var program = (this.program = gl.createProgram());

			vs = VertexShader.get(vs);
			fs = FragmentShader.get(fs);

			// シェーダ割り当て
			gl.attachShader(program, vs.shader);
			gl.attachShader(program, fs.shader);

			gl.linkProgram(program);

			// エラーチェック
			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
				console.error(gl.getProgramInfoLog(program));
			}
			return;
		},

		use: function() {
			// 有効にする
			gl.useProgram(this.program);
		},

		attribute: function(name) {
			return gl.getAttribLocation(this.program, name);
		},

		uniform: function(name) {
			return gl.getUniformLocation(this.program, name);
		},

		bind: function(name, buffer, stride) {
			var attribute = this.attribute(name);

			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

			// 有効化
			gl.enableVertexAttribArray(attribute);

			// 登録
			gl.vertexAttribPointer(attribute, stride, gl.FLOAT, false, 0, 0);
		}
	});

	Program.collection = {};
	Program.active = null;
	Program.get = function(name) {
		return this.collection[name];
	};

	Program.Type = {
		float: '1f',
		vec1: '1f',
		vec2: '2fv',
		vec3: '3fv',
		vec4: '4fv',
		sampler2D: '1i',
		tex2: '1i',

		mat2: 'Matrix2fv',
		mat3: 'Matrix3fv',
		mat4: 'Matrix4fv'
	};

	Program.uniform = function(type, name, $REST) {
		var program = this.active;

		if (program === null) return error('');

		var type = this.Type[type];

		if (type === undefined) console.error('Program.Type');

		var methodName = 'uniform' + type;

		var args = Array.prototype.slice.call(arguments, 2);

		args = [program.uniform(name)].concat(args);

		gl[methodName].apply(gl, args);
	};

	Program.new = function(name, vs, fs) {
		var program = (this.collection[name] = new Program(vs, fs));
	};

	Program.use = function(name) {
		var program = this.get(name);

		program.use();
		this.active = program;

		return program;
	};
}

export default Program;
