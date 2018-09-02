import RPGObject from './object/object';

/**
 * その name をもつオブジェクトを見つける. もしなければ Hack.log を表示する
 * @param {string} param オブジェクトの名前
 * @returns {RPGObject|null} オブジェクト
 */
export default function find(name) {
	// スキンならスキンの name を取得, 名前ならそのまま使う
	const item = RPGObject.collection.find(item => item.name === name);
	if (!item) {
		Hack.log(`'${name}' は まだつくられていない`);
		return null;
	}
	return item;
}
