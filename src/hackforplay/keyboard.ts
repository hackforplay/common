import { Quad, TweenLite } from 'gsap';
import app from '../application';
import '../enchantjs/fix';
import Key from './key';
import './rpg-kit-main';
import SurfaceSprite from './surface-sprite';
import { overlay } from './temp-hack';
import ButtonRenderer from './ui/button-renderer';
import { between, step } from './utils/math-utils';
import { stringToArray } from './utils/string-utils';

class KeyRenderer extends ButtonRenderer {
  public selected: boolean;
  public disabled: boolean;
  constructor(text: string, props: any) {
    super(text, props);
    this.selected = false;
    this.disabled = false;
  }
}

type Page = {
  keys: KeyRenderer[][];
};

/**
 * キーボード
 */
class Keyboard extends SurfaceSprite {
  public referenceResolutionX: number;
  public referenceResolutionY: number;
  public currentKey: KeyRenderer | null;
  public functionKeys: KeyRenderer[];
  public pages: Page[];
  public pageIndex: number;
  public cursorX: number;
  public cursorY: number;
  public value: string;
  public cancelable: boolean;
  public fontWeight: string;
  public fontSize: number;
  public fontFamily: string;
  public borderColor: string;
  public borderWidth: number;
  public textColor: string;
  public selectedBorderWidth: number;
  public selectedColor: string;
  public keyColor: string;
  public functionKeyColor: string;
  public enterKeyColor: string;
  public cancelKeyColor: string;
  public valueKeyColor: string;
  public valueKeyTextColor: string;
  public easing: gsap.EaseFunction;
  public fadeFrame: number;
  public disabledAlpha: number;
  public cancelKey: KeyRenderer;
  public enterKey: KeyRenderer;
  public maxLength: number;

  /**
   * コンストラクタ
   */
  public constructor() {
    const w = app.view.width;
    const h = app.view.height;

    super(w, h);

    // デザイン時の解像度
    this.referenceResolutionX = 480;
    this.referenceResolutionY = 320;

    // 選択しているキー
    this.currentKey = null;

    // 特殊キー
    this.functionKeys = [];

    this.on('enterframe', this.update);

    this.anchor.set(0.5);
    this.scale.set(0);
    this.position.set(w / 2, h / 2);

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

    this.easing = Quad.easeIn;
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
      this.emit('cancel');
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
      this.emit('enter');
      this.select(this.enterKey);
    });

    this.maxLength = 10;
  }

  /**
   * キーを取得する
   */
  private at(x: number, y: number, pageIndex: number | null = null) {
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
   */
  private move(x: number, y: number): void {
    let newX = this.cursorX + x;
    const newY = this.cursorY + y;

    // 範囲外に移動しようとしたらキャンセル
    if (!between(newX, 0, 10) || !between(newY, 0, 7)) {
      return;
    }
    if (this.cursorY === 7 && newX >= 2) return;

    // キャンセル、決定ボタンに移動したときは特殊処理
    if (y > 0 && newY === 7) {
      newX = Math.floor(newX >= 5 ? 1 : 0);
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
   */
  private select(key: KeyRenderer) {
    if (this.currentKey) this.currentKey.selected = false;
    this.currentKey = key;
    this.currentKey.selected = true;
  }

  /**
   * アップデート
   */
  private update() {
    if (!this.visible) return;

    if (Key.up.clicked) this.move(0, -1);
    if (Key.down.clicked) this.move(0, 1);
    if (Key.left.clicked) this.move(-1, 0);
    if (Key.right.clicked) this.move(1, 0);

    if (Key.space.clicked || Key.enter.clicked) {
      this.currentKey?.emit('click');
    }

    // 最大文字数を超えないように調整
    this.value = stringToArray(this.value).slice(0, this.maxLength).join('');

    this.draw();
  }

  /**
   * キーの描画スタイルを取得する
   */
  private getKeyStyle(
    key: KeyRenderer,
    backgroundColor: string,
    textColor?: string,
    useSelectedColor = true
  ) {
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
  private draw() {
    if (!this.visible) return;

    const { context } = this;

    // context を初期化
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, this.width, this.height);
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
        this.getKeyStyle(key, this.valueKeyColor, this.valueKeyTextColor, false)
      );
    }

    context.translate(0, 50);

    // 特殊キーを描画する
    this.functionKeys.forEach(key => {
      key.render(context, this.getKeyStyle(key, this.functionKeyColor));
    });

    this.cancelKey.disabled = !this.cancelable;
    this.cancelKey.interactable = this.cancelable;

    this.enterKey.render(
      context,
      this.getKeyStyle(this.enterKey, this.enterKeyColor)
    );
    this.cancelKey.render(
      context,
      this.getKeyStyle(this.cancelKey, this.cancelKeyColor)
    );

    // 開いているページ
    const page = this.pages[this.pageIndex];
    if (!page) return;

    // 通常キーを描画
    for (const x of step(10)) {
      for (const y of step(7)) {
        const key = page.keys[y][x];
        key.render(context, this.getKeyStyle(key, this.keyColor));
      }
    }

    this.updateTexture();
  }

  /**
   * キーを登録する
   */
  public registerKeys(array: string[], pageIndex: number) {
    const keys: KeyRenderer[][] = [];
    let index = 0;

    step(7).forEach(y => {
      const rows: KeyRenderer[] = [];

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
   */
  public registerFunctionKey(name: string, index: number) {
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
  public reset() {
    this.pageIndex = 0;
    this.cursorX = 0;
    this.cursorY = 0;
    this.value = '';
    this.select(this.pages[0].keys[0][0]);
  }

  /**
   * キーボード入力を取得する
   */
  public async get(maxLength = 10, defaultValue = '', cancelValue = null) {
    this.maxLength = maxLength;

    this.reset();
    this.value = defaultValue;
    this.scale.set(0);

    const overlaySprite = overlay('rgba(0, 0, 0, .5)');
    overlaySprite.alpha = 0;
    this.visible = true;

    await Promise.all([
      TweenLite.to(overlaySprite, this.fadeFrame / 30, {
        alpha: 1,
        ease: this.easing
      }),
      TweenLite.to(this.scale, this.fadeFrame / 30, {
        x: 1,
        y: 1,
        ease: this.easing
      })
    ]);

    // 決定かキャンセルが押されるまで待つ
    const value = await Promise.race([
      new Promise(resolve => {
        this.once('enter', () => {
          resolve(this.value);
        });
      }),
      new Promise(resolve => {
        this.once('cancel', () => {
          resolve(cancelValue);
        });
      })
    ]);

    await Promise.all([
      TweenLite.to(overlaySprite, this.fadeFrame / 30, {
        alpha: 0,
        ease: this.easing
      }),
      TweenLite.to(this.scale, this.fadeFrame / 30, {
        x: 0,
        y: 0,
        ease: this.easing
      })
    ]);

    overlaySprite.destroy();
    this.visible = false;

    return value;
  }
}

export default Keyboard;
