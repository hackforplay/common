const singletonTarget = {};

export class MissingGlobal extends Error {
  constructor(displayName: string, property: string) {
    const message = `${displayName}['${property.toString()}'] には、まだ何も入っていません`;
    super(message);
  }
}

export class SetGlobalRecursively extends Error {
  constructor(displayname: string, property: string) {
    const message = `${displayname}['${property}'] = がループしています`;
    super(message);
  }
}

export interface GlobalsSubscriber {
  <T>(payload: { key: string; prevValue: T; nextValue: T }): void;
}

const globalsSubscribers = new Set<GlobalsSubscriber>();

export function subscribeGlobals(subscriber: GlobalsSubscriber) {
  globalsSubscribers.add(subscriber);
  return () => {
    globalsSubscribers.delete(subscriber);
  };
}

const detectRecursiveSetter = new Set<string>();

export function useGlobals(displayName: string) {
  return new Proxy<{ [key: string]: any }>(singletonTarget, {
    get(target, p, receiver) {
      const key = p.toString(); // Object のキーに使うので 2 と "2" は同一のものとして扱う
      if (key in target) {
        return Reflect.get(target, key, receiver);
      }
      throw new MissingGlobal(displayName, key);
    },
    set(target, p, nextValue, receiver) {
      const key = p.toString(); // Object のキーに使うので 2 と "2" は同一のものとして扱う
      const prevValue = Reflect.get(target, key, receiver);
      if (key in target) {
        // 直前の値と比較する
        if (prevValue === nextValue) {
          return true; // 成功, ただし通知はしない
        }
      }

      // 無限ループになるのを防ぐ
      if (detectRecursiveSetter.has(key)) {
        throw new SetGlobalRecursively(displayName, key);
      }
      detectRecursiveSetter.add(key);

      Reflect.set(target, key, nextValue, receiver);
      globalsSubscribers.forEach(cb => cb({ key, prevValue, nextValue }));

      detectRecursiveSetter.delete(key);

      return true;
    }
  });
}
