import enchant from '../../enchantjs/enchant';
import RPGObject from './object';

function skin() {
	this.image = enchant.Core.instance.assets['enchantjs/x2/dotmat.gif'];
	this.directionType = 'single';
	this.forward = [0, -1];
}

class MapObject extends RPGObject {
	constructor(value) {
		super(skin);
		if (typeof value === 'number') {
			this.frame = value;
		} else {
			this.name = value;
		}
	}

	get name() {
		var search = '';
		Object.keys(MapObject.dictionary).forEach(function(key) {
			if (MapObject.dictionary[key] === this.frame) {
				search = key;
			}
		}, this);
		return search;
	}

	set name(key) {
		if (MapObject.dictionary.hasOwnProperty(key)) {
			this.frame = MapObject.dictionary[key];
		}
	}

	onenterframe() {}
}

// 新仕様公式定義
export const dictionary = {
	clay: 320,
	clayWall: 340,
	clayFloor: 323,
	stone: 321,
	stoneWall: 341,
	stoneFloor: 342,
	warp: 324,
	warpRed: 325,
	warpGreen: 326,
	warpYellow: 327,
	magic: 328,
	usedMagic: 329,
	pot: 400,
	rock: 401,
	upStair: 402,
	box: 420,
	flower: 421,
	downStair: 422,
	trap: 440,
	usedTrap: 441,
	step: 442,
	castle: 500,
	village: 501,
	caveGate: 502,
	tree: 520,
	table: 521,
	openedBox: 522,
	beam: 540,
	diamond: 560,
	sapphire: 561,
	ruby: 562,
	heart: 563,
	skull: 564,
	coin: 565,
	star: 566,
	key: 567,
	bomb: 580,
	coldBomb: 581,
	egg: 582,
	poo: 583,
	sandySoil: 45,
	claySoil: 323,
	grassland: 322,
	waterside: 205,
	flatGray: 135,
	squareGray: 93
};

// 互換性維持
MapObject._dictionary = {
	...dictionary,
	...(MapObject.Dictionaly || {})
};
Object.defineProperty(MapObject, 'dictionary', {
	configurable: true,
	enumerable: true,
	get: function() {
		return this._dictionary;
	},
	set: function(value) {
		Object.keys(value).forEach(function(key) {
			this._dictionary[key] = value[key];
		}, this);
	}
});

// １枚ずつ切り分けたsurface
MapObject.surfaces = {};
Object.keys(dictionary).forEach(function(name) {
	Object.defineProperty(MapObject.surfaces, name, {
		enumerable: true,
		configurable: true,
		get: function() {
			return tryFetchMapImage(name);
		},
		set: function(value) {
			Object.defineProperty(MapObject.surfaces, name, {
				value: value
			});
		}
	});
});

function tryFetchMapImage(name) {
	const game = enchant.Core.instance;
	if (game.assets['enchantjs/x2/dotmat.gif']) {
		var length = 20,
			w = 32,
			h = 32;
		var frame = MapObject.dictionary[name],
			x = (frame % length) * w,
			y = ((frame / length) >> 0) * h;
		var s = new Surface(w, h);
		s.draw(game.assets['enchantjs/x2/dotmat.gif'], x, y, w, h, 0, 0, w, h);
		return (MapObject.surfaces[name] = s);
	}
	return undefined;
}

export default MapObject;
