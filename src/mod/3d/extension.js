import 'hackforplay/core';

import 'mod/3d/player-input';

import MapObjectConfig from 'mod/3d/mapObjectConfig';
import { initializeMapObjectConfig } from 'mod/3d/mapObjectConfig';
import BehaviorTypes from '../../hackforplay/behavior-types';

// MapObject が RPGObject になったアプデの対策
(function() {
	var rpg = RPGObject.prototype;
	var map = MapObject.prototype;

	var mapProto = Object.keys(map).map(function(key) {
		return !(key in rpg);
	});

	Object.keys(MapObject.dictionary).forEach(function(name) {
		Hack.assets[name] = function() {
			this.image = game.assets['enchantjs/x2/dotmat.gif'];
			this.width = 32;
			this.height = 32;
			this.offset = {
				x: 0,
				y: 0
			};
			this.directionType = 'single';
			this.forward = [0, -1];
			this.frame = MapObject.dictionary[name];

			this.assetName = name;

			MapObjectConfig.assign(this, 'default');
			MapObjectConfig.assign(this, this.frame);
		};
	});
})();

// Insect 等が RPGObject になった対策
(function() {
	var extendOffset = function(name, z) {
		var base = Hack.assets[name];

		Hack.assets[name] = function() {
			base.apply(this, arguments);

			this.assetName = name;

			this.offset.z = z || 0;
		};
	};

	extendOffset('slime', -14);
	extendOffset('spider', -14);
	extendOffset('dragon', -14);
	extendOffset('bat', -6);
	extendOffset('insect', -6);
	extendOffset('knight', -8);
	extendOffset('boy', -8);
	extendOffset('girl', -8);
	extendOffset('woman', -8);
})();

initializeMapObjectConfig();

// オブジェクトを再配置する
RPGObject.prototype.relocate = function relocate() {
	this.locate3D(this.mapX, this.mapY, this.mapZ, this.map.name);
};

// locate3D
(function() {
	Object.defineProperties(RPGObject.prototype, {
		mapX: {
			configurable: true,
			enumerable: true,
			get: function get() {
				return Math.floor(((this.x || 0) - this.offset.x + 16) / 32);
			}
		},
		mapY: {
			configurable: true,
			enumerable: true,
			get: function get() {
				return Math.floor(((this.y || 0) - this.offset.y + 16) / 32);
			}
		},
		mapZ: {
			configurable: true,
			enumerable: true,
			get: function get() {
				return Math.floor(((this.z | 0) - (this.offset.z | 0) + 16) / 32);
			}
		}
	});

	RPGMap.prototype.getItem3D = function(x, y, z) {
		var nodes = this.scene.childNodes;

		var items = nodes.filter(function(node) {
			return node.mapX === x && node.mapY === y && node.mapZ === z;
		});

		if (items.length) return items;

		return null;
	};

	RPGMap.prototype.removeItem = function(x, y, z, remover) {
		if (remover.removedItems) {
			remover.removedItems.forEach(node => {
				node.visible = true;
			});
		}

		remover.removedItems = [];

		var nodes = this.scene.childNodes;

		nodes
			.filter(function(node) {
				return node.mapX === x && node.mapY === y && node.mapZ === z;
			})
			.forEach(function(node) {
				// node.remove();
				node.visible = false;

				remover.removedItems.push(node);
			});
	};

	RPGObject.prototype.locate3D = function(x, y, z, mapName) {
		if (
			mapName in Hack.maps &&
			Hack.maps[mapName] instanceof RPGMap &&
			this.map !== Hack.maps[mapName]
		) {
			// this.destroy();
			Hack.maps[mapName].scene.addChild(this);
		}
		this.moveTo(x * 32 + this.offset.x, y * 32 + this.offset.y);

		this.z = z * 32;

		if (this.isGround) {
			this.map.removeItem(x, y, z - 1, this);
		}
	};

	RPGObject.prototype.locate = function(x, y, mapName) {
		this.locate3D(x, y, 0, mapName);
	};
})();

Object.defineProperty(RPGObject.prototype, 'opacity', {
	set(value) {
		this._opacity = parseFloat(value);

		if (value === 0) {
			this.visible = false;

			if (!this.visible && this.removedItems) {
				this.removedItems.forEach(node => {
					node.visible = true;
				});
			}
		}
		if (value) {
			if (!this.visible && this.removedItems) {
				this.removedItems.forEach(node => {
					node.visible = false;
				});
			}

			this.visible = true;
		}
	},

	get() {
		return this._opacity;
	}
});

(() => {
	RPGObject.prototype._dirty = false;

	Object.defineProperty(RPGObject.prototype, '_dirty', {
		set(value) {
			this.requireUpdateMatrix3D = true;
			this.__dirty = value;
		},
		get() {
			return this.__dirty;
		}
	});
})();

