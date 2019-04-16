import { default as enchant } from '../enchantjs/enchant';
import '../enchantjs/ui.enchant';
import '../enchantjs/fix';
import './rpg-kit-main';
import { default as Hack } from './hack';
import { default as game } from './game';
import RPGObject from './object/object';
import { clamp } from './utils/math-utils';
import * as N from './object/numbers';
import Vector2 from './math/vector2';

interface IRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

class Camera extends enchant.Sprite {
  public static collection: Camera[] = [];
  public static main: Camera | null = null;

  public x: number;
  public y: number;

  public background = '#000';

  public enabled = true;
  public target: RPGObject | null = null;
  public center: Vector2 | null = null;
  public clip = true;
  public clipScaleFunction = Math.min;
  public clamp = true;
  public scale = 1;

  public border = false;
  public borderColor = '#000';
  public borderLineWidth = 1;

  // カメラに表示されるHPなどのラベル
  private _numberLabels: any[] = [];
  private static _numberLabels: (keyof N.INumbers)[] = ['hp', 'money', 'time'];
  public static get numberLabels() {
    return Camera._numberLabels;
  }
  public static set numberLabels(value) {
    Camera._numberLabels = value;
    for (const camera of Camera.collection) {
      camera.refreshNumberLabels();
    }
  }

  public constructor(
    x = 0,
    y = 0,
    w: number = game.width,
    h: number = game.height
  ) {
    super(w, h);

    this.image = new enchant.Surface(w, h);

    this.x = x;
    this.y = y;

    this.refreshNumberLabels();

    Hack.cameraGroup.addChild(this);
    Camera.collection.push(this);
  }

  public get w() {
    return this.width;
  }
  public set w(value: number) {
    this.width = value;
  }

  public get h() {
    return this.height;
  }
  public set h(value: number) {
    this.height = value;
  }

  public resize(w: number, h: number) {
    w = Math.ceil(w);
    h = Math.ceil(h);

    if (!w || !h) return;
    if (this.w === w && this.h === h) return;

    this._width = w;
    this._height = h;

    if (this.image) {
      this.image.width = w;
      this.image.height = h;
      this.image._element.width = w;
      this.image._element.height = h;
    }

    this.dispatchEvent(new enchant.Event(enchant.Event.RESIZE));

    return this;
  }

  public getCenter() {
    // center 固定
    if (this.center) return this.center;

    // target
    if (this.target && this.target instanceof RPGObject) {
      return this.target.center;
    }

    // プレイヤー
    if (Hack.player && Hack.player instanceof RPGObject) {
      return Hack.player.center;
    }

    // マップの中心
    if (Hack.map) {
      const map = Hack.map;

      return {
        x: map.width / 2,
        y: map.height / 2
      };
    }

    // console.error('Camera#getCenter');
  }

  public getScale() {
    // クリップしない
    if (!this.clipScaleFunction) return this.scale;

    const x = Hack.map.width / this.w;
    const y = Hack.map.height / this.h;

    const clip = this.clipScaleFunction(x, y);
    if (this.scale > clip) return clip;

    return this.scale;
  }

  // 描画範囲を取得する
  public getRenderRect() {
    let center = this.getCenter();

    let x = center.x;
    let y = center.y;

    let scale = this.getScale();

    let w = this.width * scale;
    let h = this.height * scale;

    x -= w / 2;
    y -= h / 2;

    let rect = {
      x: x,
      y: y,
      width: w,
      height: h
    };

    if (this.clamp) rect = this.clampRect(rect);

    return rect;
  }

  // 描画範囲を画面に収める
  public clampRect(rect: IRect) {
    const { w, h } = this.getVisionSize();

    let over = false;

    let dx = false;
    let dy = false;

    if (w < rect.width) {
      dx = true;
      rect.x = (rect.width - w) / 2;
    }
    if (h < rect.height) {
      dy = true;
      rect.y = (rect.height - h) / 2;
    }

    let b = false;

    if (w > Hack.map.width) {
      dx = true;
      rect.x = -(w - Hack.map.width) / 2;
    }

    if (h > Hack.map.height) {
      dy = true;
      rect.y = -(h - Hack.map.height) / 2;
    }

    if (over || b) {
      return rect;
    }

    if (!dx) rect.x = clamp(rect.x, 0.0, Hack.map.width - w);
    if (!dy) rect.y = clamp(rect.y, 0.0, Hack.map.height - h);

    return rect;
  }

  private _rectScale(rect: IRect, scale: number) {
    rect.x *= scale;
    rect.y *= scale;
    rect.width *= scale;
    rect.height *= scale;
    return rect;
  }

