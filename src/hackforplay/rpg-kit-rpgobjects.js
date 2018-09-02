import 'hackforplay/rpg-kit-main';
import 'enchantjs/enchant';
import 'enchantjs/ui.enchant';
import Hack from './hack';
import * as synonyms from './synonyms';
import SAT from 'lib/sat.min';
import RPGObject from './object/object';
import MapObject, { dictionary } from './object/map-object';
import BehaviorTypes from './behavior-types';
import './enchantjs-kit'; // Core の生成を待つ

/**
* RPGObject
* To use;

var bs = new BlueSlime();
bs.locate(5, 5);
bs.onplayerestay = function () {
	// When player still stay in bs
	// プレイヤーが上に乗っている間
};
bs.onplayerexit = function () {
	// When player will leave from bs
	// プレイヤーが離れたとき
};
bs.onattacked = function (event) {
	// When someone will attack bs
	// 攻撃されたとき
};
bs.onbecomeidle = function () {
	// When behavior becomes BehaviorTypes.Idle
	// まち状態になったとき
};
// 同様に BehaviorTypes が定義されているだけ、イベントが存在します。
bs.onbecomewalk = function () {};
bs.onbecomeattack = function () {};
bs.onbecomedamaged = function () {};
bs.onbecomedead = function () {};

*/
/**
 * Collision Detection
 * [Case]						: [Event]		: [Note]
 * Kinematics ===> Kinematics	: oncollided	: Need collisionFlag is true
 * Physics ===> Physics			: oncollided	: Need collisionFlag is true, Change velocity
 * Physics ===> Kinematics		: ontriggered	: Ignore collisionFlag, Don't change velocity
 */

var game = enchant.Core.instance;

Hack.assets = Hack.assets || {};
Hack.skills = Hack.skills || {};

Hack.assets.knight = function() {
	this.image = game.assets['enchantjs/x1.5/chara5.png'];
	this.width = 48;
	this.height = 48;
	this.offset = {
		x: -8,
		y: -12
	};
	this.setFrameD9(BehaviorTypes.Idle, [1]);
	this.setFrameD9(BehaviorTypes.Walk, [0, 0, 0, 1, 1, 1, 2, 2, 2, 1, null]);
	this.setFrameD9(BehaviorTypes.Attack, [
		6,
		6,
		6,
		6,
		7,
		7,
		7,
		7,
		8,
		8,
		8,
		8,
		null
	]);
	this.setFrameD9(BehaviorTypes.Damaged, [2, -1, -1, -1, 2, 2, 2, -1, -1, -1]);
	this.setFrameD9(BehaviorTypes.Dead, [1, null]);
	this.directionType = 'quadruple';
	this.forward = [0, 1];
	// ダメージ判定用のポリゴン
	this.collider = new SAT.Box(new SAT.V(this.x, this.y), 28, 38).toPolygon();
	this.collider.setOffset(new SAT.V(10, 6));
};
Hack.assets.darkKnight = function() {
	this.mod(Hack.assets.knight);
	this.image = game.assets['enchantjs/x1.5/chara7.png'];
	// ダメージ判定用のポリゴン
	this.collider = new SAT.Box(new SAT.V(this.x, this.y), 28, 38).toPolygon();
	this.collider.setOffset(new SAT.V(10, 6));
};

Hack.assets.magician = function() {
	this.image = game.assets['hackforplay/magician_girl.png'];
	this.width = 48;
	this.height = 48;
	this.offset = {
		x: -8,
		y: -12
	};
	this.setFrameD9(BehaviorTypes.Idle, [1]);
	this.setFrameD9(BehaviorTypes.Walk, [0, 0, 0, 1, 1, 1, 2, 2, 2, 1, null]);
	this.setFrameD9(BehaviorTypes.Attack, [
		6,
		6,
		6,
		6,
		7,
		7,
		7,
		7,
		8,
		8,
		8,
		8,
		null
	]);
	this.setFrameD9(BehaviorTypes.Damaged, [2, -1, -1, -1, 2, 2, 2, -1, -1, -1]);
	this.setFrameD9(BehaviorTypes.Dead, [1, null]);
	this.directionType = 'quadruple';
	this.forward = [0, 1];
	// ダメージ判定用のポリゴン
	this.collider = new SAT.Box(new SAT.V(this.x, this.y), 28, 38).toPolygon();
	this.collider.setOffset(new SAT.V(10, 6));
};

