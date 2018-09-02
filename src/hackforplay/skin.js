import Hack from './hack';

const Skin = {};

// あとで mod 関数から名前を取得するための対応表
Object.defineProperty(Skin, '__name', {
	enumerable: false,
	value: new WeakMap()
});

/**
 * 新しいスキンを追加する
 * @param {string} name スキンの名前. Skin.{name} になる
 * @param {Function} func スキンの中身
 */
export function addSkin(name, func) {
	if (name in Skin) {
		Hack.log(`Skin.${name} は すでにつかわれています`);
		return;
	}
	// 追加
	Skin[name] = func;
	Skin.__name.set(func, name);
}

export default Skin;
