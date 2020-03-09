type Key = string | number | symbol;

export interface ISynonyms {
  [synonym: string]: string | undefined; // TODO: ISynonym は階層構造を持つ
}

export const PropertyMissing = Symbol('PropertyMissing');

function toString(props: Key[]) {
  return props
    .map(key =>
      typeof key === 'string'
        ? key
        : typeof key === 'number'
        ? `[${key}]`
        : key.toString()
    )
    .join('.');
}

/**
 * synonymizeClass に必要な型の制約を書き下すためのクラス
 */
class Class {
  /**
   * enchant.js の collection
   * インスタンスの参照を保持する仕組みなので、Proxied object の参照で上書きしなければいけない
   */
  public static collection?: Class[];
  /**
   * コンストラクタはなんでもいい
   */
  constructor(...args: any[]) {}
  /**
   * プロパティが見つからない場合にコールされるメソッド
   * 分かりやすいログを出力すべき
   * @param chainedName "hoge.fuga" のような文字列
   */
  [PropertyMissing]: (chainedName: string) => void;
}

export const proxyMap = new Map<any, any>();

export function synonymizeClass<T extends typeof Class>(
  targetClass: T,
  synonyms: ISynonyms
): T {
  return new Proxy(targetClass, {
    construct(target, argArray) {
      const instance = new target(...argArray);
      const callback = instance[PropertyMissing].bind(instance);
      const proxied = synonymize(instance, synonyms, callback);

      // enchant.js の collection に介入する #68
      if (Array.isArray(target.collection)) {
        const index = target.collection.indexOf(instance);
        if (index > -1) {
          target.collection.splice(index, 1, proxied);
        }
      }

      // enchant.js の parentNode を付け替える
      const p = (instance as any).parentNode;
      if (p) {
        const index = p.childNodes.indexOf(instance);
        if (index > -1) {
          p.childNodes.splice(index, 1, proxied);
        } else {
          p.childNodes.push(proxied);
        }
      }

      // 元のオブジェクトから Proxy の参照を得るための苦肉の策
      proxyMap.set(instance, proxied);

      return proxied;
    }
  });
}

export function synonymize<T extends object>(
  target: T,
  synonyms: ISynonyms,
  propertyMissing: Class[typeof PropertyMissing]
) {
  return createProxy(target, synonyms, propertyMissing);
}

function createProxy<T extends object>(
  proxyTarget: T,
  synonyms: ISynonyms,
  propertyMissing: Class[typeof PropertyMissing],
  props: (Key)[] = []
): T {
  return new Proxy(proxyTarget, {
    get(target: any, p, receiver) {
      const allProps = props.concat(p);
      if (p in target) {
        const value = Reflect.get(target, p, receiver); // ユーザーが作った getter の中でもシノニムが使えるようにするため
        return value; // TODO: ISynonym は階層構造を持つ
      }
      if (typeof p === 'string') {
        const s = synonyms[p];
        if (s && s in target) {
          const value = target[s];
          return value; // TODO: ISynonym は階層構造を持つ
        }
      }
      propertyMissing && propertyMissing(toString(allProps));
      return undefined;
    },
    has(target: any, p) {
      return (
        Reflect.has(target, p) ||
        (p in synonyms && Reflect.has(target, (synonyms as any)[p]))
      );
    },
    set(target: any, p, value, receiver) {
      if (p in target) {
        Reflect.set(target, p, value, receiver); // ユーザーが作った setter の中でもシノニムが使えるようにするため
        return true;
      }
      if (typeof p === 'string') {
        const s = synonyms[p];
        if (s && s in target) {
          target[s] = value;
        }
      }
      Reflect.set(target, p, value, receiver);
      return true;
    }
  });
}
