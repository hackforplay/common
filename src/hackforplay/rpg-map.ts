import { Container, DisplayObject } from 'pixi.js';
import application from '../application';
import { default as enchant } from '../enchantjs/enchant';
import { default as game } from './game';
import { getHack } from './get-hack';
import Vector2, { IVector2 } from './math/vector2';
import { default as dictionary } from './object/dictionary';
import RPGObject from './object/object';
import PixiMap from './pixi-map';
import './rpg-kit-color';
import { default as Line } from './shapes/line';
import { errorRemoved } from './stdlog';

const Hack = getHack();

/*
 * RPGMap
 * レイヤー化された切り替え可能なマップ
 */
export default class RPGMap extends enchant.EventTarget {
  public static Layer = {
    Over: 4,
    Player: 3,
    Middle: 2,
    Shadow: 1,
    Under: 0
  };

  public static ref: WeakMap<Container, RPGMap> = new WeakMap<
    Container,
    RPGMap
  >();

  public bmap: PixiMap;
  public fmap: PixiMap;
  public scene: Container;
  public isLoaded = false;
  public layerChangeFlag = false;
  public reflectionLines: Line[] = [];
  public imagePath = '';

  private _tileNumX = 15;
  private _tileNumY = 10;
  private _name = '';
  private _type = '';
  public _surface: any;

  public constructor(
    tileWidth = 32,
    tileHeight = 32,
    tileNumX = 15,
    tileNumY = 10
  ) {
    super();

    this.bmap = new PixiMap(tileWidth, tileHeight); // 他のオブジェクトより奥に表示されるマップ
    this.fmap = new PixiMap(tileWidth, tileHeight); // 他のオブジェクトより手前に表示されるマップ

    this._tileNumX = tileNumX;
    this._tileNumY = tileNumY;

    this.scene = new Container();

    RPGMap.ref.set(this.scene, this);

    this.scene.on('enterframe', () => this.autoSorting());
    this.scene.on('childAdded', (child: DisplayObject) => {
      if (child instanceof RPGObject) {
        this.layerChangeFlag = true;
      }
    });

    this.bmap.name = 'BMap';
    this.fmap.name = 'FMap';
    this.scene.name = 'MapScene';

    const w = tileWidth * tileNumX;
    const h = tileHeight * tileNumY;

    this._surface = new enchant.Surface(w, h);

    // 反射ライン
    this.reflectionLines = [
      new Line(new Vector2(w, 0), new Vector2(0, 0)),
      new Line(new Vector2(w, h), new Vector2(w, 0)),
      new Line(new Vector2(0, 0), new Vector2(0, h)),
      new Line(new Vector2(0, h), new Vector2(w, h))
    ];
  }

  public load() {
    if (!this.image && this.imagePath) {
      this.image = game.assets[this.imagePath];
      if (!this.image) {
        throw new Error(
          `RPGMap.load: game.assets['${this.imagePath}'] is not found`
        );
      }
    }

    application.stage.addChild(this.bmap);
    application.stage.addChild(this.scene);
    application.stage.addChild(this.fmap);

    Hack.map = this;
    Hack.defaultParentNode = this.scene;
    if (!this.isLoaded) {
      this.isLoaded = true;
      (this as any).dispatchEvent(new enchant.Event('load'));
    }
    if (Hack.player) this.scene.addChild(Hack.player);
    Hack.statusLabel = this.name;
  }

  public hitTest(x: number, y: number): boolean {
    return this.bmap.hitTest(x, y);
  }

  public autoSorting() {
    if (this.layerChangeFlag) {
      this.scene.sortChildren();
      this.layerChangeFlag = false;
    }
  }

  public get name() {
    if (!this._name) {
      const result = Object.keys(Hack.maps).filter(
        key => Hack.maps[key] === this
      );
      this._name = result.length > 0 ? result[0] : '';
    }
    return this._name;
  }
  public get type() {
    if (!this._type) {
      // 初期値は（0,0）のタイル
      Object.keys(dictionary)
        .filter(key => (dictionary as any)[key] === this.bmap.getData(0, 0))
        .forEach(key => (this._type = key));
    }
    return this._type;
  }
  public set type(value) {
    if (value !== this._type && dictionary.hasOwnProperty(value)) {
      this._type = value;
      // typeによってbmapを初期化
      const frame = (dictionary as any)[value];
      this.bmap.loadData(
        new Array(this.height)
          .fill(0)
          .map(() => new Array(this.width).fill(frame))
      );

      // ついでにcmapも初期化
      this.cmap =
        this.cmap ||
        new Array(this.height).fill(0).map(() => new Array(this.width).fill(0));
    }
  }
  public get width(): number {
    return this.bmap.width;
  }
  public get height(): number {
    return this.bmap.height;
  }

  private _walkablePositions: IVector2[] = []; // cmap から 0 のマスだけを配列化したもの
  public get walkablePositions(): IVector2[] {
    return this._walkablePositions;
  }
  // Collisino Map. (this.bmap.collisionData)
  public get cmap(): (0 | 1)[][] | null {
    return this.bmap.collisionData;
  }
  public set cmap(value) {
    if (!value) return;
    this.bmap.collisionData = value;
    // cmap は 0 のとき歩ける
    this._walkablePositions = [];
    value.forEach((vertical, y) =>
      vertical.forEach(
        (flag, x) => flag === 0 && this._walkablePositions.push({ x, y })
      )
    );
  }

  // bmap Image (enchant.Surface)
  public get image() {
    return this.bmap.image;
  }
  public set image(value) {
    this.bmap.image = this.fmap.image = value;
  }
  public get tileWidth(): number {
    return this.bmap.tileWidth;
  }
  public get tileHeight(): number {
    return this.bmap.tileHeight;
  }
  public get tileNumX() {
    return this._tileNumX;
  }
  public get tileNumY() {
    return this._tileNumY;
  }

  public set background(value: any) {
    errorRemoved('background', this);
  }

  public set foreground(value: any) {
    errorRemoved('foreground', this);
  }
}
