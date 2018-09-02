const MapObjectConfig = {
	default: {
		is3D: true,
		isBlock: false,
		isGround: false,

		alpha: false,

		moveX: 0,
		moveY: 0,
		moveZ: 0
	},

	'321': {
		isBlock: true
	},

	'341': {
		replace: 321
	},
	'323': {
		isGround: true
	},

	'340': {
		replace: 320
	},
	'320': {
		isBlock: true
	},

	'422': {
		isGround: true,
		moveY: -32
	},

	// 花
	'421': {
		alpha: true
	},

	// 地面系
	'342': {
		isBlock: true
	},

	'160-229': {
		isGround: true
	},

	// 砂と草の合成
	'0-7,20-29,40-49,60-69': {
		isBlock: true
	},

	// 砂と草の合成
	'10-17,30-39,50-59,70-79': {
		isGround: true
	},

	// 大きい木
	'461,462,481,482': {
		// 小さい木に
		replace: 520
	},

	// 草, 水
	'322,205': {
		isBlock: true
	},

	// ワープ系
	'324-329': {
		isGround: true
	},
	'441': {
		isGround: true
	}
};

function initializeMapObjectConfig() {
	var values = {};

	Object.keys(MapObjectConfig).forEach(function(key) {
		var keys = key.split(',');
		var value = MapObjectConfig[key];

		keys.forEach(function(key) {
			var range = key.split('-');

			var begin = range[0];
			var end = range[1] || range[0];

			var assign = function(key1) {
				if (!values[key1]) values[key1] = {};

				Object.keys(value).forEach(function(key2) {
					values[key1][key2] = value[key2];
				});
			};

			if (range.length === 1) {
				assign(range[0]);

				return;
			}

			for (var i = begin; i <= end; ++i) {
				assign(i);
			}
		});
	});

	MapObjectConfig.values = values;
	MapObjectConfig.get = function(id) {
		if (!this.values[id]) this.values[id] = {};

		return this.values[id];
	};

	MapObjectConfig.assign = function(node, id) {
		var config = this.get(id);

		Object.keys(config).forEach(function(key) {
			node[key] = config[key];
		});
	};

	window.MapObjectConfig = MapObjectConfig;

	var initialize = MapObject.prototype.initialize;
	MapObject.prototype.initialize = function() {
		initialize.apply(this, arguments);

		MapObjectConfig.assign(this, 'default');
		MapObjectConfig.assign(this, this.frame);
	};
}

export { initializeMapObjectConfig };
export default MapObjectConfig;
