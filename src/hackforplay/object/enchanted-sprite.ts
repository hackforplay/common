import * as PIXI from 'pixi.js';
import { Sprite, Texture } from 'pixi.js';

export default class EnchantedSprite extends Sprite {
  private __frameSequence: any;
  private _originalFrameSequence: any;
  private _frame = 0;

  public age = 0;

  public constructor() {
    super(Texture.EMPTY);
    this._frameSequence = 0;
  }

  public set texture(texture: PIXI.Texture) {
    super.texture = texture;

    this._computeFramePosition();
    texture.baseTexture.on('loaded', () => {
      this._computeFramePosition();
    });
  }

  public emit(event: string | symbol, ...args: any[]): boolean {
    const onEvent = 'on' + event.toString();
    if (onEvent in this && typeof (this as any)[onEvent] === 'function') {
      (this as any)[onEvent](...args);
    }

    return super.emit(event, ...args);
  }

  public get childNodes() {
    return this.children;
  }

  protected get _opacity() {
    return this.alpha;
  }
  protected set _opacity(value: number) {
    this.alpha = value;
  }
  public get frame() {
    return this._frame;
  }

  public set frame(frame: any) {
    if (
      (this._frameSequence == null && this._frame === frame) ||
      this._deepCompareToPreviousFrame(frame)
    ) {
      return;
    }
    if (frame instanceof Array) {
      this._frameSequence = frame;
    } else {
      this._frameSequence = null;
      this._frame = frame;
      this._computeFramePosition();
    }
  }

  public get _frameSequence() {
    return this.__frameSequence;
  }

  public set _frameSequence(frameSequence) {
    if (frameSequence && !this.__frameSequence) {
      this.on('enterframe', this._rotateFrameSequence);
    } else if (!frameSequence && this.__frameSequence) {
      this.off('enterframe', this._rotateFrameSequence);
    }
    if (frameSequence) {
      this.__frameSequence = frameSequence.slice();
      this._originalFrameSequence = frameSequence.slice();
      this._rotateFrameSequence();
    } else {
      this.__frameSequence = null;
      this._originalFrameSequence = null;
    }
  }

  private _rotateFrameSequence() {
    var frameSequence = this._frameSequence;
    if (frameSequence && frameSequence.length !== 0) {
      var nextFrame = frameSequence.shift();
      if (nextFrame === null) {
        this._frameSequence = null;
        this.emit('animationend');
      } else {
        this._frame = nextFrame;
        this._computeFramePosition();
        frameSequence.push(nextFrame);
      }
    }
  }

  private _deepCompareToPreviousFrame(frameArray: any) {
    if (frameArray === this._originalFrameSequence) {
      return true;
    }
    if (frameArray == null || this._originalFrameSequence == null) {
      return false;
    }
    if (!(frameArray instanceof Array)) {
      return false;
    }
    if (frameArray.length !== this._originalFrameSequence.length) {
      return false;
    }
    for (var i = 0; i < frameArray.length; ++i) {
      if (frameArray[i] !== this._originalFrameSequence[i]) {
        return false;
      }
    }
    return true;
  }

  public moveTo(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public _computeFramePosition() {
    const image = super.texture.baseTexture;

    if (!image?.valid) return;

    const row = (image.width / this.width) | 0;
    const _frameLeft = (this._frame % row | 0) * this.width;
    const _frameTop = (((this._frame / row) | 0) * this.height) % image.height;

    const w = this.width;
    const h = this.height;

    try {
      const frame = new PIXI.Rectangle(_frameLeft, _frameTop, w, h);

      super.texture.frame = frame;
      super.texture.updateUvs();

      this.width = w;
      this.height = h;
    } catch (e) {
      console.error('frame の生成に失敗しました', image, e);
    }
  }

  public get _listeners() {
    return (this as any)._events;
  }

  public get parentNode() {
    return this.parent;
  }

  // TODO: 実装する
  public intersect(other: any) {
    return [];
  }
}
