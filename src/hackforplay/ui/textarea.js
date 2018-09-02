import { Sprite, Surface, Event } from 'enchantjs/enchant';
import { roundRect } from 'hackforplay/utils/canvas2d-utils';
import { stringToArray } from 'hackforplay/utils/string-utils';

const parser = new DOMParser();

function parse(xml, retry = false) {
	let document = parser.parseFromString(
		`<root>${xml}</root>`,
		'application/xml'
	);
	const error = document.querySelector('parsererror');
	if (error) {
		console.error(error.textContent);
		// パースに失敗したらタグを置換して再度試す
		if (!retry) return parse(xml.replace(/</g, '＜').replace(/>/g, '＞'), true);
		document = parser.parseFromString(
			`<root>パースに失敗しました</root>`,
			'application/xml'
		);
	}
	return document;
}

class TextArea extends Sprite {
	constructor(w, h) {
		super(w, h);

		this.source = '';
		this.document = null;

		this.image = new Surface(w, h);
		this.context = this.image.context;

		this.debug = false;

		this.autoResizeVertical = false;
		this.maxHeight = Infinity;

		this.background = 'rgba(0, 0, 0, .5)';

		this.borderColor = '#fff';
		this.borderWidth = 2;
		this.borderRadius = 12;

		this.margin = 4;
		this.padding = 10;

		this.keepWordBreak = true;
		this.overflowBreakWord = true;

		this.visible = false;

		this.defaultStyle = {
			color: '#fff',
			size: '20',
			family: 'PixelMplus, sans-serif',
			weight: 'bold',
			align: 'left',
			space: 0,
			ruby: null,
			rubyId: null
		};

		this.rubyStyle = Object.assign(Object.assign({}, this.defaultStyle), {
			size: 10
		});

		this.verticalNormalizedPosition = 0;

		this.values = [];

		this.on('prerender', () => {
			this.render();
		});
	}

	get w() {
		return this.width;
	}
	set w(value) {
		this.resize(value, this.h);
		this.width = value;
	}

	get h() {
		return this.height;
	}
	set h(value) {
		this.resize(this.w, value);
		this.height = value;
	}

	get drawAreaW() {
		return this.w - this.margin * 2 - this.padding * 2;
	}
	get drawAreaH() {
		return this.h - this.margin * 2 - this.padding * 2;
	}

	resize(w, h) {
		if (this.w === w && this.h === h) return;

		this._width = w;
		this._height = h;

		if (this.image) {
			this.image.width = w;
			this.image.height = h;
			this.image._element.width = w;
			this.image._element.height = h;
		}
		this.dispatchEvent(new Event(Event.RESIZE));

		this.updateValues();

		return this;
	}

	show(text) {
		this.visible = true;
	}

	hide() {
		this.visible = false;
	}

	clear(text) {
		this.values = [];
		this.source = '';
		this.docuemtn = null;
	}

	push(text) {
		const lineFeed = this.source.length ? '\n' : '';
		this.source += `${lineFeed}<group>${text}</group>`;
		this.updateDocument();
		this.updateValues();
	}

	getHeight() {
		if (!this.values.length) return 0;
		return Math.max(
			...this.values.map(value => {
				return value.y + value.h;
			})
		);
	}

	updateDocument() {
		let styleId = 0;

		function convertDocument(node) {
			const nodes = [...node.childNodes].map(convertDocument);

			const style = {
				id: ++styleId
			};

			const nodeName = node.nodeName;

			if (node.getAttribute) {
				style[nodeName] = node.getAttribute('value');
			}

			// <left>, <center>, <right>
			if (['left', 'center', 'right'].includes(nodeName)) {
				style.align = nodeName;
			}

			if (style.ruby) style.rubyId = style.id;

			return {
				nodeName: node.nodeName,
				value: nodeName === '#text' ? node.textContent : null,
				values: nodes,
				style
			};
		}

		this.document = convertDocument(parse(this.source));
	}