Hack.assets.slime = function() {
	this.image = game.assets['enchantjs/monster4.gif'];
	this.width = 48;
	this.height = 48;
	this.offset = {
		x: -8,
		y: -10
	};
	this.setFrame(BehaviorTypes.Idle, [2, 2, 2, 2, 3, 3, 3, 3]);
	this.setFrame(BehaviorTypes.Walk, [2, 2, 2, 2, 3, 3, 3, 3]);
	this.setFrame(BehaviorTypes.Attack, [
		6,
		6,
		6,
		6,
		4,
		4,
		4,
		4,
		5,
		5,
		5,
		5,
		4,
		4,
		4,
		4,
		null
	]);
	this.setFrame(BehaviorTypes.Damaged, [4, 4, 4, 4, 5, 5, 5, 5]);
	this.setFrame(BehaviorTypes.Dead, [5, 5, 5, 5, 7, 7, 7, null]);
	this.directionType = 'double';
	this.forward = [-1, 0];
	// ダメージ判定用のポリゴン
	this.collider = new SAT.Box(new SAT.V(this.x, this.y), 28, 28).toPolygon();
	this.collider.setOffset(new SAT.V(10, 10));
};

Hack.assets.insect = function() {
	this.image = game.assets['enchantjs/monster1.gif'];
	this.width = 48;
	this.height = 48;
	this.offset = {
		x: -8,
		y: -16
	};
	this.setFrame(BehaviorTypes.Idle, [2, 2, 2, 2, 3, 3, 3, 3]);
	this.setFrame(BehaviorTypes.Walk, [2, 2, 2, 2, 3, 3, 3, 3]);
	this.setFrame(BehaviorTypes.Attack, [
		7,
		7,
		7,
		6,
		6,
		6,
		6,
		6,
		5,
		5,
		5,
		5,
		4,
		4,
		4,
		4,
		null
	]);
	this.setFrame(BehaviorTypes.Damaged, [4, 4, 4, 4, 5, 5, 5, 5]);
	this.setFrame(BehaviorTypes.Dead, [5, 5, 5, 5, 7, 7, 7, null]);
	this.directionType = 'double';
	this.forward = [-1, 0];
	// ダメージ判定用のポリゴン
	this.collider = new SAT.Box(new SAT.V(this.x, this.y), 36, 28).toPolygon();
	this.collider.setOffset(new SAT.V(6, 18));
};

Hack.assets.spider = function() {
	this.image = game.assets['enchantjs/monster2.gif'];
	this.width = 64;
	this.height = 64;
	this.offset = {
		x: -16,
		y: -24
	};
	this.setFrame(BehaviorTypes.Idle, [2, 2, 2, 2, 3, 3, 3, 3]);
	this.setFrame(BehaviorTypes.Walk, [2, 2, 2, 2, 3, 3, 3, 3]);
	this.setFrame(BehaviorTypes.Attack, [
		6,
		6,
		6,
		7,
		7,
		7,
		7,
		7,
		5,
		5,
		5,
		5,
		4,
		4,
		4,
		4,
		null
	]);
	this.setFrame(BehaviorTypes.Damaged, [4, 4, 4, 4, 5, 5, 5, 5]);
	this.setFrame(BehaviorTypes.Dead, [5, 5, 5, 5, 7, 7, 7, null]);
	this.directionType = 'double';
	this.forward = [-1, 0];
	// ダメージ判定用のポリゴン
	this.collider = new SAT.Box(new SAT.V(this.x, this.y), 56, 40).toPolygon();
	this.collider.setOffset(new SAT.V(4, 18));
};

