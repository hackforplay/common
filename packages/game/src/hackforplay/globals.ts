/**
 * "へんすう"の実体
 */
const singletonTarget = {};

export class MissingGlobal extends Error {
  constructor(displayName: string, property: string) {
    const message = `${displayName}['${property.toString()}'] には、まだ何も入っていません`;
    super(message);
  }
}

let changed = false;
export function emitGlobalsChangedIfNeeded(listener: () => void) {
  if (!changed) return; // 変わっていない
  changed = false; // コールする前にフラグを下ろす => リスナーの中でフラグを立てられる
  listener();
}

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

      changed = true; // このフレームの最後にリスナーをコールするようフラグを立てる
      Reflect.set(target, key, nextValue, receiver);

      return true;
    }
  });
}
