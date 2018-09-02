// Math
Math.hypot =
	Math.hypot ||
	function() {
		var y = 0;
		var length = arguments.length;

		for (var i = 0; i < length; i++) {
			if (arguments[i] === Infinity || arguments[i] === -Infinity) {
				return Infinity;
			}
			y += arguments[i] * arguments[i];
		}
		return Math.sqrt(y);
	};

Math.log2 =
	Math.log2 ||
	function(x) {
		return Math.log(x) / Math.LN2;
	};

// 行列関連（仮）
var Matrix = {
	inverse: function inverse(i) {
		var j = new Float32Array(16),
			o = i[0],
			s = i[1],
			N = i[2],
			O = i[3],
			P = i[4],
			Q = i[5],
			R = i[6],
			S = i[7],
			T = i[8],
			U = i[9],
			V = i[10],
			W = i[11],
			X = i[12],
			Y = i[13],
			Z = i[14];
		i = i[15];
		var $ = o * Q - s * P,
			_ = o * R - N * P,
			aa = o * S - O * P,
			ba = s * R - N * Q,
			ca = s * S - O * Q,
			da = N * S - O * R,
			ea = T * Y - U * X,
			fa = T * Z - V * X,
			ga = T * i - W * X,
			ha = U * Z - V * Y,
			ia = U * i - W * Y,
			ja = V * i - W * Z,
			ka = 1 / ($ * ja - _ * ia + aa * ha + ba * ga - ca * fa + da * ea);
		return (
			(j[0] = (Q * ja - R * ia + S * ha) * ka),
			(j[1] = (-s * ja + N * ia - O * ha) * ka),
			(j[2] = (Y * da - Z * ca + i * ba) * ka),
			(j[3] = (-U * da + V * ca - W * ba) * ka),
			(j[4] = (-P * ja + R * ga - S * fa) * ka),
			(j[5] = (o * ja - N * ga + O * fa) * ka),
			(j[6] = (-X * da + Z * aa - i * _) * ka),
			(j[7] = (T * da - V * aa + W * _) * ka),
			(j[8] = (P * ia - Q * ga + S * ea) * ka),
			(j[9] = (-o * ia + s * ga - O * ea) * ka),
			(j[10] = (X * ca - Y * aa + i * $) * ka),
			(j[11] = (-T * ca + U * aa - W * $) * ka),
			(j[12] = (-P * ha + Q * fa - R * ea) * ka),
			(j[13] = (o * ha - s * fa + N * ea) * ka),
			(j[14] = (-X * ba + Y * _ - Z * $) * ka),
			(j[15] = (T * ba - U * _ + V * $) * ka),
			j
		);
	},

	multiply2: function multiply2() {
		return Array.prototype.reduce.call(arguments, Matrix.multiply);
	},
	lookAt: function lookAt(i, j, o) {
		var s = new Float32Array(16),
			N = i[0],
			O = i[1];
		i = i[2];
		var P = o[0],
			Q = o[1],
			R = o[2];
		o = j[1];
		var S = j[2];
		if (N == j[0] && O == o && i == S) return Matrix.identity();
		var T, U, V, W;
		return (
			(o = N - j[0]),
			(S = O - j[1]),
			(V = i - j[2]),
			(W = 1 / Math.sqrt(o * o + S * S + V * V)),
			(o *= W),
			(S *= W),
			(V *= W),
			(j = Q * V - R * S),
			(R = R * o - P * V),
			(P = P * S - Q * o),
			(W = Math.sqrt(j * j + R * R + P * P))
				? ((W = 1 / W), (j *= W), (R *= W), (P *= W))
				: (P = R = j = 0),
			(Q = S * P - V * R),
			(T = V * j - o * P),
			(U = o * R - S * j),
			(W = Math.sqrt(Q * Q + T * T + U * U))
				? ((W = 1 / W), (Q *= W), (T *= W), (U *= W))
				: (U = T = Q = 0),
			(s[0] = j),
			(s[1] = Q),
			(s[2] = o),
			(s[3] = 0),
			(s[4] = R),
			(s[5] = T),
			(s[6] = S),
			(s[7] = 0),
			(s[8] = P),
			(s[9] = U),
			(s[10] = V),
			(s[11] = 0),
			(s[12] = -(j * N + R * O + P * i)),
			(s[13] = -(Q * N + T * O + U * i)),
			(s[14] = -(o * N + S * O + V * i)),
			(s[15] = 1),
			s
		);
	},
	perspective: function perspective(i, j, o, s) {
		var N = new Float32Array(16);
		i = o * Math.tan((i * Math.PI) / 360);
		var O = s - o;
		return (
			(N[0] = (2 * o) / (2 * (i * j))),
			(N[1] = 0),
			(N[2] = 0),
			(N[3] = 0),
			(N[4] = 0),
			(N[5] = (2 * o) / (2 * i)),
			(N[6] = 0),
			(N[7] = 0),
			(N[8] = 0),
			(N[9] = 0),
			(N[10] = -(s + o) / O),
			(N[11] = -1),
			(N[12] = 0),
			(N[13] = 0),
			(N[14] = -(2 * (s * o)) / O),
			(N[15] = 0),
			N
		);
	},
	rotate: function rotate(i, j) {
		var o = Matrix.identity(),
			s = Matrix.identity(),
			N = Math.sqrt(j[0] * j[0] + j[1] * j[1] + j[2] * j[2]);
		if (!N) return null;
		var O = j[0],
			P = j[1],
			Q = j[2];
		1 != N && ((N = 1 / N), (O *= N), (P *= N), (Q *= N));
		var R = Math.sin(i),
			S = Math.cos(i),
			T = 1 - S,
			N = o[0],
			U = o[1],
			V = o[2],
			W = o[3],
			X = o[4],
			Y = o[5],
			Z = o[6],
			$ = o[7],
			_ = o[8],
			aa = o[9],
			ba = o[10],
			ca = o[11],
			da = O * O * T + S,
			ea = P * O * T + Q * R,
			fa = Q * O * T - P * R,
			ga = O * P * T - Q * R,
			ha = P * P * T + S,
			ia = Q * P * T + O * R,
			ja = O * Q * T + P * R,
			O = P * Q * T - O * R,
			Q = Q * Q * T + S;
		return (
			i
				? o != s &&
				  ((s[12] = o[12]), (s[13] = o[13]), (s[14] = o[14]), (s[15] = o[15]))
				: (s = o),
			(s[0] = N * da + X * ea + _ * fa),
			(s[1] = U * da + Y * ea + aa * fa),
			(s[2] = V * da + Z * ea + ba * fa),
			(s[3] = W * da + $ * ea + ca * fa),
			(s[4] = N * ga + X * ha + _ * ia),
			(s[5] = U * ga + Y * ha + aa * ia),
			(s[6] = V * ga + Z * ha + ba * ia),
			(s[7] = W * ga + $ * ha + ca * ia),
			(s[8] = N * ja + X * O + _ * Q),
			(s[9] = U * ja + Y * O + aa * Q),
			(s[10] = V * ja + Z * O + ba * Q),
			(s[11] = W * ja + $ * O + ca * Q),
			s
		);
	}
};

