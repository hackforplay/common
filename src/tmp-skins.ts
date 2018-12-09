// v0.10.x で新しいスキンを使えるようにするための暫定処理. スキンを新しい API にして、これを消す
import { default as Skin } from './hackforplay/deprecated-skin';
import { default as game } from './hackforplay/game';
import { default as RPGObject } from './hackforplay/object/object';
import { default as SAT } from './lib/sat.min';
import { default as BehaviorTypes } from './hackforplay/behavior-types';

const unitSize = 32; // タイルの大きさ
const a = (...args: any[]): any[] => {
  const array = [];
  for (let index = 0; index < args.length; index += 2) {
    const n = args[index];
    const l: number = args[index + 1];
    for (let i = 0; i < l; i++) array.push(n);
  }
  return array;
};

const avatars = [
  { key: 'ドラゴン', fileName: 'dragon', width: 456, height: 240 },
  { key: 'しにがみ', fileName: 'grim-reaper', width: 288, height: 240 },
  { key: 'ナイト_おんな', fileName: 'knight-female', width: 240, height: 224 },
  { key: 'ナイト_おとこ', fileName: 'knight-male', width: 240, height: 224 },
  { key: 'リザードマン', fileName: 'lizardman', width: 240, height: 144 },
  { key: 'プリンセス', fileName: 'princess', width: 240, height: 224 },
  { key: 'スライム', fileName: 'slime', width: 192, height: 160 },
  { key: 'ウィザード', fileName: 'wizard', width: 240, height: 224 }
];

for (const { key, fileName, width, height } of avatars) {
  const src = `resources/0.10.x/avatars/${fileName}.png`;
  game.preload(src);

  // 追加
  const func = function(this: RPGObject) {
    this.image = game.assets[src];
    this.width = width / 6;
    this.height = height / 4;
    this.offset = {
      x: -(this.width - unitSize) / 2,
      y: -(this.height - unitSize) / 1.2
    };

    this._graphicColumn = 6; // ６列画像に対応
    setFrameD6(this, BehaviorTypes.Idle, [1]);
    setFrameD6(this, BehaviorTypes.Walk, [0, 0, 0, 1, 1, 1, 2, 2, 2, 1, null]);
    setFrameD6(this, BehaviorTypes.Attack, a(3, 4, 4, 4, 5, 4, null, 1));
    setFrameD6(this, BehaviorTypes.Dead, [1, null]);
    this.directionType = 'quadruple';
    // ダメージ判定用のポリゴン
    this.collider = new SAT.Box(new SAT.V(this.x, this.y), 32, 32).toPolygon();
    this.collider.setOffset(new SAT.V(-this.offset.x, -this.offset.y));
  };
  (<any>Skin)[key] = func;
  (<any>Skin).__name.set(func, key);
}

function setFrameD6(object: RPGObject, behavior: string, frame: any[]) {
  object.setFrame(behavior, () =>
    frame.map(i => (i !== null && i >= 0 ? i + object.direction * 6 : i))
  );
}

const items = [
  { key: 'ビーム', fileName: 'beam', width: 32, height: 32 },
  {
    key: 'まほうじん_オン',
    fileName: 'magic-circle-on',
    width: 32,
    height: 32
  },
  {
    key: 'まほうじん_オフ',
    fileName: 'magic-circle-off',
    width: 32,
    height: 32
  },
  { key: 'ワープ_ブルー', fileName: 'warp-b', width: 32, height: 32 },
  { key: 'ワープ_グリーン', fileName: 'warp-g', width: 32, height: 32 },
  { key: 'ワープ_レッド', fileName: 'warp-r', width: 32, height: 32 },
  { key: 'ワープ_イエロー', fileName: 'warp-y', width: 32, height: 32 },
  { key: 'ボム', fileName: 'bomb', width: 32, height: 32 },
  { key: 'コイン', fileName: 'coin', width: 32, height: 32 },
  { key: 'ダイヤモンド', fileName: 'diamond', width: 32, height: 32 },
  { key: 'とじたゲート_ブルー', fileName: 'gate_b_c', width: 32, height: 48 },
  { key: 'ひらいたゲート_ブルー', fileName: 'gate_b_o', width: 32, height: 48 },
  { key: 'とじたゲート_グリーン', fileName: 'gate_g_c', width: 32, height: 48 },
  {
    key: 'ひらいたゲート_グリーン',
    fileName: 'gate_g_o',
    width: 32,
    height: 48
  },
  { key: 'とじたゲート_レッド', fileName: 'gate_r_c', width: 32, height: 48 },
  { key: 'ひらいたゲート_レッド', fileName: 'gate_r_o', width: 32, height: 48 },
  { key: 'とじたゲート_イエロー', fileName: 'gate_y_c', width: 32, height: 48 },
  {
    key: 'ひらいたゲート_イエロー',
    fileName: 'gate_y_o',
    width: 32,
    height: 48
  },
  { key: 'ハート', fileName: 'heart', width: 32, height: 32 },
  { key: 'かぎ_ブルー', fileName: 'key_b', width: 32, height: 32 },
  { key: 'かぎ_グリーン', fileName: 'key_g', width: 32, height: 32 },
  { key: 'かぎ_レッド', fileName: 'key_r', width: 32, height: 32 },
  { key: 'かぎ_イエロー', fileName: 'key_y', width: 32, height: 32 },
  { key: 'かいだん', fileName: 'stairs', width: 32, height: 32 },
  { key: 'スター', fileName: 'star', width: 32, height: 32 },
  {
    key: 'とじたたからばこ_ブルー',
    fileName: 'tbox_b_c',
    width: 32,
    height: 32
  },
  {
    key: 'ひらいたたからばこ_ブルー',
    fileName: 'tbox_b_o',
    width: 32,
    height: 32
  },
  {
    key: 'とじたたからばこ_グリーン',
    fileName: 'tbox_g_c',
    width: 32,
    height: 32
  },
  {
    key: 'ひらいたたからばこ_グリーン',
    fileName: 'tbox_g_o',
    width: 32,
    height: 32
  },
  {
    key: 'とじたたからばこ_レッド',
    fileName: 'tbox_r_c',
    width: 32,
    height: 32
  },
  {
    key: 'ひらいたたからばこ_レッド',
    fileName: 'tbox_r_o',
    width: 32,
    height: 32
  },
  {
    key: 'とじたたからばこ_イエロー',
    fileName: 'tbox_y_c',
    width: 32,
    height: 32
  },
  {
    key: 'ひらいたたからばこ_イエロー',
    fileName: 'tbox_y_o',
    width: 32,
    height: 32
  }
];

for (const { key, fileName, width, height } of items) {
  const src = `resources/0.10.x/icons/${fileName}.png`;
  game.preload(src);

  // 追加
  const func = function(this: RPGObject) {
    this.image = game.assets[src];
    this.width = width;
    this.height = height;
    this.offset = { x: 0, y: -(this.height - unitSize) };

    this.setFrame(BehaviorTypes.Idle, [1]);
    this.setFrame(BehaviorTypes.Walk, a(0, 10, null, 1));
    this.setFrame(BehaviorTypes.Attack, a(0, 12, null, 1));
    this.setFrame(BehaviorTypes.Dead, [0, null]);
    // this.directionType = 'single';
    // ダメージ判定用のポリゴン
    this.collider = new SAT.Box(new SAT.V(this.x, this.y), 32, 32).toPolygon();
    this.collider.setOffset(new SAT.V(-this.offset.x, -this.offset.y));
  };
  (<any>Skin)[key] = func;
  (<any>Skin).__name.set(func, key);
}
