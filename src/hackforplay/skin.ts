import { default as enchant } from '../enchantjs/enchant';
import RPGObject from './object/object';
import { default as SAT } from '../lib/sat.min';
import { default as BehaviorTypes } from './behavior-types';
import { default as logFunc } from '../mod/logFunc';
import { fetchText } from './feeles';

export interface ISkin {
  name: string;
  image: string;
  column: number;
  row: number;
  sprite: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  collider: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  direction: 1 | 4;
  mayRotate: boolean;
  frame?: {
    idle?: number[];
    walk?: number[];
    attack?: number[];
    dead?: number[];
  };
}
export type Result = Promise<(object: RPGObject) => void>;

let baseUrl = 'https://storage.googleapis.com/hackforplay-skins/';
export const getBaseUrl = () => baseUrl;
export const setBaseUrl = (url: string) => {
  baseUrl = url;
};

const _cache: { [name: string]: Result } = {};
const _surfaces: { [name: string]: typeof enchant.Surface } = {};

const a = (...args: any[]): any[] => {
  const array = [];
  for (let index = 0; index < args.length; index += 2) {
    const n = args[index];
    const l: number = args[index + 1];
    for (let i = 0; i < l; i++) array.push(n);
  }
  return array;
};

const setD6 = (object: RPGObject, behavior: string, frame: any[]) => {
  object.setFrame(behavior, () =>
    frame.map(i => (i !== null && i >= 0 ? i + object.direction * 6 : i))
  );
};

const nope = () => {};

/**
 * 与えられたスキンを任意の RPGObject に適用するための関数を返す
 * @param skin スキンオブジェクト
 */
export const dress = (skin: ISkin) => (object: RPGObject) => {
  // あらかじめ Sprite の差分を調整しておく
  object.x += skin.sprite.x - object.offset.x;
  object.y += skin.sprite.y - object.offset.y;
  // パラメータのセット
  object.image = _surfaces[skin.name];
  object.width = skin.sprite.width;
  object.height = skin.sprite.height;
  object.offset = {
    x: skin.sprite.x,
    y: skin.sprite.y
  };
  object._mayRotate = skin.mayRotate;
  // ダメージ判定用のポリゴン
  object.collider = new SAT.Box(
    new SAT.V(object.x, object.y),
    skin.collider.width,
    skin.collider.height
  ).toPolygon();
  object.collider.setOffset(
    new SAT.V(skin.collider.x - skin.sprite.x, skin.collider.y - skin.sprite.y)
  ); // (x, y) は Sprite の起点 -> Sprite の分を引く, collider の分を足す
  object._graphicColumn = skin.column; // 後方互換性

  // TODO: ６列 or １列で決め打ちしているが, そもそも列数で判断すべきではない
  if (skin.column === 6) {
    const idleFrames6 = (skin.frame && skin.frame.idle) || [1, 1];
    const walkFrames6 = (skin.frame && skin.frame.walk) || [
      0,
      3,
      1,
      3,
      2,
      3,
      1,
      1
    ];
    const attackFrames6 = (skin.frame && skin.frame.attack) || [
      3,
      4,
      4,
      4,
      5,
      4
    ];
    const deadFrames6 = (skin.frame && skin.frame.dead) || [1, 1];
    // 配列をオブジェクトにセット
    object.directionType = 'quadruple';
    setD6(object, BehaviorTypes.Idle, a(...idleFrames6));
    setD6(object, BehaviorTypes.Walk, a(...walkFrames6, null, 1));
    setD6(object, BehaviorTypes.Attack, a(...attackFrames6, null, 1));
    setD6(object, BehaviorTypes.Dead, a(...deadFrames6, null, 1));
  } else {
    const idleFrames = (skin.frame && skin.frame.idle) || [1, 1];
    const walkFrames = (skin.frame && skin.frame.walk) || [0, 10];
    const attackFrames = (skin.frame && skin.frame.attack) || [0, 12];
    const deadFrames = (skin.frame && skin.frame.dead) || [0, 1];
    // 配列をオブジェクトにセット
    object.directionType = 'single';
    object.setFrame(BehaviorTypes.Idle, a(...idleFrames));
    object.setFrame(BehaviorTypes.Walk, a(...walkFrames, null, 1));
    object.setFrame(BehaviorTypes.Attack, a(...attackFrames, null, 1));
    object.setFrame(BehaviorTypes.Dead, a(...deadFrames, null, 1));
  }
};

/**
 * Hack.skin
 */
export default async function skin(
  name: string | TemplateStringsArray
): Result {
  if (name in _cache) return _cache[name + ''];

  const _promise = Promise.resolve()
    .then(() => {
      if (!fetchText) {
        throw new Error('feeles.fetchText is not defined');
      }
      return fetchText(baseUrl + name);
    })
    .then(
      json =>
        new Promise((resolve: (_skin: ISkin) => void, reject) => {
          // スキンのダウンロード完了
          const _skin: ISkin = JSON.parse(json);
          // Data URL をメモリに載せるまで待つ (preload)
          const onComplete = () => resolve(_skin);
          const surface = enchant.Surface.load(_skin.image, onComplete, reject);
          _surfaces[name + ''] = surface;
        })
    )
    .then(_skin => dress(_skin))
    .catch(error => {
      logFunc(`${name} というスキンは ないみたい`, true);
      console.error(error);
      return nope;
    });

  return (_cache[name + ''] = _promise);
}
