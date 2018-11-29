// v0.10.x で新しいスキンを使えるようにするための暫定処理. スキンを新しい API にして、これを消す
import { default as Skin } from './hackforplay/skin';
import { default as game } from './hackforplay/game';
import { default as RPGObject } from './hackforplay/object/object';
import { default as SAT } from './lib/sat.min';
import { default as BehaviorTypes } from './hackforplay/behavior-types';

const unitSize = 32; // タイルの大きさ
const a = (n, l) => {
  const array = new Array(l);
  for (let i = array.length - 1; i >= 0; i--) array[i] = n;
  return array;
};

const avatars = {
  ドラゴン: ['dragon', 456, 240],
  しにがみ: ['grim-reaper', 288, 240],
  ナイト_おんな: ['knight-female', 240, 224],
  ナイト_おとこ: ['knight-male', 240, 224],
  リザードマン: ['lizardman', 240, 144],
  プリンセス: ['princess', 240, 224],
  スライム: ['slime', 192, 160],
  ウィザード: ['wizard', 240, 224]
};

for (const key of Object.keys(avatars)) {
  const [fileName, width, height] = avatars[key];
  const src = `resources/0.10.x/avatars/${fileName}.png`;
  game.preload(src);

  // 追加
  const func = function(this: RPGObject) {
    this.image = game.assets[src];
    this.width = width / 6;
    this.height = height / 4;
    this.offset = {
      x: -(this.width - unitSize) / 2,
      y: -(this.height - unitSize) / 2
    };

    this._graphicColumn = 6; // ６列画像に対応
    setFrameD6(this, BehaviorTypes.Idle, [1]);
    setFrameD6(this, BehaviorTypes.Walk, [0, 0, 0, 1, 1, 1, 2, 2, 2, 1, null]);
    setFrameD6(
      this,
      BehaviorTypes.Attack,
      [].concat(a(3, 4), a(4, 4), a(5, 4), null)
    );
    setFrameD6(
      this,
      BehaviorTypes.Damaged,
      [].concat(2, a(-1, 3), a(2, 3), a(-1, 3))
    );
    setFrameD6(this, BehaviorTypes.Dead, [1, null]);
    this.directionType = 'quadruple';
    // ダメージ判定用のポリゴン
    this.collider = new SAT.Box(new SAT.V(this.x, this.y), 32, 32).toPolygon();
    this.collider.setOffset(new SAT.V(-this.offset.x, -this.offset.y));
  };
  Skin[key] = func;
  Skin.__name.set(func, key);
}

function setFrameD6(
  object: RPGObject,
  behavior: string,
  frame: (number | null)[]
) {
  object.setFrame(behavior, () =>
    frame.map(i => (i !== null && i >= 0 ? i + object.direction * 6 : i))
  );
}

const items = {
  ビーム: 'beam',
  ボム: 'bomb',
  コイン: 'coin',
  ダイヤモンド: 'diamond',
  とじたゲート_ブルー: 'gate_b_c',
  ひらいたゲート_ブルー: 'gate_b_o',
  とじたゲート_グリーン: 'gate_g_c',
  ひらいたゲート_グリーン: 'gate_g_o',
  とじたゲート_レッド: 'gate_r_c',
  ひらいたゲート_レッド: 'gate_r_o',
  とじたゲート_イエロー: 'gate_y_c',
  ひらいたゲート_イエロー: 'gate_y_o',
  ハート: 'heart',
  カギ_ブルー: 'key_b',
  カギ_グリーン: 'key_g',
  カギ_レッド: 'key_r',
  カギ_イエロー: 'key_y',
  かいだん: 'stairs',
  スター: 'star',
  とじたたからばこ_ブルー: 'tbox_b_c',
  ひらいたたからばこ_ブルー: 'tbox_b_o',
  とじたたからばこ_グリーン: 'tbox_g_c',
  ひらいたたからばこ_グリーン: 'tbox_g_o',
  とじたたからばこ_レッド: 'tbox_r_c',
  ひらいたたからばこ_レッド: 'tbox_r_o',
  とじたたからばこ_イエロー: 'tbox_y_c',
  ひらいたたからばこ_イエロー: 'tbox_y_o'
};

for (const key of Object.keys(items)) {
  const fileName = items[key];
  const src = `resources/0.10.x/icons/${fileName}.png`;
  game.preload(src);

  // 追加
  const func = function(this: RPGObject) {
    this.image = game.assets[src];
    this.width = unitSize;
    this.height = unitSize;
    this.offset = { x: 0, y: 0 };

    this.setFrame(BehaviorTypes.Idle, [1]);
    this.setFrame(BehaviorTypes.Walk, [].concat(a(0, 10), null));
    this.setFrame(BehaviorTypes.Attack, [].concat(a(0, 12), null));
    this.setFrame(BehaviorTypes.Damaged, a(0, 9));
    this.setFrame(BehaviorTypes.Dead, [0, null]);
    // this.directionType = 'single';
    // ダメージ判定用のポリゴン
    this.collider = new SAT.Box(new SAT.V(this.x, this.y), 32, 32).toPolygon();
  };
  Skin[key] = func;
  Skin.__name.set(func, key);
}
