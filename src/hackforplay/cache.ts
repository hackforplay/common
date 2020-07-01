import { getHack } from './get-hack';
import RPGObject from './object/object';

interface MemoCache<Dependencies = any[], Result = any> {
  deps: Dependencies;
  result: Result;
}

const memo__caches = new Map<string, MemoCache>();

/**
 * deps が同じ場合はキャッシュされた結果を返すように関数をメモ化する
 * 1. 直前の値しかキャッシュされない
 * 2. 関数名ごとにメモ化される (無名関数には使えない)
 * 3. 引数は使えない (必要な場合はカリー化する)
 */
function memo<Result, Dependencies extends any[]>(
  fun: () => Result,
  deps: Dependencies
) {
  if (!fun.name) {
    throw new Error('Cannot memoize anonymous function via memo()');
  }
  const latestCache = memo__caches.get(fun.name);
  if (latestCache) {
    if (arrayShallowEquals(latestCache.deps, deps)) {
      return latestCache.result as Result;
    }
  }
  console.time(fun.name);
  const result = fun();
  console.timeEnd(fun.name);
  memo__caches.set(fun.name, { deps, result });
  return result;
}

const memoMethod__cache = new WeakMap<Function, MemoCache>();

/**
 * クラスメソッドの結果をメモ化する関数
 * 関数の参照ごとにキャッシュされる
 * 引数が deps の役割を果たす
 * private getDefaultCollisionFlag = memoMethod(() => {
 *   // Heavy calcuration
 *   return true;
 * }).bind(this);
 */
export function memoMethod<Params extends any[], Result>(
  fun: (...params: Params) => Result
) {
  return (...params: Params) => {
    const latestCache = memoMethod__cache.get(fun);
    if (latestCache) {
      if (arrayShallowEquals(latestCache.deps, params)) {
        return latestCache.result as Result;
      }
    }
    const result = fun(...params);
    memoMethod__cache.set(fun, { deps: params, result });
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

  return memo(
    function objectsInDefaultMap() {
      return all.filter(item => item.map === map && Boolean(item.parentNode));
    },
    [map, all.mutatedCount]
  );
}
