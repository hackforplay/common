import { getHack } from './get-hack';
import RPGObject from './object/object';

interface MemoCache<Params = any[], Result = any> {
  params: Params;
  result: Result;
}

const memo__caches = new WeakMap<Function, MemoCache>();

/**
 * deps が同じ場合はキャッシュされた結果を返すように関数をメモ化する
 * 1. 直前の値しかキャッシュされない
 * 2. 関数名ごとにメモ化される (関数の参照が変わってはいけない)
 *
 * 関数をメモ化する場合は次のようにする
 * function _adder(a, b) {
 *   return a + b;
 * }
 * function adder(a, b) {
 *   return memo(_adder)(a, b);
 * }
 *
 * クラスメソッドに対して使う場合は次のようにする
 * private getDefaultCollisionFlag = memoMethod(() => {
 *   // Heavy calcuration
 *   return true;
 * }).bind(this);
 */
export function memo<Params extends any[], Result>(
  fun: (...params: Params) => Result
) {
  return (...params: Params) => {
    const latestCache = memo__caches.get(fun);
    if (latestCache) {
      if (arrayShallowEquals(latestCache.params, params)) {
        return latestCache.result as Result;
      }
    }
    const result = fun(...params);
    memo__caches.set(fun, { params, result });
    return result;
  };
}

function arrayShallowEquals<T>(a: T[], b: T[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * 現在のマップ (Hack.map) にいて、シーンから削除されていない RPGObject を取得する
 */
export function objectsInDefaultMap() {
  const Hack = getHack();
  const map = 'map' in Hack ? Hack.map : undefined;
  const all = RPGObject.collection;

  return memo(_objectsInDefaultMap)(map, all, all.mutatedCount);
}

function _objectsInDefaultMap(
  map: any,
  all: RPGObject[],
  mutatedCount: number // eslint-disable-line
) {
  return all.filter(item => item.map === map && Boolean(item.parentNode));
}
