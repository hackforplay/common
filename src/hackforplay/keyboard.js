import { Event, Sprite, Surface } from 'enchantjs/enchant';
import 'enchantjs/ui.enchant';
import 'enchantjs/fix';
import 'hackforplay/rpg-kit-main';

import { roundRect } from 'hackforplay/utils/canvas2d-utils';
import { stringToArray } from 'hackforplay/utils/string-utils';
import { step, between, clamp } from 'hackforplay/utils/math-utils';

import ButtonRenderer from 'hackforplay/ui/button-renderer';

class KeyRenderer extends ButtonRenderer {
	constructor(text, props) {
		super(text, props);
		this.selected = false;
		this.disabled = false;
	}
}

/**
 * キーボード
 * @extends Sprite
 */
class Keyboard extends Sprite {
	/**
	 * コンストラクタ
	 * @constructor
	 */
	constructor() {
		const w = game.width;
		const h = game.height;

		super(w, h);

		this.w = w;
		this.h = h;

		this.image = new Surface(w, h);

		// デザイン時の解像度
		this.referenceResolutionX = 480;
		this.referenceResolutionY = 320;

		// 選択しているキー
		this.currentKey = null;

		// 特殊キー
		this.functionKeys = [];

		this.on('enterframe', this.update);
		this.on('render', this.render);

		this.scale(0);

		this.pages = [];
		this.pageIndex = 0;

		this.cursorX = 0;
		this.cursorY = 0;

		this.value = '';

		// キャンセルできるか
		this.cancelable = true;

		this.visible = false;

		this.fontWeight = 'bold';
		this.fontSize = 20;
		this.fontFamily = 'Roboto, Arial, sans-serif';

		this.borderColor = '#fff';
		this.borderWidth = 1.5;
		this.textColor = '#000';
		this.selectedBorderWidth = 3;
		this.selectedColor = '#faec71';

		this.textColor = '#000';

		this.keyColor = '#5ddbe5';
		this.functionKeyColor = '#a7bcdc';
		this.enterKeyColor = '#f55385';
		this.cancelKeyColor = '#f55385';

		this.valueKeyColor = '#986f1c';
		this.valueKeyTextColor = '#fff';

		this.easing = 'QUAD_EASEIN';
		this.fadeFrame = 10;

		// キーが無効な場合の透明度
		this.disabledAlpha = 0.5;

		// キャンセルボタン
		this.cancelKey = new KeyRenderer('キャンセル', {
			x: 0,
			y: 232,
			w: 124,
			h: 28
		});
		this.cancelKey.on('click', () => {
			this.dispatchEvent(new Event('cancel'));
			this.select(this.cancelKey);
		});

		// けっていボタン
		this.enterKey = new KeyRenderer('けってい', {
			x: 296,
			y: 232,
			w: 124,
			h: 28
		});
		this.enterKey.on('click', () => {
			this.dispatchEvent(new Event('enter'));
			this.select(this.enterKey);
		});

		this.maxLength = 10;
	}

	/**
	 * キーを取得する
	 * @param {number} x                X 位置
	 * @param {number} y                Y 位置
	 * @param {number} [pageIndex=null] ページ番号
	 * @return {KeyRenderer} キー
	 */
	at(x, y, pageIndex = null) {
		if (pageIndex === null) pageIndex = this.pageIndex;

		// 通常キー
		if (between(x, 0, 9) && between(y, 0, 6)) {
			return this.pages[pageIndex].keys[y][x];
		}

		// キャンセル、決定キー
		if (y === 7) {
			return [this.cancelKey, this.enterKey][x];
		}

		// 特殊キー
		if (x === 10) {
			return this.functionKeys[y];
		}
	}

	/**
	 * カーソルを移動する
	 * @param {number} x X 移動回数
	 * @param {number} y Y 移動回数
	 */
	move(x, y) {
		let newX = this.cursorX + x;
		let newY = this.cursorY + y;

		// 範囲外に移動しようとしたらキャンセル
		if (!between(newX, 0, 10) || !between(newY, 0, 7)) {
			return;
		}
		if (this.cursorY === 7 && newX >= 2) return;

		// キャンセル、決定ボタンに移動したときは特殊処理
		if (y > 0 && newY === 7) {
			newX = Math.floor(newX >= 5);
		}

		// キャンセル、決定ボタンから通常キーに移動した場合
		if (y < 0 && newY === 6) {
			newX *= 10;
		}

		const newKey = this.at(newX, newY);

		// 移動先のキーがない or 無効なキーなら更に移動する
		if (!newKey || newKey.text.match(/^\s/)) {
			return this.move(x + Math.sign(x), y + Math.sign(y));
		}

		this.cursorX = newX;
		this.cursorY = newY;
		this.select(newKey);
	}

	/**
	 * キーを選択する
	 * @param {KeyRenderer} key 選択するキー
	 */
	select(key) {
		if (this.currentKey) this.currentKey.selected = false;
		this.currentKey = key;
		this.currentKey.selected = true;
	}

	/**
	 * アップデート
	 */
	update() {
		if (!this.visible) return;

		if (Key.up.clicked) this.move(0, -1);
		if (Key.down.clicked) this.move(0, 1);
		if (Key.left.clicked) this.move(-1, 0);
		if (Key.right.clicked) this.move(1, 0);

		if (Key.space.clicked || Key.enter.clicked) {
			this.currentKey.dispatchEvent(new Event('click'));
		}

		// 最大文字数を超えないように調整
		this.value = stringToArray(this.value)
			.slice(0, this.maxLength)
			.join('');
	}

