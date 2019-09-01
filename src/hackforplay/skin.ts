import { default as enchant } from '../enchantjs/enchant';
import { default as SAT } from '../lib/sat.min';
import { fetchText } from './feeles';
import RPGObject from './object/object';

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
    idle?: (number | null)[];
    walk?: (number | null)[];
    attack?: (number | null)[];
    dead?: (number | null)[];
  };
}
export type SkinCachedItem = Promise<(object: RPGObject) => void>;

let baseUrl = 'https://storage.googleapis.com/hackforplay-skins/';
export const getBaseUrl = () => baseUrl;
export const setBaseUrl = (url: string) => {
  baseUrl = url;
};

const _cache: { [name: string]: SkinCachedItem } = {};
const _surfaces: { [name: string]: typeof enchant.Surface } = {};

export function decode(...args: (number | null)[]): (number | null)[] {
  const array = [];
  for (let index = 0; index < args.length; index += 2) {
    const n = args[index];
    const l = args[index + 1];
    if (l === null) {
      throw new Error('Invalid skin frame: ' + JSON.stringify(args));
    }
    for (let i = 0; i < l; i++) array.push(n);
  }
  return array;
}

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

  // アニメーションの初期値を設定する
  const frame = (skin.frame = skin.frame || {});
  if (skin.direction === 4) {
    object.directionType = 'quadruple';
    frame.idle = frame.idle || [1, 1];
    frame.walk = frame.walk || [0, 3, 1, 3, 2, 3, 1, 1];
    frame.attack = frame.attack || [3, 4, 4, 4, 5, 4];
    frame.dead = frame.dead || [1, 1];
  } else {
    frame.idle = frame.idle || [1, 1];
    frame.walk = frame.walk || [0, 10];
    frame.attack = frame.attack || [0, 12];
    frame.dead = frame.dead || [0, 1];
  }
  // 互換性のため. アニメーションの終端を追加する
  frame.walk.push(null, 1);
  frame.attack.push(null, 1);
  frame.dead.push(null, 1);
  // skin の参照を保持する
  object.currentSkin = skin;
};

export async function getSkin(
  name: string | TemplateStringsArray
): SkinCachedItem {
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