Matrix.identity = function() {
	return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
};

Matrix.scale = function(vec) {
	return new Float32Array([
		vec[0],
		0,
		0,
		0,
		0,
		vec[1],
		0,
		0,
		0,
		0,
		vec[2],
		0,
		0,
		0,
		0,
		1
	]);
};

Matrix.translate = function(vec) {
	return new Float32Array([
		1,
		0,
		0,
		0,
		0,
		1,
		0,
		0,
		0,
		0,
		1,
		0,
		vec[0],
		vec[1],
		vec[2],
		1
	]);
};

Matrix.multiply = function(mat1, mat2) {
	var m1 = mat1;
	var m2 = mat2;

	return new Float32Array([
		m2[0] * m1[0] + m2[1] * m1[4] + m2[2] * m1[8] + m2[3] * m1[12],
		m2[0] * m1[1] + m2[1] * m1[5] + m2[2] * m1[9] + m2[3] * m1[13],
		m2[0] * m1[2] + m2[1] * m1[6] + m2[2] * m1[10] + m2[3] * m1[14],
		m2[0] * m1[3] + m2[1] * m1[7] + m2[2] * m1[11] + m2[3] * m1[15],
		m2[4] * m1[0] + m2[5] * m1[4] + m2[6] * m1[8] + m2[7] * m1[12],
		m2[4] * m1[1] + m2[5] * m1[5] + m2[6] * m1[9] + m2[7] * m1[13],
		m2[4] * m1[2] + m2[5] * m1[6] + m2[6] * m1[10] + m2[7] * m1[14],
		m2[4] * m1[3] + m2[5] * m1[7] + m2[6] * m1[11] + m2[7] * m1[15],
		m2[8] * m1[0] + m2[9] * m1[4] + m2[10] * m1[8] + m2[11] * m1[12],
		m2[8] * m1[1] + m2[9] * m1[5] + m2[10] * m1[9] + m2[11] * m1[13],
		m2[8] * m1[2] + m2[9] * m1[6] + m2[10] * m1[10] + m2[11] * m1[14],
		m2[8] * m1[3] + m2[9] * m1[7] + m2[10] * m1[11] + m2[11] * m1[15],
		m2[12] * m1[0] + m2[13] * m1[4] + m2[14] * m1[8] + m2[15] * m1[12],
		m2[12] * m1[1] + m2[13] * m1[5] + m2[14] * m1[9] + m2[15] * m1[13],
		m2[12] * m1[2] + m2[13] * m1[6] + m2[14] * m1[10] + m2[15] * m1[14],
		m2[12] * m1[3] + m2[13] * m1[7] + m2[14] * m1[11] + m2[15] * m1[15]
	]);
};

