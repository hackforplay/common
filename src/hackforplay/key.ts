import { utils } from 'pixi.js';
import application from '../application';
import { keys } from './type-guards';

// TODO: KeyboardEvent.keyCode が非推奨なので対応する

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

interface IKeyClassListener<ThisArg> {
  (this: ThisArg, key: IKeyClass): void;
}

export interface IKeyClass {
  name: string;
  count: number;
  readonly clicked: boolean;
  readonly pressed: boolean;
  readonly released: boolean;
  press<T = IKeyClass>(listener: IKeyClassListener<T>, thisArg?: T): void;
  release<T = IKeyClass>(listener: IKeyClassListener<T>, thisArg?: T): void;
  observe<T = IKeyClass>(listener: IKeyClassListener<T>, thisArg?: T): void;
  pressOnce<T = IKeyClass>(listener: IKeyClassListener<T>, thisArg?: T): void;
  releaseOnce<T = IKeyClass>(listener: IKeyClassListener<T>, thisArg?: T): void;
  update(input: any): void;
}

let Key: { [P in keyof typeof keyCode]: IKeyClass } = {} as any; // eslint-disable-line

const keyCode = {
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

class KeyClass extends utils.EventEmitter implements IKeyClass {
  public name: string;
  public count: number;

  public constructor() {
    super();
    this.name = '';
    this.count = 0;
  }

  public get clicked() {
    return this.count === 1;
  }

  public get pressed() {
    return this.count > 0;
  }

  public get released() {
    return this.count <= 0;
  }

  public update(input: any) {
    // 前フレームの状態を保持する
    const pressed = this.pressed;
    const released = this.released;
    // 入力の状態を更新する
    this.count = input ? this.count + 1 : 0;
    // press, release, observe を呼び出す
    if (pressed && this.released) {
      this.emit('release');
    }
    if (released && this.pressed) {
      this.emit('press');
    }
    this.emit('observe');
  }

  public press<T>(listener: IKeyClassListener<T>, thisArg: any) {
    this.on('press', listener, thisArg);
  }

  public release<T>(listener: IKeyClassListener<T>, thisArg: any) {
    this.on('release', listener, thisArg);
  }

  public observe<T>(listener: IKeyClassListener<T>, thisArg: any) {
    this.on('observe', listener, thisArg);
  }

  public pressOnce<T>(listener: IKeyClassListener<T>, thisArg: any) {
    this.on('press', listener, thisArg);
  }

  public releaseOnce<T>(listener: IKeyClassListener<T>, thisArg: any) {
    this.on('release', listener, thisArg);
  }
}

keys(keyCode).forEach(function (key) {
  Key[key] = new KeyClass();
  Key[key].name = key;
});

const alias: { [key: string]: string } = {
  space: 'a',
  up: 'up',
  down: 'down',
  left: 'left',
  right: 'right'
};

const inputStatus = new Map<number | string, boolean>();

window.addEventListener(
  'keydown',
  ({ keyCode }) => {
    inputStatus.set(keyCode, true);
  },
  true
);
window.addEventListener(
  'keyup',
  ({ keyCode }) => {
    inputStatus.set(keyCode, false);
  },
  true
);

application.stage.on('enterframe', () => {
  keys(keyCode).forEach(function (key) {
    let input = inputStatus.get(keyCode[key]);

    // ui.enchant.js などの対策
    if (key in alias) {
      input = input || inputStatus.get(alias[key]);
    }

    Key[key].update(input);
  });
});

export { KeyClass };
export default Key;