Hack.assets.bat = function() {
	this.image = game.assets['enchantjs/monster3.gif'];
	this.width = 48;
	this.height = 48;
	this.offset = {
		x: -8,
		y: -18
	};
	this.setFrame(BehaviorTypes.Idle, [2, 2, 2, 2, 3, 3, 3, 3]);
	this.setFrame(BehaviorTypes.Walk, [2, 2, 2, 4, 4, 4, 4, 4, 3, 3, 3, 3]);
	this.setFrame(BehaviorTypes.Attack, [
		9,
		9,
		9,
		9,
		6,
		6,
		6,
		6,
		6,
		6,
		6,
		6,
		6,
		6,
		3,
		3,
		4,
		4,
		4,
		4,
		null
	]);
	this.setFrame(BehaviorTypes.Damaged, [4, 4, 4, 4, 5, 5, 5, 5]);
	this.setFrame(BehaviorTypes.Dead, [5, 5, 5, 5, 7, 7, 7, null]);
	this.directionType = 'double';
	this.forward = [-1, 0];
	this.mod(Hack.assets.shadowMod);
	// ダメージ判定用のポリゴン
	this.collider = new SAT.Box(new SAT.V(this.x, this.y), 40, 26).toPolygon();
	this.collider.setOffset(new SAT.V(4, 4));
};
Hack.assets.shadowMod = function() {
	// shadow
	this.shadow = this.shadow || new Sprite(32, 32);
	this.shadow.ref = this;
	this.shadow.layer = RPGMap.Layer.Shadow;
	this.shadow.image = game.assets['enchantjs/shadow.gif'];
	this.shadow.offset = {
		x: (this.width - this.shadow.width) / 2,
		y: this.height - this.shadow.height
	};
	this.shadow.scale(this.width / 64, this.height / 64);
	if (this.parentNode) {
		this.parentNode.addChild(this.shadow);
	}
	if (this.map) {
		this.map.layerChangeFlag = true;
	}
	this.on('added', function() {
		this.parentNode.addChild(this.shadow);
		this.map.layerChangeFlag = true;
	});
	this.shadow.on('enterframe', function() {
		var o = this.offset;
		this.moveTo(this.ref.x + o.x, this.ref.y + o.y);
	});
};

Hack.assets.dragon = function() {
	this.image = game.assets['enchantjs/bigmonster1.gif'];
	this.width = 80;
	this.height = 80;
	this.offset = {
		x: -24,
		y: -42
	};
	this.setFrame(BehaviorTypes.Idle, [
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3
	]);
	this.setFrame(BehaviorTypes.Walk, [
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		3,
		3,
		4,
		4,
		4,
		4,
		4,
		4,
		3,
		3,
		3,
		3
	]);
	this.setFrame(BehaviorTypes.Attack, [
		8,
		8,
		8,
		8,
		8,
		8,
		6,
		6,
		6,
		6,
		6,
		6,
		6,
		6,
		6,
		6,
		6,
		6,
		6,
		6,
		null
	]);
	this.setFrame(BehaviorTypes.Damaged, [
		4,
		4,
		4,
		4,
		4,
		4,
		4,
		4,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5
	]);
	this.setFrame(BehaviorTypes.Dead, [
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		null
	]);
	this.directionType = 'double';
	this.forward = [-1, 0];
	// ダメージ判定用のポリゴン
	this.collider = new SAT.Box(new SAT.V(this.x, this.y), 48, 48).toPolygon();
	this.collider.setOffset(new SAT.V(16, 16));
};

Hack.assets.minotaur = function() {
	this.image = game.assets['enchantjs/bigmonster2.gif'];
	this.width = 80;
	this.height = 80;
	this.offset = {
		x: -40,
		y: -48
	};
	this.setFrame(BehaviorTypes.Idle, [
		8,
		8,
		8,
		8,
		8,
		8,
		8,
		8,
		8,
		8,
		9,
		9,
		9,
		9,
		9,
		9,
		9,
		9,
		9,
		9
	]);
	this.setFrame(BehaviorTypes.Walk, [
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		3,
		3,
		4,
		4,
		4,
		4,
		4,
		4,
		3,
		3,
		3,
		3
	]);
	this.setFrame(BehaviorTypes.Attack, [
		3,
		3,
		3,
		3,
		3,
		4,
		4,
		4,
		4,
		4,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		6,
		6,
		6,
		6,
		6,
		null
	]);
	this.setFrame(BehaviorTypes.Damaged, [
		7,
		7,
		7,
		7,
		7,
		7,
		7,
		7,
		6,
		6,
		6,
		6,
		6,
		6,
		6,
		6
	]);
	this.setFrame(BehaviorTypes.Dead, [
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		null
	]);
	this.directionType = 'double';
	this.forward = [-1, 0];
	// ダメージ判定用のポリゴン
	this.collider = new SAT.Box(new SAT.V(this.x, this.y), 48, 48).toPolygon();
	this.collider.setOffset(new SAT.V(16, 16));
};