	updateValues() {
		const context = this.context;
		const source = this.document;

		if (!source) return;

		source.style = Object.assign({}, this.defaultStyle);

		const W = this.width - this.margin * 2 - this.padding * 2;

		function textObjectToStyle(textObject) {
			const style = Object.assign({}, textObject);
			return style;
		}

		let currentX = 0;
		let currentY = 0;

		const styles = [];

		let charIndex = -1;
		const chars = [];
		let currentLineIndex = 0;

		function createChars(source) {
			styles.push(source.style);

			const style = textObjectToStyle(
				styles.reduce((a, b) => Object.assign(a, b), {})
			);

			for (const value of source.values) {
				// 文字列なら描画する
				if (value.nodeName === '#text') {
					for (const char of stringToArray(value.value)) {
						++charIndex;

						// 改行
						if (char === '\n') {
							++currentLineIndex;
							continue;
						}

						// 文字の横幅を取得する
						context.font = `${style.weight} ${style.size}px ${style.family}`;
						const textWidth = context.measureText(char).width + style.space;

						chars.push({
							value: char,
							w: textWidth,
							charIndex,
							isAlphabet: !!char.match(/[a-zA-Z]/),
							lineIndex: currentLineIndex,
							style
						});
					}
					// オブジェクトなら描画オプションを適用して再帰
				} else {
					createChars(value);
				}
			}

			styles.pop();
		}
		createChars(source);

		const lines = [[]];

		let addLine = 0;
		let previousLineIndex = -1;
		let previousCharIsAlphabet = false;
		let previousCharStyleId = null;
		let previousCharRubyId = null;
		let previousCharAlign = null;

		for (let i = 0; i < chars.length; ++i) {
			const char = chars[i];

			// 新しい行なら X 座標を初期化する
			if (previousLineIndex !== char.lineIndex) {
				currentX = 0;
			}

			// 1 文字前と同じ形式の文字なら単語として認識する
			const isWord = char.isAlphabet === previousCharIsAlphabet;

			// 新規ルビ
			if (char.style.ruby && char.style.rubyId !== previousCharRubyId) {
				let index = i;
				let x = currentX;
				while (index < chars.length - 1) {
					const nextChar = chars[++index];
					if (char.style.rubyId !== nextChar.style.rubyId) break;
					x += nextChar.w;
				}
				// ルビを振る対象が画面内に収まらないので改行する
				if (x > W) {
					++addLine;
					currentX = 0;
				}
			}

			// 英単語の最初の 1 文字目なら、単語全体の長さを計測して改行するか判別する
			if (
				!char.style.ruby &&
				this.keepWordBreak &&
				char.charIndex > 0 &&
				char.isAlphabet &&
				!isWord
			) {
				let index = i;
				let x = currentX;

				while (index < chars.length - 1) {
					const nextChar = chars[++index];
					if (!nextChar.isAlphabet) break;
					x += nextChar.w;
				}
				// 単語が画面内に収まらないので改行する
				if (x > W) {
					++addLine;
					currentX = 0;
				}
			}

			// 文字列の並びが変化した場合は改行する
			if (previousCharAlign && char.style.align !== previousCharAlign) {
				++addLine;
				currentX = 0;
			}

			const right = currentX + char.w;

			// 文字が描画範囲外なら改行
			// ただし単語の途中かつ break-word フラグが立っていないなら改行しない
			if (
				!char.style.ruby &&
				right > W &&
				(!isWord || this.overflowBreakWord)
			) {
				++addLine;
				currentX = 0;
			}

			previousCharStyleId = char.style.id;
			previousCharRubyId = char.style.rubyId;
			previousLineIndex = char.lineIndex;
			previousCharIsAlphabet = char.isAlphabet;
			previousCharAlign = char.style.align;

			char.lineIndex += addLine;
			char.x = currentX;
			currentX += char.w;

			if (!lines[char.lineIndex]) lines[char.lineIndex] = [];
			lines[char.lineIndex].push(char);
		}

		const rubyStyle = Object.assign(
			Object.assign({}, this.defaultStyle),
			this.rubyStyle
		);

		// 描画範囲が狭いと空の行が含まれる場合がある
		const checkedLines = lines.filter(line => line && line.length);

		this.values = [];

		for (const line of checkedLines) {
			let maxFontSize = Math.max(...line.map(({ style }) => style.size));

			// ルビを振るならサイズを考慮する
			maxFontSize += line.some(char => char.style.ruby) ? rubyStyle.size : 0;

			let addX = 0;
			// 行の横幅
			const lineWidth = line.map(char => char.w).reduce((a, b) => a + b, 0);
			// 余白
			const space = this.drawAreaW - lineWidth;

			// 1 文字目の align を見る ( 1 行に複数の align が含まれることはない )
			switch (line[0].style.align) {
				// 左揃え
				case 'left':
					break;
				// 中央揃え
				case 'center':
					addX = space / 2;
					break;
				// 右揃え
				case 'right':
					addX = space;
					break;
			}

			for (const char of line) {
				char.x += addX;
				char.y = currentY;
				char.h = maxFontSize;
			}
			currentY += maxFontSize;
			this.values.push(...line);
		}

		// ルビを生成する
		const rubyGroup = this.values.reduce((object, value) => {
			if (!value.style.ruby) return object;
			if (!object[value.style.rubyId]) object[value.style.rubyId] = [];
			object[value.style.rubyId].push(value);
			return object;
		}, {});

		for (const rubyChars of Object.values(rubyGroup)) {
			const left = rubyChars[0].x;
			const right =
				rubyChars[rubyChars.length - 1].x + rubyChars[rubyChars.length - 1].w;

			const ruby = rubyChars[0].style.ruby;

			// 文字の横幅を取得する
			context.font = `${rubyStyle.weight} ${rubyStyle.size}px ${
				rubyStyle.family
			}`;

			const rubysWidth = stringToArray(ruby).map(char => {
				return context.measureText(char).width + rubyStyle.space;
			});

			const rubyWidth = rubysWidth.reduce((a, b) => a + b, 0);
			const unit = (right - left - rubyWidth) / (ruby.length - 1);
			let currentX = left;

			for (let i = 0; i < ruby.length; ++i) {
				// 文字の横幅を取得する
				const w = rubysWidth[i];
				this.values.push({
					value: ruby[i],
					h: rubyStyle.size,
					w: w,
					x: currentX,
					y: rubyChars[0].y,
					style: rubyStyle
				});
				currentX += w + unit;
			}
		}

		// 文字列に合わせて高さを自動調整する
		if (this.autoResizeVertical) {
			this.h = Math.min(
				this.getHeight() + this.margin * 2 + this.padding * 2,
				this.maxHeight
			);
		}
	}

