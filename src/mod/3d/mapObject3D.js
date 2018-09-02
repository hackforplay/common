import 'hackforplay/core';
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
// MapObject3D
{
	var decode62 = function(code) {
		code = code.charCodeAt();

		code -= 48;

		if (code >= 17) code -= 7;
		if (code >= 42) code -= 6;

		return code;
	};

	var MapObject3D = enchant.Class.create({
		initialize: function(id, source) {
			var a = source.split('/');

			var vertices = a[0];
			var uv = a[1];

			vertices = vertices.split('').map(function(vertex) {
				return decode62(vertex) * (1 / 61);
			});

			uv = uv.split('').map(function(index, i) {
				var value = decode62(index) * (1 / 61);

				// UV を左右反転する
				if (i % 2) value = 1 - value;

				return value;
			});

			// UV の最小単位
			var unit = 1 / 64;

			uv = uv.map(function(value) {
				var a = Math.ceil(value / unit);

				return a * unit;
			});

			vertices = vertices.map(function(vertex, index) {
				if (vertex < 0.03) vertex = 0;
				if (vertex > 1 - 0.03) vertex = 1;

				if (index % 3 !== 2) {
					// vertex -= 0.5;
				}

				return vertex;
			});

			var Model = enchant.Class.create(Primitive, {
				initialize: function() {
					var vertex = vertices;

					var indices = [];

					for (var i = 0; i < vertex.length / 3; ++i) {
						indices.push(i);
					}

					this.create(vertex, indices, uv);
				}
			});

			MapObject3D.models[id] = new Model();
		}
	});

	MapObject3D.models = {};

	MapObject3D.get = function(id) {
		return MapObject3D.models[id];
	};

	MapObject3D.model = function(id, source) {
		new MapObject3D(id, source);
	};

	window.MapObject3D = MapObject3D;
}

export default MapObject3D;
