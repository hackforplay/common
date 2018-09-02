import enchant from '../enchantjs/enchant';
import './enchantjs-kit'; // core の生成を待つ

/*

◆ 使い方


◇ z キーを押したらプレイヤーが攻撃する

Key.z.press(function() {
	Hack.player.attack();
});


◇ z キーを押したらプレイヤーが攻撃する（ this を指定する ）

Key.z.press(function() {
	this.attack();
}, Hack.player);


◇ 1 キーを離したらプレイヤーが攻撃する

Key.num1.release(function() {
	Hack.player.attack();
});


◇ ループの中でキーを確認する

game.on('enterframe', function() {

	// 2 キーが押されていたら
	if (Key.num2.pressed) {
		// ~~~
	}

	// g キーが押されていないなら
	if (Key.g.released) {
		// ~~~
	}

	// エンターキーが押された瞬間なら
	if (Key.enter.clicked) {
		// ~~~
	}

	// p キーを押しているカウントを取得
	Hack.player.atk = Key.p.count;

});


◇ キー別に監視する

Key.v.observe(function() {
	console.log(this.count);
	console.log(this.clicked);
	console.log(this.pressed);
	console.log(this.released);
});


◇ v キーを長押しすると 1 秒毎に攻撃する
Key.v.observe(function(key) {
	if (key.clicked || key.pressed && key.count % 30 === 0) {
		this.attack();
	}
}, Hack.player);



☆ 使用できるキーは keyCode を見てください ( 80 行から )


*/

var core = enchant.Core.instance;

var Key = {};

var keyCode = {
	num0: 48,
	num1: 49,
	num2: 50,
	num3: 51,
	num4: 52,
	num5: 53,
	num6: 54,
	num7: 55,
	num8: 56,
	num9: 57,

	a: 65,
	b: 66,
	c: 67,
	d: 68,
	e: 69,
	f: 70,
	g: 71,
	h: 72,
	i: 73,
	j: 74,
	k: 75,
	l: 76,
	m: 77,
	n: 78,
	o: 79,
	p: 80,
	q: 81,
	r: 82,
	s: 83,
	t: 84,
	u: 85,
	v: 86,
	w: 87,
	x: 88,
	y: 89,
	z: 90,

	backspace: 8,
	tab: 9,
	enter: 13,
	shift: 16,
	ctrl: 17,
	alt: 18,
	space: 32,

	f1: 112,
	f2: 113,
	f3: 114,
	f4: 115,
	f5: 116,
	f6: 117,
	f7: 118,
	f8: 119,
	f9: 120,
	f10: 121,
	f11: 122,
	f12: 123,

	left: 37,
	up: 38,
	right: 39,
	down: 40,

	esc: 243
};

Object.keys(keyCode)
	.map(function(key) {
		return keyCode[key];
	})
	.forEach(function(value) {
		core.keybind(value, value);
	});

var KeyClass = enchant.Class.create({
	initialize: function() {
		this.listeners = [];
	},

	name: '',

	count: 0,

	clicked: {
		get: function() {
			return this.count === 1;
		}
	},

	pressed: {
		get: function() {
			return this.count > 0;
		}
	},

	released: {
		get: function() {
			return this.count <= 0;
		}
	},

	update: function(input) {
		// 前フレームの状態を保持する
		var pressed = this.pressed;
		var released = this.released;
		// 入力の状態を更新する
		this.count = input ? this.count + 1 : 0;
		// press, release, observe を呼び出す
		if (pressed && this.released) {
			this.dispatch('release');
		}
		if (released && this.pressed) {
			this.dispatch('press');
		}
		this.dispatch('observe');
	},

	dispatch: function(type) {
		this.listeners
			.filter(function(listener) {
				return listener.type === type;
			})
			.forEach(function(listener) {
				var thisArg = listener.thisArg === undefined ? this : listener.thisArg;
				listener.listener.call(thisArg, this);
			}, this);
	},

	on: function(type, event, thisArg) {
		this.listeners.push({
			type: type,
			listener: event,
			thisArg: thisArg
		});
	},

	press: function(listener, thisArg) {
		this.on('press', listener, thisArg);
	},

	release: function(listener, thisArg) {
		this.on('release', listener, thisArg);
	},

	observe: function(listener, thisArg) {
		this.on('observe', listener, thisArg);
	}
});

Object.keys(keyCode).forEach(function(key) {
	Key[key] = new KeyClass();
	Key[key].name = key;
});

const alias = {
	space: 'a',
	up: 'up',
	down: 'down',
	left: 'left',
	right: 'right'
};

core.on('enterframe', function() {
	Object.keys(keyCode).forEach(function(key) {
		let input = core.input[keyCode[key]];

		// ui.enchant.js などの対策
		if (key in alias) {
			input = input || core.input[alias[key]];
		}

		// console.log(key);

		Key[key].update(input);
	});
});

export { KeyClass };
export default Key;
