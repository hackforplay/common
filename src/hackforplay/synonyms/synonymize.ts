import { FunctionValue, PrimitiveValue } from '../../definition';

type Key = string | number | symbol;

export interface ISynonyms {
  [synonym: string]: PrimitiveValue | FunctionValue | undefined; // TODO: ISynonym は階層構造を持つ
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

const targetProxyCache = new WeakMap<any, any>();
const reverseProxyCache = new WeakMap<any, any>();

/**
 * @deprecated
 * パフォーマンスに問題があった (現在は修正済み)
 * https://bit.ly/3icN2MG
 */
export function synonymizeClass<T extends typeof Class>(
  targetClass: T,
  synonyms: ISynonyms
): T {
  return new Proxy(targetClass, {
    construct(target, argArray) {
      const instance = new target(...argArray);
      const callback = instance[PropertyMissing].bind(instance);
      return synonymize(instance, synonyms, callback);
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
  props: Key[] = []
): T {
  // 既に作られているかチェックする
  const cache = targetProxyCache.get(proxyTarget);
  if (cache) {
    return cache;
  }
  if (reverseProxyCache.has(proxyTarget)) {
    return proxyTarget;
  }

  const proxied = new Proxy(proxyTarget, {
    get(target: any, p, receiver) {
      (window as any)._walkImplTime++;
      if (p in target) {
        const value = Reflect.get(target, p, receiver); // ユーザーが作った getter の中でもシノニムが使えるようにするため
        return value; // TODO: ISynonym は階層構造を持つ
      }
      if (typeof p === 'string') {
        const s = synonyms[p];
        if (s && s.name in target) {
          const value = target[s.name];
          return value; // TODO: ISynonym は階層構造を持つ
        }
      }
      const allProps = props.concat(p);
      propertyMissing && propertyMissing(toString(allProps));
      return undefined;
    },
    has(target: any, p) {
      if (Reflect.has(target, p)) return true;
      const property = typeof p === 'string' && synonyms[p];
      return property ? Reflect.has(target, property.name) : false;
    },
    set(target: any, p, value, receiver) {
      if (p in target) {
        Reflect.set(target, p, value, receiver); // ユーザーが作った setter の中でもシノニムが使えるようにするため
        return true;
      }
      if (typeof p === 'string') {
        const s = synonyms[p];
        if (s && s.name in target) {
          target[s.name] = value;
          return true;
        }
      }
      Reflect.set(target, p, value, receiver);
      return true;
    }
  });

  // この WeakMap からいつでも Proxy オブジェクトにアクセスできる
  targetProxyCache.set(proxyTarget, proxied);

  // この WeakMap で Proxy オブジェクトから元のオブジェクトを取得できる
  reverseProxyCache.set(proxied, proxyTarget);

  return proxied;
}

/**
 * Synonymize されているかも知れないオブジェクトから
 * 元のオブジェクトを得る。失敗した場合は自分自身を返す
 */
export function reverseSynonymize<T>(proxied: T): T {
  const proxyTarget = reverseProxyCache.get(proxied);
  return proxyTarget !== undefined ? proxyTarget : proxied;
}
