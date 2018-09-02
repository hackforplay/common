import 'hackforplay/core';

class Debug {
	// 子要素情報をログに出力する
	static children(parent) {
		let text = `Debug.children: ${parent.name}\n`;

		text += parent.childNodes
			.map((child, index) => {
				return `${index + 1}: ${child.name} ${child.order}`;
			})
			.reduce((a, b) => `${a}\n${b}`);

		console.info(text);
	}
}

export default Debug;
