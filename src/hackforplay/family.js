const Family = {
	// Default Families
	Independence: '__Independence',
	Player: 'Player',
	Map: 'Map',
	Player2: 'Player2',
	Enemy: 'Enemy',
	// Japanese Synonyms
	ドクリツ: '__Independence',
	プレイヤー: 'Player',
	エネミー: 'Enemy',
	マップ: 'Map',
	プレイヤー2: 'Player2'
};
export default Family;

const servantMasterMap = new WeakMap(); // 従者関係の参照を保持するマップ

/**
 * item1 と item2 が対立関係にあるかどうか
 * @param {RPGObject} item1 オブジェクト
 * @param {RPGObject} item2 別のオブジェクト
 */
export function isOpposite(item1, item2) {
	if (
		item1 === item2 ||
		hasContract(item1, item2) ||
		hasContract(item2, item1)
	) {
		return false; // どちらかが一方の従者である
	}
	if (
		item1.family === Family.Independence ||
		item2.family === Family.Independence
	) {
		// 独立軍はどのファミリーにも属していない
		return true;
	}
	// 今は文字列で実装されているので単純な比較を行う
	return item1.family !== item2.family;
}

/**
 *
 * @param {RPGObject} master マスターかもしれないオブジェクト
 * @param {RPGObject} servant サーヴァントかもしれないオブジェクト
 */
function hasContract(master, servant) {
	// servant => master => master's master... を再帰的に調べる
	const actualMaster = servantMasterMap.get(servant); // 直属のマスター
	// master が直属のマスターであるか, あるいは直属のマスターと契約関係にあるか
	return (
		actualMaster &&
		(actualMaster === master || hasContract(master, actualMaster))
	);
}

/**
 * master を servant の従者オブジェクト (かつ同じファミリー) として登録する
 * @param {RPGObject} master マスターになるオブジェクト
 * @param {RPGObject} servant サーヴァントになるオブジェクト
 */
export function registerServant(master, servant) {
	// [servant] => master の参照を記録する
	servantMasterMap.set(servant, master);
	// master と同じファミリーに所属させる
	servant.family = master.family;
}

/**
 * master を servant の従者オブジェクトではなくする
 * @param {RPGObject} master マスターだったオブジェクト
 * @param {RPGObject} servant サーヴァントだったオブジェクト
 */
export function unregisterServant(master, servant) {
	if (servantMasterMap.get(servant) === master) {
		// [servant] => master の参照を削除
		servantMasterMap.delete(servant);
	}
}