// 列オーダーで行列を乗算する
Matrix.mulCol = function() {
	return Array.prototype.reduce.call(arguments, Matrix.multiply);
};

// 行オーダーで行列を乗算する
Matrix.mulRow = function() {
	return Array.prototype.reduceRight.call(arguments, Matrix.multiply);
};

// ベクトル（仮）

var Vec3 = enchant.Class.create({
	initialize: function(x, y, z) {
		this.set(x, y, z);
	},

	set: function(x, y, z) {
		this.x = x || 0;
		this.y = y || 0;
		this.z = z || 0;
	},

	toArray: function() {
		return [this.x, this.y, this.z];
	},

	clone: function() {
		return new Vec3(this.x, this.y, this.z);
	},

	length: function() {
		return Math.hypot(this.x, this.y, this.z);
	},

	scale(v) {
		this.x *= v;
		this.y *= v;
		this.z *= v;

		return this;
	},

	normalize() {
		let { x, y, z } = this;

		var n = Math.sqrt(x * x + y * y + z * z);

		if (n > 0.0) {
			var invN = 1 / n;
			this.x *= invN;
			this.y *= invN;
			this.z *= invN;
		} else {
			// Make something up
			this.x = 0;
			this.y = 0;
			this.z = 0;
		}
		return this;
	}
});

Vec3.sub = function(a, b) {
	return new Vec3(a.x - b.x, a.y - b.y, a.z - b.z);
};

Vec3.add = function(v1, v2) {
	return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
};

Vec3.transform = function(a, m) {
	var x = a[0],
		y = a[1],
		z = a[2],
		w = m[3] * x + m[7] * y + m[11] * z + m[15];
	w = w || 1.0;
	var x = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
	var y = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
	var z = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
	return [x, y, z];
};

Vec3.distance = function(v1, v2) {
	return (
		Math.pow(v2[0] - v1[0], 2) +
		Math.pow(v2[1] - v1[1], 2) +
		Math.pow(v2[2] - v1[2], 2)
	);
};

Vec3.distance = function(v1, v2) {
	return (
		Math.abs(v2[0] - v1[0]) + Math.abs(v2[1] - v1[1]) + Math.abs(v2[2] - v1[2])
	);
};

var Vec2 = {};

Vec2.rotate = function(vec, rad) {
	var x = vec[0],
		y = vec[1];
	var sin = Math.sin(rad),
		cos = Math.cos(rad);
	return [x * cos - y * sin, x * sin + y * cos];
};

export { Vec3, Matrix, Vec2 };
