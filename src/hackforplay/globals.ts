const singletonTarget = {};

export class MissingGlobal extends Error {
  constructor(displayName: string, property: string) {
    const message = `${displayName}['${property.toString()}'] には、まだ何も入っていません`;
    super(message);
  }
}

export interface GlobalsSubscriber {
  <T>(payload: {
    key: string | number | symbol;
    prevValue: T;
    nextValue: T;
  }): void;
}

const globalsSubscribers = new Set<GlobalsSubscriber>();

export function subscribeGlobals(subscriber: GlobalsSubscriber) {
  globalsSubscribers.add(subscriber);
  return () => {
    globalsSubscribers.delete(subscriber);
  };
}

export function useGlobals(displayName: string) {
  return new Proxy<{ [key: string]: any }>(singletonTarget, {
    get(target, p, receiver) {
      if (p in target) {
        return Reflect.get(target, p, receiver);
      }
      throw new MissingGlobal(displayName, p.toString());
    },
    set(target, p, nextValue, receiver) {
      const prevValue = Reflect.get(target, p, receiver);
      if (p in target) {
        // 直前の値と比較する
        if (prevValue === nextValue) {
          return true; // 成功, ただし通知はしない
        }
      }
      Reflect.set(target, p, nextValue, receiver);
      globalsSubscribers.forEach(cb => cb({ key: p, prevValue, nextValue }));
      return true;
    }
  });
}
