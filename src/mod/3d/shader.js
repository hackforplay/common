import gl from 'mod/3d/gl';

// Shader
{
	// シェーダの基底
	var Shader = enchant.Class.create({
		initialize: function(type) {
			this.shader = gl.createShader(type);
		},
		// シェーダをコンパイルする
		compile: function(source) {
			gl.shaderSource(this.shader, source);
			gl.compileShader(this.shader);
			// エラーチェック
			if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
				console.error(gl.getShaderInfoLog(this.shader));
			}
		}
	});

	Shader.extend = function(type) {
		// 継承
		var shader = enchant.Class.create(Shader, {
			initialize: function(name, source) {
				Shader.call(this, type);
				this.compile(source);
				shader.collection[name] = this;
			}
		});

		shader.collection = {};
		shader.get = function(name) {
			return this.collection[name];
		};

		shader.new = function(name, source) {
			return new shader(name, source);
		};

		return shader;
	};

	var VertexShader = Shader.extend(gl.VERTEX_SHADER);
	var FragmentShader = Shader.extend(gl.FRAGMENT_SHADER);
}

export { VertexShader, FragmentShader };