Hack.assets.boy = function() {
	this.image = game.assets['enchantjs/x1.5/chara0.png'];
	this.width = 48;
	this.height = 48;
	this.offset = {
		x: -8,
		y: -18
	};
	var _0 = 0,
		_1 = _0 + 1,
		_2 = _0 + 2;
	this.setFrameD9(BehaviorTypes.Idle, [_1]);
	this.setFrameD9(BehaviorTypes.Walk, [
		_0,
		_0,
		_0,
		_0,
		_1,
		_1,
		_1,
		_1,
		_2,
		_2,
		_2,
		_2,
		_1,
		_1,
		_1,
		null
	]);
	this.setFrameD9(BehaviorTypes.Attack, [_0, _0, _2, _2, _1, _1, _1, _1, null]);
	this.setFrameD9(BehaviorTypes.Damaged, [
		_2,
		-1,
		-1,
		-1,
		_2,
		_2,
		_2,
		-1,
		-1,
		-1
	]);
	this.setFrameD9(BehaviorTypes.Dead, [_1, null]);
	this.directionType = 'quadruple';
	this.forward = [0, 1];
	// ダメージ判定用のポリゴン
	this.collider = new SAT.Box(new SAT.V(this.x, this.y), 24, 34).toPolygon();
	this.collider.setOffset(new SAT.V(12, 14));
};

Hack.assets.girl = function() {
	this.image = game.assets['enchantjs/x1.5/chara0.png'];
	this.width = 48;
	this.height = 48;
	this.offset = {
		x: -8,
		y: -18
	};
	var _0 = 6,
		_1 = _0 + 1,
		_2 = _0 + 2;
	this.setFrameD9(BehaviorTypes.Idle, [_1]);
	this.setFrameD9(BehaviorTypes.Walk, [
		_0,
		_0,
		_0,
		_0,
		_1,
		_1,
		_1,
		_1,
		_2,
		_2,
		_2,
		_2,
		_1,
		_1,
		_1,
		null
	]);
	this.setFrameD9(BehaviorTypes.Attack, [_0, _0, _2, _2, _1, _1, _1, _1, null]);
	this.setFrameD9(BehaviorTypes.Damaged, [
		_2,
		-1,
		-1,
		-1,
		_2,
		_2,
		_2,
		-1,
		-1,
		-1
	]);
	this.setFrameD9(BehaviorTypes.Dead, [_1, null]);
	this.directionType = 'quadruple';
	this.forward = [0, 1];
	// ダメージ判定用のポリゴン
	this.collider = new SAT.Box(new SAT.V(this.x, this.y), 24, 34).toPolygon();
	this.collider.setOffset(new SAT.V(12, 14));
};

Hack.assets.woman = function() {
	this.image = game.assets['enchantjs/x1.5/chara0.png'];
	this.width = 48;
	this.height = 48;
	this.offset = {
		x: -8,
		y: -18
	};
	var _0 = 3,
		_1 = _0 + 1,
		_2 = _0 + 2;
	this.setFrameD9(BehaviorTypes.Idle, [_1]);
	this.setFrameD9(BehaviorTypes.Walk, [
		_0,
		_0,
		_0,
		_0,
		_1,
		_1,
		_1,
		_1,
		_2,
		_2,
		_2,
		_2,
		_1,
		_1,
		_1,
		null
	]);
	this.setFrameD9(BehaviorTypes.Attack, [_0, _0, _2, _2, _1, _1, _1, _1, null]);
	this.setFrameD9(BehaviorTypes.Damaged, [
		_2,
		-1,
		-1,
		-1,
		_2,
		_2,
		_2,
		-1,
		-1,
		-1
	]);
	this.setFrameD9(BehaviorTypes.Dead, [_1, null]);
	this.directionType = 'quadruple';
	this.forward = [0, 1];
	// ダメージ判定用のポリゴン
	this.collider = new SAT.Box(new SAT.V(this.x, this.y), 24, 34).toPolygon();
	this.collider.setOffset(new SAT.V(12, 14));
};

Hack.assets.enchantBookItem = function() {
	this.image = game.assets['hackforplay/madosyo_small.png'];
	this.width = 32;
	this.height = 32;
	this.offset = {
		x: 0,
		y: 0
	};
	this.directionType = 'single';
	this.forward = [0, -1];
	// ダメージ判定用のポリゴン
	this.collider = new SAT.Box(new SAT.V(this.x, this.y), 28, 28).toPolygon();
	this.collider.setOffset(new SAT.V(2, 2));
};

Hack.assets.explosion = function() {
	this.image = game.assets['enchantjs/x2/effect0.png'];
	this.width = this.height = 32;
	this.offset = {
		x: 0,
		y: 0
	};
	this.directionType = 'single';
	this.forward = [0, -1];
	this.frame = [
		0,
		0,
		0,
		0,
		0,
		1,
		1,
		1,
		1,
		1,
		2,
		2,
		2,
		2,
		2,
		3,
		3,
		3,
		3,
		3,
		4,
		4,
		4,
		4,
		4
	];
};

