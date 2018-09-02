import enchant from 'enchantjs/enchant';
import { Surface, EventTarget } from 'enchantjs/enchant';
import 'hackforplay/enchantjs-kit';
import 'hackforplay/hack';
import 'hackforplay/rpg-kit-rpgobjects';
import 'hackforplay/rpg-kit-color';
import Vector2 from 'hackforplay/math/vector2';
import Line from 'hackforplay/shapes/line';
import MapObject from './object/map-object';

/*
 * RPGMap
 * レイヤー化された切り替え可能なマップ
 */
class RPGMap extends EventTarget {
	constructor(tileWidth, tileHeight, mapWidth, mapHeight) {
		super();

		if (tileWidth === undefined) {
			tileWidth = 32;
		}
		if (tileHeight === undefined) {
			tileHeight = 32;
		}

		this.bmap = new Map(tileWidth, tileHeight); // 他のオブジェクトより奥に表示されるマップ
		this.fmap = new Map(tileWidth, tileHeight); // 他のオブジェクトより手前に表示されるマップ

		this._mapWidth = mapWidth !== undefined ? mapWidth : 15;
		this._mapHeight = mapHeight !== undefined ? mapHeight : 10;

		this.tileNumX = this._mapWidth;
		this.tileNumY = this._mapHeight;

		this.scene = new Group(); // マップ上に存在するオブジェクトをまとめるグループ
		this.scene.ref = this;
		this.isLoaded = false;
		this.layerChangeFlag = false;
		this._name = '';
		this._type = '';
		this.scene.on('enterframe', this.autoSorting);
		this.scene.on('childadded', function() {
			this.ref.layerChangeFlag = true;
		});

		this.bmap.name = 'BMap';
		this.fmap.name = 'FMap';
		this.scene.name = 'MapScene';

		const w = tileWidth * mapWidth;
		const h = tileHeight * mapHeight;

		this._surface = new Surface(w, h);

		// 反射ライン
		this.reflectionLines = [
			new Line(new Vector2(w, 0), new Vector2(0, 0)),
			new Line(new Vector2(w, h), new Vector2(w, 0)),
			new Line(new Vector2(0, 0), new Vector2(0, h)),
			new Line(new Vector2(0, h), new Vector2(w, h))
		];
	}

	load() {
		if (!this.image && this.imagePath) this.image = game.assets[this.imagePath];
		var a = function(n) {
			Hack.world.addChild(n);
			// game.rootScene.addChild(n);
		};
		a(this.bmap);
		a(this.scene);
		a(this.fmap);
		Hack.map = this;
		Hack.defaultParentNode = this.scene;
		if (!this.isLoaded) {
			this.isLoaded = true;
			this.dispatchEvent(new Event('load'));
		}
		if (Hack.player) this.scene.addChild(Hack.player);
	}

	hitTest(x, y) {
		return this.bmap.hitTest(x, y);
	}

	autoSorting() {
		var ref =
			this instanceof RPGMap ? this : 'ref' in this ? this.ref : Hack.map;
		if (ref.layerChangeFlag) {
			ref.scene.childNodes.sort(function(a, b) {
				if (!('layer' in a) && !('layer' in b)) return 0;
				if (!('layer' in a)) return 1;
				if (!('layer' in b)) return -1;
				return a.layer - b.layer;
			});
			ref.layerChangeFlag = false;
		}
	}

	get name() {
		if (!this._name) {
			var result = Object.keys(Hack.maps).filter(function(key) {
				return Hack.maps[key] === this;
			}, this);
			this._name = result.length > 0 ? result[0] : '';
		}
		return this._name;
	}
	get type() {
		if (!this._type) {
			// 初期値は（0,0）のタイル
			Object.keys(MapObject.dictionary)
				.filter(function(key) {
					return MapObject.dictionary[key] === this.bmap._data[0][0][0];
				}, this)
				.forEach(function(key) {
					this._type = key;
				}, this);
		}
		return this._type;
	}
	set type(value) {
		if (value !== this._type && MapObject.dictionary.hasOwnProperty(value)) {
			this._type = value;
			// typeによってbmapを初期化
			var frame = MapObject.dictionary[value];
			this.bmap.loadData(
				new Array(this._mapHeight).fill(0).map(function() {
					return new Array(this._mapWidth).fill(frame);
				}, this)
			);

			// ついでにcmapも初期化
			this.cmap =
				this.cmap ||
				new Array(this._mapHeight).fill(0).map(function() {
					return new Array(this._mapWidth).fill(0);
				}, this);
		}
	}
	// Collisino Map. (this.bmap.collisionData)
	get cmap() {
		return this.bmap.collisionData;
	}
	set cmap(value) {
		this.bmap.collisionData = value;
	}
	// bmap Image (Surface)
	get image() {
		return this.bmap.image;
	}
	set image(value) {
		this.bmap.image = this.fmap.image = value;
	}
	get width() {
		return this.bmap.width;
	}
	get height() {
		return this.bmap.height;
	}
	get tileWidth() {
		return this.bmap.tileWidth;
	}
	get tileHeight() {
		return this.bmap.tileHeight;
	}

	set background(value) {
		this.bmap.overwrite = value;
		this.bmap.redraw();
	}

	set foreground(value) {
		this.fmap.overwrite = value;
		this.fmap.redraw();
	}
}

export default RPGMap;