	renderBackground(context) {}
	renderBorder(context) {}

	render() {
		const context = this.context;

		function applyRenderStyles(textObject) {
			context.fillStyle = textObject.color;
			context.font = `${textObject.weight} ${textObject.size}px ${
				textObject.family
			}`;
		}

		context.clearRect(0, 0, this.w, this.h);
		context.save();

		// 背景を描画する
		context.fillStyle = this.background;
		roundRect(
			context,
			this.margin,
			this.margin,
			this.w - this.margin * 2,
			this.h - this.margin * 2,
			this.borderRadius
		).fill();

		this.renderBackground(context);

		// 背景でクリップする
		context.clip();

		// 余白分移動する
		context.translate(this.margin + this.padding, this.margin + this.padding);

		if (this.debug) {
			context.lineWidth = 2;
			context.strokeStyle = '#f0f';
			context.strokeRect(0, 0, this.drawAreaW, this.drawAreaH);
		}

		// スクロール
		context.translate(
			0,
			-(this.getHeight() - this.drawAreaH) * this.verticalNormalizedPosition
		);

		context.textAlign = 'center';
		context.textBaseline = 'alphabetic';

		for (const value of this.values) {
			if (this.debug) {
				context.strokeStyle = 'red';
				if (value.style.ruby) context.strokeStyle = 'blue';
				context.lineWidth = 0.5;
				context.strokeRect(value.x, value.y, value.w, value.h);
			}

			// スタイルを適用して文字を描画する
			applyRenderStyles(value.style);
			context.fillText(value.value, value.x + value.w / 2, value.y + value.h);
		}

		// 枠を描画する
		context.restore();
		context.lineWidth = this.borderWidth;
		context.strokeStyle = this.borderColor;
		roundRect(
			context,
			this.margin,
			this.margin,
			this.w - this.margin * 2,
			this.h - this.margin * 2,
			this.borderRadius
		).stroke();

		this.renderBorder(context);
	}
}

export default TextArea;
