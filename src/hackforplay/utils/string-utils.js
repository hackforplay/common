const [kana, dakuon, handakuon] = `
あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん
　　ゔ　　がぎぐげござじずぜぞだぢづでど　　　　　ばびぶべぼ
　　　　　　　　　　　　　　　　　　　　　　　　　ぱぴぷぺぽ
`
	.split('\n')
	.slice(1);

/**
 * カナを濁音にする　既に濁音なら元に戻す
 * @param {string} char 変換する文字
 * @return {string} 変換された文字
 */
export function dakuten(char) {
	if (char.match(/[ァ-ン]/))
		return String.fromCharCode(
			dakuten(String.fromCharCode(char.charCodeAt() - 96)).charCodeAt() + 96
		);
	let result = '';
	if (dakuon.includes(char)) result = kana[dakuon.indexOf(char)];
	if (kana.includes(char)) result = dakuon[kana.indexOf(char)];
	if (handakuon.includes(char)) result = dakuon[handakuon.indexOf(char)];
	return !result || result.match(/\s/) ? char : result;
}

/**
 * カナを半濁音にする　既に半濁音なら元に戻す
 * @param {string} char 変換する文字
 * @return {string} 変換された文字
 */
export function handakuten(char) {
	if (char.match(/[ァ-ン]/))
		return String.fromCharCode(
			handakuten(String.fromCharCode(char.charCodeAt() - 96)).charCodeAt() + 96
		);
	let result = '';
	if (handakuon.includes(char)) result = kana[handakuon.indexOf(char)];
	if (kana.includes(char)) result = handakuon[kana.indexOf(char)];
	if (dakuon.includes(char)) result = handakuon[dakuon.indexOf(char)];
	return !result || result.match(/\s/) ? char : result;
}

/**
 * 一般的なカナか判別する
 * @param {string} char 判定する文字
 * @return {boolean} 結果
 */
export function isStandardKana(char) {
	// 複雑なカナが含まれている
	if (/[ゕヵゖヶゎヮゐヰゑヱ]/.test(char)) return false;
	return char.match(/[ぁ-んァ-ン]/);
}

/**
 * 文字列を LCC に変換する
 * @param {string} string 変換する文字列
 * @return {string} 結果
 */
export function toLowerCamelCase(string) {
	return string.at(0).toLowerCase() + string.substr(1);
}

/**
 * 文字列を UCC に変換する
 * @param {string} string 変換する文字列
 * @return {string} 結果
 */
export function toUpperCamelCase(string) {
	return string.at(0).toUpperCase() + string.substr(1);
}

/**
 * 文字列を分割して配列にする
 * @param {string} str 分割する文字列
 * @return {array} 文字列を分割した結果
 */
export function stringToArray(string) {
	return string.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g) || [];
}