game.preload('enchantjs/monster5.gif');
Hack.assets.ouroboros = function() {
	this.image = game.assets['enchantjs/monster5.gif'];
	this.width = 80;
	this.height = 80;
	this.offset = {
		x: -24,
		y: -36
	};
	this.directionType = 'double';
	this.setFrame(
		BehaviorTypes.Idle,
		new Array(40).fill(0).concat(new Array(12).fill(1))
	);
	this.setFrame(BehaviorTypes.Walk, [
		0,
		0,
		0,
		0,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		0,
		0,
		0,
		0,
		null
	]);
	this.setFrame(BehaviorTypes.Attack, [
		1,
		1,
		5,
		5,
		9,
		9,
		10,
		10,
		6,
		6,
		6,
		6,
		6,
		6,
		6,
		6,
		1,
		1,
		null
	]);
	this.setFrame(BehaviorTypes.Dead, [1, 5, 7, 7, 7, 7, 4, 0, 0, null]);
	this.forward = [-1, 0];
	// ダメージ判定用のポリゴン
	this.collider = new SAT.Box(new SAT.V(this.x, this.y), 60, 36).toPolygon();
	this.collider.setOffset(new SAT.V(10, 38));
};

Object.keys(dictionary).forEach(function(name) {
	Hack.assets[name] = function() {
		this.image = MapObject.surfaces[name];
		this.width = 32;
		this.height = 32;
		this.offset = {
			x: 0,
			y: 0
		};
		// 衝突判定用のポリゴン
		this.collider = new SAT.Box(new SAT.V(this.x, this.y), 32, 32).toPolygon();
		this.directionType = 'single';
		this.forward = [0, -1];
	};
});

// Hack.skills
Hack.skills.stalker = function(target) {
	return function() {
		var _target = target || Hack.player;
		if (_target && _target instanceof RPGObject) {
			var moveX = 32 * Math.sign(_target.mapX - this.mapX);
			var moveY = 32 * Math.sign(_target.mapY - this.mapY);
			this.forward = [moveX, moveY];
			this.tl
				.become('walk')
				.moveBy(moveX, moveY, 30)
				.then(function() {
					Hack.Attack.call(this, this.mapX, this.mapY, this.atk);
				})
				.become('attack', 20)
				.become('idle');
		}
	};
};

Hack.skills.storm = function(asset) {
	return function() {
		this.onenterframe = function() {
			if (game.frame % 3 > 0) return;
			var flame = new RPGObject();
			this.shoot(flame, this.forward, 6);
			flame.collisionFlag = false;

			var fx = this.forward.x,
				fy = this.forward.y;
			flame.moveBy(fx * random(64, 96), fy * random(64, 96));
			flame.velocityX += random(-0.99, 1);
			flame.velocityY += random(-0.99, 1);
			flame.scale(random(0.99, 1.5));
			flame.force(-fx * random(0, 0.199), -fy * random(0, 0.199));
			flame.destroy(20);
			var self = this;
			flame.ontriggerenter = function(event) {
				if (event.hit !== self) {
					Hack.Attack.call(this, event.mapX, event.mapY, self.atk);
				}
			};

			flame.mod(asset || Hack.assets.explosion);
		};
	};
};

Hack.skills.selfdestruct = function(time) {
	return function() {
		this.setTimeout(function() {
			var flame = new RPGObject();
			flame.mod(Hack.assets.explosion);
			this.shoot(flame, [0, -1], 1);
			flame.scale(2);
			flame.collisionFlag = false;
			var self = this;
			flame.ontriggerenter = function(event) {
				Hack.Attack.call(this, event.mapX, event.mapY, self.atk);
			};
			flame.destroy(20);
			this.destroy();
		}, (time * game.fps) >> 0);
	};
};

Hack.skills.pistol = function(asset) {
	return function() {
		var bullet = new RPGObject();
		this.shoot(bullet, this.forward, 5);

		var self = this;
		bullet.ontriggerenter = function(event) {
			if (event.target !== self) {
				Hack.Attack.call(this, event.mapX, event.mapY, self.atk);
			}
		};

		bullet.mod(asset || Hack.assets.beam);
	};
};

