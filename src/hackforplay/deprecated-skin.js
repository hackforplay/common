import Hack from './hack';

const __name = new WeakMap(); // あとで mod 関数から名前を取得するための対応表

const Skin = new Proxy(
  {
    __name
  },
  {
    get(target, p) {
      if (p === '__name') {
        return __name;
      }
      console.error(
        `Skin.${p} は非推奨になり, v0.24 で削除されます. 代わりに costume を使ってください`
      );
      return target[p];
    }
  }
);

/**
 * 新しいスキンを追加する
 * @param {string} name スキンの名前. Skin.{name} になる
 * @param {Function} func スキンの中身
 */
export function addSkin() {
  if (name in Skin) {
    Hack.log(`Skin.${name} は すでにつかわれています`);
    return;
  }
  // 追加
  Skin[name] = func;
  Skin.__name.set(func, name);
}

export default Skin;
