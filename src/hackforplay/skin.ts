import { load, OutputV1 } from '@hackforplay/skins';
import { default as enchant } from '../enchantjs/enchant';
import { default as SAT } from '../lib/sat.min';
import RPGObject from './object/object';
import { fetchDataURL } from './feeles';

const preload = load();

type Surface = ReturnType<typeof enchant.Surface>;

/**
 * 互換性を保つためのエイリアス
 */
export interface ISkin extends OutputV1 {
  name: string;
  surface: Surface;
}

export type SkinCachedItem = Promise<(object: RPGObject) => void>;

let baseUrl = 'https://skins.hackforplay.xyz/';
export const getBaseUrl = () => baseUrl;
export const setBaseUrl = (url: string) => {
  baseUrl = url;
};

const _cache: { [name: string]: SkinCachedItem } = {};

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

/**
 * 与えられたスキンを任意の RPGObject に適用するための関数を返す
 * @param skin スキンオブジェクト
 */
export const dress = (skin: ISkin) => (object: RPGObject) => {
  // あらかじめ Sprite の差分を調整しておく
  object.x += skin.sprite.x - object.offset.x;
  object.y += skin.sprite.y - object.offset.y;
  // パラメータのセット
  object.image = skin.surface; // 画像バイナリは動的にロードしている
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
  frame.attack?.push(null, 1);
  frame.dead?.push(null, 1);
  // skin の参照を保持する
  object.currentSkin = skin;
};

export async function getSkin(
  input: string | TemplateStringsArray
): SkinCachedItem {
  const name = input + '';
  if (name in _cache) return _cache[name];

  const _promise = preload.then(definition => {
    // スキンのダウンロード完了
    const index = definition.index[name];
    const item =
      typeof index === 'number' ? definition.items[index] : undefined;
    if (!item) {
      throw new Error(`Not found: '${name}'`);
    }
    // まず単一色の画像を生成し、それから画像をロードする
    const surface = initSurface(
      item.sprite.width * item.column,
      item.sprite.height * item.row,
      definition.endpoint + item.imageUri
    );
    // V0 では JSON のロードを待っていたが、V1 では preload してあるので即時コール
    return dress({ ...item, name, surface });
  });
  return (_cache[name] = _promise);
}

/**
 *
 * @param width Surface 全体の幅
 * @param height Surface 全体の高さ
 * @param src ロードしたい画像の URL
 * @param color 読み込み中の色
 */
export function initSurface(
  width: number,
  height: number,
  src?: string,
  color = 'rgba(0,0,0,0.5)' // ロード中は半透明の黒になっている
): Surface {
  const surface = new enchant.Surface(width, height);
  const context: CanvasRenderingContext2D = surface.context;

  context.fillStyle = color;
  context.fillRect(0, 0, width, height);
  const handleError = () => {
    // エラー時は真っ赤になる
    context.fillStyle = '#ff0000';
    context.fillRect(0, 0, width, height);
  };

  const img = new Image(width, height);
  img.onload = () => {
    context.clearRect(0, 0, width, height);
    context.drawImage(img, 0, 0);
  };
  img.onerror = handleError;
  src &&
    fetchDataURL?.(src)
      .then(dataUrl => {
        img.src = dataUrl;
      })
      .catch(handleError);

  return surface;
}
