import * as synonyms from './synonyms';

/**
 * 下記のイベントが利用されていたら, コンソールにエラーを出す
 * playerenter, playerstay, playerexit
 */
export default function deprecated() {
	const deprecated = ['playerenter', 'playerstay', 'playerexit'];
	for (const item of RPGObject.collection) {
		// for Japanese (synonym)
		for (const type of deprecated.map(type => synonyms.events[type])) {
			if (isListening(item, type)) {
				return `Deprecated: '${type}' は廃止予定です. 代わりに 'ふまれた' か 'どかれた' を使ってください`;
			}
		}
		// for English (origin)
		for (const type of deprecated) {
			if (isListening(item, type)) {
				return `Deprecated: '${type}' is deprecated. Please use 'addtrodden' or 'removetrodden' instead.`;
			}
		}
	}
}

function isListening(item, type) {
	return item['on' + type] || item._listeners[type];
}