game.on('enterframe', function() {
	var frame = game.collisionFrames || 10;
	var physicsPhantom = RPGObject.collection.filter(function(item) {
		return !item.isKinematic && !item.collisionFlag && !item._stop;
	});
	var physicsCollision = RPGObject.collection.filter(function(item) {
		return !item.isKinematic && item.collisionFlag && !item._stop;
	});

	__physicsUpdateOnFrame(1, 1, physicsPhantom);
	for (var tick = 1; tick <= frame; tick++) {
		__physicsUpdateOnFrame(tick, frame, physicsCollision);
	}
	for (const item of physicsPhantom) {
		item.updateCollider(); // TODO: 動的プロパティ
	}
});

function __physicsUpdateOnFrame(tick, frame, physics) {
	physics
		.map(function(self, index) {
			// Physical Update
			self.velocityX += self.accelerationX / frame;
			self.velocityY += self.accelerationY / frame;
			self.x += self.velocityX / frame;
			self.y += self.velocityY / frame;
			// Intersects
			var intersects = self.intersect(RPGObject);
			intersects.splice(intersects.indexOf(self), 1); // ignore self
			// Dispatch trigger(stay|exit) event
			(self._preventFrameHits || [])
				.filter(function(item) {
					return item.isKinematic;
				})
				.forEach(function(item) {
					if (intersects.indexOf(item) < 0) {
						dispatchTriggerEvent('exit', self, item);
						dispatchTriggerEvent('exit', item, self);
					} else if (
						tick === frame &&
						!item.collisionFlag &&
						!self.collisionFlag
					) {
						dispatchTriggerEvent('stay', self, item);
						dispatchTriggerEvent('stay', item, self);
					}
				});
			// Intersect on time (enter) or still intersect
			var entered = intersects.filter(function(item) {
				return (
					!self._preventFrameHits || self._preventFrameHits.indexOf(item) < 0
				);
			});
			self._preventFrameHits = intersects; // Update cache
			// Dispatch triggerenter event
			entered
				.filter(function(item) {
					return item.isKinematic;
				})
				.forEach(function(item) {
					dispatchTriggerEvent('enter', self, item);
					dispatchTriggerEvent('enter', item, self);
				});
			return {
				self: self,
				hits: entered.filter(function(item) {
					return !item.isKinematic && item.collisionFlag;
				})
			};
		})
		.filter(function(item) {
			// ===> Physics collision
			return item.self.collisionFlag;
		})
		.filter(function(item) {
			var self = item.self;
			var event = (item.event = new Event('collided'));
			var hits = (event.hits = item.hits);
			var calc = (item.calc = {
				x: self.x,
				y: self.y,
				vx: self.velocityX,
				vy: self.velocityY
			});
			if (hits.length > 0) {
				// Hit objects
				event.hit = hits[0];
				var m1 = self.mass,
					m2 = hits[0].mass;
				calc.vx =
					((m1 - m2) * self.velocityX + 2 * m2 * hits[0].velocityX) / (m1 + m2);
				calc.vy =
					((m1 - m2) * self.velocityY + 2 * m2 * hits[0].velocityY) / (m1 + m2);
				event.map = false;
			} else {
				// Hit map
				var mapHitX =
						(self.velocityX < 0 && self.x <= 0) ||
						(self.velocityX > 0 && self.x + self.width >= game.width),
					mapHitY =
						(self.velocityY < 0 && self.y <= 0) ||
						(self.velocityY > 0 && self.y + self.height >= game.height);
				calc.x = mapHitX
					? Math.max(0, Math.min(game.width - self.width, self.x))
					: self.x;
				calc.y = mapHitX
					? Math.max(0, Math.min(game.height - self.height, self.y))
					: self.y;
				calc.vx = (mapHitX ? -1 : 1) * self.velocityX;
				calc.vy = (mapHitY ? -1 : 1) * self.velocityY;
				event.map = mapHitX || mapHitY;
			}
			event.item = event.hit; // イベント引数の統一
			return event.map || hits.length > 0;
		})
		.filter(function(item) {
			var self = item.self;
			var calc = item.calc;
			self.x = calc.x;
			self.y = calc.y;
			self.velocityX = calc.vx;
			self.velocityY = calc.vy;
			return true;
		})
		.forEach(function(obj) {
			obj.self.dispatchEvent(obj.event);
		});

	function dispatchTriggerEvent(type, self, hit) {
		var event = new Event('trigger' + type);
		event.hit = hit;
		event.item = hit; // 引数名の統一
		event.mapX = hit.mapX;
		event.mapY = hit.mapY;
		self.dispatchEvent(event);
	}
}