  // スクリーン座標をゲーム内座標に変換する
  public projection(screenX: number, screenY: number) {
    const renderRect = this.getRenderRect();
    return [
      renderRect.x + (screenX - this.x) * (renderRect.width / this.width),
      renderRect.y + (screenY - this.y) * (renderRect.height / this.height)
    ];
  }

  // カメラ上の座標を計算する
  public getNodeRect(node: RPGObject) {
    let renderRect = this.getRenderRect();
    let scale = this.getScale();

    let x = node.x - renderRect.x;
    let y = node.y - renderRect.y;

    let rect = {
      x: x,
      y: y,
      width: node.width,
      height: node.height
    };

    return this._rectScale(rect, 1.0 / scale);
  }

  public getVisionSize() {
    const scale = this.getScale();
    return {
      w: this.w * scale,
      h: this.h * scale
    };
  }

  public zoom(value: number) {
    this.scale /= value;
  }

  public borderStyle(lineWidth: number, color: string) {
    this.border = true;
    this.borderLineWidth = lineWidth;
    this.borderColor = color;
  }

  public drawBorder() {
    if (!this.border) return;
    const context = this.image.context;
    context.strokeStyle = this.borderColor;
    context.lineWidth = this.borderLineWidth;
    context.strokeRect(0, 0, this.w, this.h);
  }

  public render() {
    const context = this.image.context;

    let center = this.getCenter();

    if (!center) return;

    let rect = this.getRenderRect();
    let r = rect;

    if (this.background) {
      context.fillStyle = this.background;
      context.fillRect(0, 0, this.w, this.h);
    }

    this.image.context.drawImage(
      Hack.map._surface._element,

      r.x,
      r.y,
      r.width,
      r.height,
      0,
      0,
      this.w,
      this.h
    );

    this.drawBorder();
  }

  public remove() {
    super.remove();
    Camera.collection = Camera.collection.filter(camera => {
      return camera !== this;
    });
  }

  private _computeFramePosition() {
    // サイズが変更されたときに呼ばれる
    super._computeFramePosition();
    this.resize(this.w, this.h);
  }

  private createNumberLabel(key: keyof N.INumbers) {
    const {
      ui: { ScoreLabel }
    } = enchant as any;
    const label = new ScoreLabel(this.w, this.h); // 見えない位置で初期化
    label.label = key.toUpperCase() + ':';
    label._key = key;
    label.onenterframe = () => {
      if (!this.target) return;
      label.score = this.target[key];
    };
    Hack.menuGroup.addChild(label);
    return label;
  }

  private refreshNumberLabels() {
    let y = 10;
    const labelsWillRemove = [...this._numberLabels];
    for (const key of Camera.numberLabels) {
      let label = labelsWillRemove.find(label => label._key === key);
      if (!label) {
        // 足りないラベルを追加
        label = this.createNumberLabel(key);
        this._numberLabels.push(label);
      } else {
        // 削除待機配列から削除
        labelsWillRemove.splice(labelsWillRemove.indexOf(label), 1);
      }
      // ラベルを上から順に並べる
      label.moveTo(Hack.menuGroup.x + 10, Hack.menuGroup.y + y);
      y += 20;
    }
    for (const label of labelsWillRemove) {
      const index = this._numberLabels.indexOf(label);
      if (index > -1) {
        this._numberLabels.splice(index, 1);
      }
      label.remove();
    }
  }
}

// カメラを並べる
Camera.arrange = function(
  x: number,
  y: number,
  border: boolean = true,
  filter?: (camera: Camera) => boolean
) {
  let for2d = function(
    x: number,
    y: number,
    callback: (a: number, b: number) => void
  ) {
    for (let a = 0; a < x; ++a) {
      for (let b = 0; b < y; ++b) {
        callback(a, b);
      }
    }
  };

  // 枠を表示する
  if (border) {
    Camera.collection.forEach(function(camera) {
      camera.border = true;
    });
  }

  // 並べるカメラだけ取得
  let index = 0;
  let cameras = Camera.collection.filter(
    filter ||
      function(camera) {
        return camera.enabled;
      }
  );

  // 再配置
  for2d(y, x, function(y2, x2) {
    if (index >= cameras.length) return;
    let camera = cameras[index++];

    camera.moveTo((game.width / x) * x2, (game.height / y) * y2);
    camera.resize(game.width / x, game.height / y);
  });
};

Camera.layout = Camera.arrange;

export default Camera;
