export interface IObservedArray<T> extends Array<T> {
  /**
   * 配列の中身が変更された回数
   * Proxy の set ハンドラを監視 (length も含む) している
   */
  readonly mutatedCount: number;
}

/**
 * 与えられた配列の中身が変更された回数を保持する
 * enchant.js の Entity::colletion が変化したことを知るために作成した
 */
export function observeArray<T>(source: T[] = []) {
  const array = Array.from(source);

  let mutatedCount = 0;
  Object.defineProperty(array, 'mutatedCount', {
    configurable: true,
    enumerable: true,
    get() {
      return mutatedCount;
    }
  });

  const observedArray = new Proxy(array, {
    set(target, p, value, receiver) {
      mutatedCount++;
      return Reflect.set(target, p, value, receiver);
    }
  });

  return observedArray as IObservedArray<T>;
}