	/**
	 * キーの描画スタイルを取得する
	 * @private
	 * @param {KeyRenderer} key        対象キー
	 * @param {string} backgroundColor 背景色
	 * @param {string} textColor       文字色
	 * @return {object} 描画スタイル
	 */
	_getKeyStyle(key, backgroundColor, textColor, useSelectedColor = true) {
		return {
			backgroundColor:
				useSelectedColor && key.selected ? this.selectedColor : backgroundColor,
			borderColor: this.borderColor,
			borderWidth: key.selected ? this.selectedBorderWidth : this.borderWidth,
			color: textColor || this.textColor,
			alpha: key.disabled ? this.disabledAlpha : 1,
			font: `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`
		};
	}

	/**
	 * 描画
	 */
	render() {
		if (!this.visible) return;

		const context = this.image.context;

		// context を初期化
		context.setTransform(1, 0, 0, 1, 0, 0);
		context.clearRect(0, 0, this.w, this.h);
		context.translate(30, 0);

		const n = this.maxLength;

		// 入力している値の表示位置を計算する
		const valueKeysWidth = n * 28 + (n - 1) * 4;
		const valueKeyLeft = (420 - valueKeysWidth) / 2;

		// 入力している値を描画する
		for (const i of step(n)) {
			const key = new KeyRenderer(stringToArray(this.value)[i] || '', {
				x: valueKeyLeft + i * 32,
				y: 10,
				w: 28,
				h: 28
			});

			key.interactable = false;
			key.selected = stringToArray(this.value).length === i;

			key.render(
				context,
				this._getKeyStyle(
					key,
					this.valueKeyColor,
					this.valueKeyTextColor,
					false
				)
			);
		}

		context.translate(0, 50);

		// 特殊キーを描画する
		this.functionKeys.forEach(key => {
			key.render(context, this._getKeyStyle(key, this.functionKeyColor));
		});

		this.cancelKey.disabled = !this.cancelable;
		this.cancelKey.interactable = this.cancelable;

		this.enterKey.render(
			context,
			this._getKeyStyle(this.enterKey, this.enterKeyColor)
		);
		this.cancelKey.render(
			context,
			this._getKeyStyle(this.cancelKey, this.cancelKeyColor)
		);

		// 開いているページ
		const page = this.pages[this.pageIndex];
		if (!page) return;

		// 通常キーを描画
		for (const x of step(10)) {
			for (const y of step(7)) {
				const key = page.keys[y][x];
				key.render(context, this._getKeyStyle(key, this.keyColor));
			}
		}
	}

	/**
	 * キーを登録する
	 * @param {array} array キーリスト
	 */
	registerKeys(array, pageIndex) {
		const keys = [];
		let index = 0;

		step(7).forEach(y => {
			const rows = [];

			step(2).forEach(side => {
				const values = stringToArray(array[index++]).slice(0, 5);

				rows.push(
					...values.map((value, x) => {
						x += side * 5;

						const button = new KeyRenderer(value, {
							x: x * 32 + (x >= 5 ? 8 : 0),
							y: y * 32,
							w: 28,
							h: 28
						});

						// 空文字なら押せないようにする
						if (value.match(/\s/)) {
							button.interactable = false;
							button.disabled = true;
						}

						// キーが押されたら
						button.on('click', () => {
							this.value += value;

							this.cursorX = x;
							this.cursorY = y;
							this.select(button);
						});

						return button;
					})
				);
			});
			keys.push(rows);
		});
		this.pages[pageIndex] = { keys };
	}

	/**
	 * 特殊キーを登録する
	 * @param {string} name  名前
	 * @param {number} index 表示順
	 */
	registerFunctionKey(name, index) {
		const key = new KeyRenderer(name, {
			x: 336,
			y: index * 32,
			w: 84,
			h: 28
		});

		key.on('click', () => {
			this.cursorX = 10;
			this.cursorY = index;
			this.select(key);
		});

		this.functionKeys[index] = key;

		return key;
	}

	/**
	 * キーボードの状態をリセットする
	 */
	reset() {
		this.pageIndex = 0;
		this.cursorX = 0;
		this.cursorY = 0;
		this.value = '';
		this.select(this.pages[0].keys[0][0]);
	}

	/**
	 * キーボード入力を取得する
	 * @param {number} [maxLength=10]    最大文字数
	 * @param {string} [defaultValue=''] 初期値
	 * @param {*} [cancelValue=null]     キャンセルしたときに返す値
	 * @return {string} 入力された文字列
	 */
	async get(maxLength = 10, defaultValue = '', cancelValue = null) {
		this.maxLength = maxLength;

		this.reset();
		this.value = defaultValue;
		this.scale(0);

		const overlay = Hack.overlay('rgba(0, 0, 0, .5)');
		overlay.opacity = 0;
		this.visible = true;
		overlay.tl.fadeIn(this.fadeFrame, this.easing);
		await this.tl.scaleTo(1, 1, this.fadeFrame, this.easing).async();

		// 決定かキャンセルが押されるまで待つ
		const value = await Promise.race([
			new Promise(resolve => {
				this.once('enter', function() {
					resolve(this.value);
				});
			}),
			new Promise(resolve => {
				this.once('cancel', function() {
					resolve(cancelValue);
				});
			})
		]);

		overlay.tl.fadeOut(this.fadeFrame, this.easing);
		await this.tl.scaleTo(0, 0, this.fadeFrame, this.easing).async();
		overlay.remove();
		this.visible = false;

		return value;
	}
}

export default Keyboard;
