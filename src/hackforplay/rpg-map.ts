import { default as enchant } from '../enchantjs/enchant';
import { default as Hack } from './hack';
import './rpg-kit-color';
import Vector2 from './math/vector2';
import { default as Line } from './shapes/line';
import { default as dictionary } from './object/dictionary';
import { default as game } from './game';
import RPGObject from './object/object';

/*
 * RPGMap
 * レイヤー化された切り替え可能なマップ
 */
export default class RPGMap extends enchant.EventTarget {
  bmap: any;
  fmap: any;
  scene: any;
  isLoaded = false;
  layerChangeFlag = false;
  reflectionLines: Line[] = [];
  imagePath = '';

  private _width = 15;
  private _height = 10;
  private _name = '';
  private _type = '';
  _surface: any;

  constructor(tileWidth = 32, tileHeight = 32, mapWidth = 15, mapHeight = 10) {
    super();

    this.bmap = new enchant.Map(tileWidth, tileHeight); // 他のオブジェクトより奥に表示されるマップ
    this.fmap = new enchant.Map(tileWidth, tileHeight); // 他のオブジェクトより手前に表示されるマップ

    this._width = mapWidth;
    this._height = mapHeight;

    this.scene = new enchant.Group(); // マップ上に存在するオブジェクトをまとめるグループ
    (<any>this.scene).ref = this;
    this.scene.on('enterframe', this.autoSorting);
    this.scene.on('childadded', function(this: any) {
      const { ref } = <any>this;
      ref && (ref.layerChangeFlag = true);
    });

    this.bmap.name = 'BMap';
    this.fmap.name = 'FMap';
    this.scene.name = 'MapScene';

    const w = tileWidth * mapWidth;
    const h = tileHeight * mapHeight;

    this._surface = new enchant.Surface(w, h);

    // 反射ライン
    this.reflectionLines = [
      new Line(new Vector2(w, 0), new Vector2(0, 0)),
      new Line(new Vector2(w, h), new Vector2(w, 0)),
      new Line(new Vector2(0, 0), new Vector2(0, h)),
      new Line(new Vector2(0, h), new Vector2(w, h))
    ];
  }

  load() {
    if (!this.image && this.imagePath) {
      this.image = game.assets[this.imagePath];
      if (!this.image) {
        throw new Error(
          `RPGMap.load: game.assets['${this.imagePath}'] is not found`
        );
      }
    }
    Hack.world.addChild(this.bmap);
    Hack.world.addChild(this.scene);
    Hack.world.addChild(this.fmap);
    Hack.map = this;
    Hack.defaultParentNode = this.scene;
    if (!this.isLoaded) {
      this.isLoaded = true;
      (<any>this).dispatchEvent(new enchant.Event('load'));
    }
    if (Hack.player) this.scene.addChild(Hack.player);
    Hack.statusLabel = this.name;
  }

  hitTest(x: number, y: number): boolean {
    return this.bmap.hitTest(x, y);
  }

  autoSorting() {
    var ref: RPGMap =
      this instanceof RPGMap ? this : (<any>this).ref || Hack.map;
    if (ref.layerChangeFlag) {
      ref.scene.childNodes.sort((a: RPGObject, b: RPGObject) => {
        if (!('layer' in a) && !('layer' in b)) return 0;
        if (!('layer' in a)) return 1;
        if (!('layer' in b)) return -1;
        return a.layer - b.layer;
      });
      ref.layerChangeFlag = false;
    }
  }

  get name() {
    if (!this._name) {
      var result = Object.keys(Hack.maps).filter(
        key => Hack.maps[key] === this
      );
      this._name = result.length > 0 ? result[0] : '';
    }
    return this._name;
  }
  get type() {
    if (!this._type) {
      // 初期値は（0,0）のタイル
      Object.keys(dictionary)
        .filter(key => (<any>dictionary)[key] === this.bmap._data[0][0][0])
        .forEach(key => (this._type = key));
    }
    return this._type;
  }
  set type(value) {
    if (value !== this._type && dictionary.hasOwnProperty(value)) {
      this._type = value;
      // typeによってbmapを初期化
      var frame = (<any>dictionary)[value];
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
  get width(): number {
    return this.bmap.width;
  }
  get height(): number {
    return this.bmap.height;
  }
  // Collisino Map. (this.bmap.collisionData)
  get cmap(): (0 | 1)[][] | null {
    return this.bmap.collisionData;
  }
  set cmap(value) {
    this.bmap.collisionData = value;
  }
  // bmap Image (enchant.Surface)
  get image() {
    return this.bmap.image;
  }
  set image(value) {
    this.bmap.image = this.fmap.image = value;
  }
  get tileWidth(): number {
    return this.bmap.tileWidth;
  }
  get tileHeight(): number {
    return this.bmap.tileHeight;
  }

  set background(value: any) {
    this.bmap.overwrite = value;
    this.bmap.redraw();
  }

  set foreground(value: any) {
    this.fmap.overwrite = value;
    this.fmap.redraw();
  }
}