// walk の条件に高さを追加
(function() {
	// TODO: 新仕様の walk に対応する
	return;

	RPGObject.prototype.walk = function(distance, continuous) {
		if (
			!this.isKinematic ||
			(!continuous && this.behavior !== BehaviorTypes.Idle) ||
			!Hack.isPlaying
		)
			return;
		this.behavior = BehaviorTypes.Walk;
		var f = this.forward,
			d = typeof distance === 'number' ? distance >> 0 : 1,
			s = Math.sign(d);
		var _x = this.mapX + f.x * s,
			_y = this.mapY + f.y * s,
			tw = Hack.map.tileWidth,
			th = Hack.map.tileHeight;
		// Map Collision
		var mapR = Hack.map.width / tw - 1,
			mapB = Hack.map.height / th - 1;
		var mapHit =
			Hack.map.hitTest(_x * tw, _y * th) ||
			0 > _x ||
			_x > mapR ||
			0 > _y ||
			_y > mapB;
		// RPGObject(s) Collision

		// z
		var mapY = Math.floor((this.position.y - this.offset.z) / 32);

		var hits = RPGObject.collection.filter(function(item) {
			return (
				item.isKinematic &&
				item.collisionFlag &&
				item.mapX === _x &&
				item.mapY === _y
			);
		});

		hits = hits.filter(function(node) {
			return 'hp' in node && mapY === node.mapZ;
		});

		var i2 = Hack.map.getItem3D(
			this.mapX + this.forward.x,
			this.mapY + this.forward.y,
			this.mapZ - 1
		);

		i2 = (i2 || []).filter(function(item) {
			return (
				item.isKinematic &&
				item.collisionFlag &&
				item.mapX === _x &&
				item.mapY === _y
			);
		});

		if (!mapHit && !hits.length) {
			if (continuous) {
				this.frame = [];
				this.frame = this.getFrame();
			} else this.behavior = BehaviorTypes.Walk;
			this.dispatchEvent(new Event('walkstart'));
			var move = {
				x: Math.round(f.x * tw * s),
				y: Math.round(f.y * th * s)
			};
			var target = {
				x: this.x + move.x,
				y: this.y + move.y
			};
			var frame = this.getFrame().length;
			var stopInterval = this.setInterval(function() {
				this.moveBy(move.x / frame, move.y / frame);
				this.moveTo(Math.round(this.x), Math.round(this.y));
				this.dispatchEvent(new Event('walkmove'));
			}, 1);
			this.setTimeout(function() {
				this.moveTo(target.x, target.y);
				stopInterval();
				this.dispatchEvent(new Event('walkend'));
				// next step
				if (Math.abs(d) > 1) this.walk(Math.sign(d) * (Math.abs(d) - 1), true);
				else this.behavior = BehaviorTypes.Idle;
			}, frame - 1);
		} else {
			// 直前のフレームで collided していたオブジェクトを除外
			var e = new Event('collided');
			e.map = mapHit;
			e.hits = hits.filter(function(item) {
				return (
					!this._preventFrameHits || this._preventFrameHits.indexOf(item) < 0
				);
			}, this);
			e.hit = e.hits.length > 0 ? e.hits[0] : undefined;
			e.item = e.hit; // イベント引数の統一
			if (e.hit || e.map) {
				var e2 = new Event('collided');
				e2.map = false;
				e2.hits = [(e2.hit = this)];
				e.item = e.hit; // イベント引数の統一
				this.dispatchEvent(e);
				e.hits.forEach(function(item) {
					item.dispatchEvent(e2);
				});
			}
			this.behavior = BehaviorTypes.Idle;
		}
		this._preventFrameHits = hits;
	};
})();

// z
(function() {
	RPGObject.prototype._z = 0;

	Object.defineProperty(RPGObject.prototype, 'z', {
		get: function get() {
			return this._z;
		},
		set: function set(z) {
			if (this._z !== z) {
				this._z = z;
				this._dirty = true;
			}
		}
	});

	Object.defineProperty(RPGObject.prototype, 'position', {
		get: function get() {
			var _this = this;
			return Object.create(Object, {
				x: {
					get: function get() {
						return _this.x - _this.offset.x + 16;
					},
					set: function set(value) {
						_this.x = value - 16 + _this.offset.x;
					}
				},
				y: {
					get: function get() {
						return (_this.z | 0) + (_this.offset.z | 0);
					},
					set: function set(value) {
						_this._z = value - _this.offset.z;
					}
				},
				z: {
					get: function get() {
						return _this.y - _this.offset.y + 16;
					},
					set: function set(value) {
						_this.y = value - 16 + _this.offset.y;
					}
				},
				toArray: {
					value: function value() {
						return [this.x, this.y, this.z];
					}
				}
			});
		}
	});
})();

// map
(function() {
	Object.defineProperties(RPGMap.prototype, {
		mapWidth: {
			get: function() {
				return this._mapWidth;
			}
		},
		mapHeight: {
			get: function() {
				return this._mapHeight;
			}
		}
	});

	var load = RPGMap.prototype.load;
	RPGMap.prototype.load = function() {
		var loaded = this.isLoaded;

		load.apply(this, arguments);

		if (loaded) return;

		console.log('3D のマップを生成します', this.name);

		const ul = this.bmap._3d_underLayer || 0;

		this.bmap._data.forEach((data, index) => {
			for (var x = 0; x < this.mapWidth; ++x) {
				for (var y = 0; y < this.mapHeight; ++y) {
					let value = data[y][x];

					if (value === -1) continue;

					const config = MapObjectConfig.get(value);

					if ('replace' in config) {
						value = config.replace;
					}

					var block = new MapObject(value);
					block.locate3D(x, y, -1 + index + ul);

					block.collisionFlag = false;
				}
			}
		});

		// 再配置してオブジェクトの重なりを修正する
		this.scene.childNodes.forEach(node => {
			if (node.relocate) node.relocate();
		});
	};
})();
