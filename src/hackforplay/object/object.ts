import { default as enchant } from '../../enchantjs/enchant';
import '../../enchantjs/ui.enchant';
import { default as Hack } from '../hack';
import * as synonyms from '../synonyms';
import { default as DeprecatedSkin } from '../deprecated-skin';
import { default as Family, registerServant, getMaster } from '../family';
import { default as SAT } from '../../lib/sat.min';
import { default as BehaviorTypes } from '../behavior-types';
import { default as RPGMap } from '../rpg-map';
import { default as game } from '../game';
import { default as random } from '../random';
import Rule from '../rule';
import { default as Camera } from '../camera';
import { Dir } from '../dir';
import * as Skin from '../skin';
import * as N from './numbers';
import Vector2 from '../math/vector2';

// 1 フレーム ( enterframe ) 間隔で next する
// Unity の StartCoroutine みたいな仕様
function startFrameCoroutine(
  node: any,
  generator: IterableIterator<undefined>
) {
  return new Promise(resolve => {
    node.on('enterframe', function _() {
      const { done } = generator.next();
      if (done) {
        node.removeEventListener('enterframe', _);
        resolve();
      }
    });
  });
}

export default class RPGObject extends enchant.Sprite implements N.INumbers {
  // RPGObject.collection に必要な初期化
  static _collectionTarget = [RPGObject];
  static collection: RPGObject[] = [];
  static _collective = true;

  offset = {
    x: 0,
    y: 0
  };
  damage = 0; // 0 以外のとき, ふれたときに与えるダメージ
  speed = 1.0;
  opacity = 1;
  collideMapBoader = true; // マップの端に衝突判定があると見なすか. false ならマップ外を歩ける
  velocityX = 0;
  velocityY = 0;
  accelerationX = 0;
  accelerationY = 0;
  mass = 1;
  damageTime = 0;
  attackedDamageTime = 30; // * 1/30sec
  _debugColor = 'rgba(0, 0, 255, 0.5)';
  showHpLabel = true; // デフォルトで表示
  name: string = ''; // アセットの名前
  collider?: any;
  colliders?: any;
  isAutoPickUp?: boolean;
  pairedObject?: RPGObject; // 「rule.つくる」で直前(後)に作られたインスタンス
  _ruleInstance?: Rule;
  skill: string = ''; // 攻撃時にしょうかんするアセットの名前
  fieldOfView: number = 1; // 自分を起点に隣何マスまで find 可能か
  lengthOfView: number = 10; // 自分を起点に何マス先まで find 可能か
  money: number = 0; // 持っているお金

  private _hp?: number;
  private _atk?: number;
  private _isDamageObject = false;
  private _penetrate?: number; // ものに触れた時に貫通できる回数
  private _penetratedCount = 0; // すでに貫通した回数
  private _forward?: { x: number; y: number }; // direction
  private _directionType?: 'single' | 'double' | 'quadruple';
  private _behavior: string = BehaviorTypes.Idle; // call this.onbecomeidle
  private _collisionFlag?: boolean;
  private _isKinematic?: boolean; // this.isKinematic (Default: true)
  private _layer: number = (<any>RPGMap).Layer.Middle;
  private _collidedNodes: any[] = []; // 衝突した Node リスト
  private hpchangeFlag = false;
  private getFrameOfBehavior: { [key: string]: () => (number | null)[] } = {};
  private hpLabel?: any;
  private warpTarget?: RPGObject; // warpTo() で新しく作られたインスタンス
  private _flyToward?: Vector2; // velocity を動的に決定するための暫定プロパティ (~0.11)

  constructor(mod?: DeprecatedSkin) {
    super(0, 0);

    this.moveTo(game.width, game.height);

    // Destroy when dead
    this.on('becomedead', () => {
      this.destroy(this.getFrame().length);
    });
    this.on('hpchange', () => {
      if (this.hp <= 0) {
        this.behavior = BehaviorTypes.Dead;
      }
    });

    // 歩き終わったときに自動でものを拾う設定
    this.on('walkend', () => {
      if (this.isAutoPickUp) {
        this.pickUp();
      }
    });

    // 初期化
    this.on('enterframe', this.geneticUpdate);

    // HPLabel
    this.on('hpchange', (e: any) => {
      if (this.hasHp && this.showHpLabel) {
        this.hpLabel = this.hpLabel || makeHpLabel(this);
        this.hpLabel.score = this.hp;
        this.hpLabel.opacity = 1;
      }
    });

    // アセット
    if (typeof mod === 'function') {
      console.error(
        'new RPGObject に引数を与える使い方は非推奨です. この機能は v1 で削除されます'
      );
      this.mod(mod);
      // Skin.XXX の名前をデフォルトの name として登録する
      this.name = DeprecatedSkin.__name.get(mod) || this.name;
    }

    // 後方互換性保持
    this.collider =
      this.collider ||
      new SAT.Box(new SAT.V(0, 0), this.width, this.height).toPolygon();

    // ツリーに追加
    Hack.defaultParentNode.addChild(this);
  }

  n(type: string, operator: string, amount: number) {
    const key = N.key(type);
    if (!key)
      throw new Error(
        `this.n('${key}', '${operator}', ${amount}) の '${key}' は ないみたい`
      );
    const operate = N.operator(operator);
    if (!operate)
      throw new Error(
        `this.n('${key}', '${operator}', ${amount}) の '${operator}' は ないみたい`
      );
    return (this[key] = operate(this[key], amount));
  }

  get atk() {
    if (typeof this._atk === 'number') return this._atk;
    const master = getMaster(this);
    if (master) return master.atk;
    return 0;
  }

  set atk(value) {
    this._atk = value;
  }

  get map() {
    return this.parentNode ? this.parentNode.ref : null;
  }

  get mapX() {
    return Math.floor((this.x - this.offset.x + 16) / 32);
  }

  get mapY() {
    return Math.floor((this.y - this.offset.y + 16) / 32);
  }

  get center() {
    return {
      x: this.x - this.offset.x + 16,
      y: this.y - this.offset.y + 16
    };
  }

  updateCollider() {
    this.collider.pos.x = this.x;
    this.collider.pos.y = this.y;
  }

  get directionType() {
    return this._directionType || 'single'; // デフォルトは single
  }

  set directionType(value) {
    switch (value) {
      case 'single':
      case 'double':
      case 'quadruple':
        this._directionType = value;
        break;
      default:
        throw new Error(`${value} は正しい directionType ではありません`);
        break;
    }
  }

  get collisionFlag() {
    if (this._collisionFlag !== undefined) return this._collisionFlag;
    if (this.damage) return false; // ダメージオブジェクトは衝突処理がない
    const noCollisionEvents = [
      'addtrodden',
      'removetrodden',
      'playerenter',
      'playerstay',
      'playerexit',
      'pickedup'
    ];
    for (var i = 0; i < noCollisionEvents.length; i++) {
      if (this.isListening(noCollisionEvents[i])) {
        return false;
      }
    }
    return true;
  }

  set collisionFlag(value: boolean) {
    this._collisionFlag = value;
  }

  get isKinematic() {
    return this._isKinematic !== undefined
      ? this._isKinematic
      : !(
          this.velocityX ||
          this.velocityY ||
          this.accelerationX ||
          this.accelerationY ||
          this._flyToward
        );
  }
  set isKinematic(value: boolean) {
    this._isKinematic = value;
  }

  get isDamageObject() {
    return this.damage !== 0 || this._isDamageObject;
  }

  set isDamageObject(value) {
    this._isDamageObject = value;
  }

  get penetrate() {
    return this._penetrate !== undefined ? this._penetrate : 0;
  }

  set penetrate(value) {
    this._penetrate = value;
  }

  addPenetratedCount() {
    this._penetratedCount++;
    if (
      this._penetrate !== undefined && // そもそも貫通限界が設定されているか
      this._penetrate < this._penetratedCount // 貫通限界を超えたか
    ) {
      this.destroy();
    }
  }

  geneticUpdate() {
    if (!Hack.isPlaying) return;
    // enter frame
    this.damageTime = Math.max(0, this.damageTime - 1); // fix: hp が number でなくても damageTime は減る
    if (this.hasHp) {
      if (this.damageTime > 0) {
        this.visible = ((this.damageTime / 2) >> 0) % 2 === 0; // 点滅
      }
    }
    if (this.hpchangeFlag) {
      const event = new enchant.Event('hpchange', {
        item: this // イベント引数の統一
      });
      this.dispatchEvent(event);
      this.hpchangeFlag = false;
    }
    if (this.isBehaviorChanged) {
      // begin animation
      var routine = this.getFrameOfBehavior[this.behavior];
      if (routine) this.frame = routine.call(this);
      // becomeイベント内でbehaviorが変更された場合、
      // 次のフレームで１度だけbecomeイベントが発火します。
      this.isBehaviorChanged = false;
      const event = new enchant.Event('become' + this.behavior, {
        item: this // イベント引数の統一
      });
      this.dispatchEvent(event);
    }
  }

  locate(fromLeft: number, fromTop: number, mapName?: string) {
    if (mapName && mapName in Hack.maps) {
      if (
        Hack.maps[mapName] instanceof RPGMap &&
        this.map !== Hack.maps[mapName]
      ) {
        // プレイヤーがワープする場合は, 先にマップを変更する
        if (this === (Camera.main && Camera.main.target)) {
          Hack.changeMap(mapName);
        }
        Hack.maps[mapName].scene.addChild(this);
      }
    } else if (typeof mapName === 'string') {
      const hasZenkaku = /[０-９]/.exec(mapName);
      if (hasZenkaku) {
        Hack.log(
          `locate(${fromLeft}, ${fromTop}, ${mapName}) には全角の${
            hasZenkaku[0]
          }が入っています！全角/半角を押して半角文字にしましょう`
        );
      } else {
        Hack.log(`${mapName} は まだつくられていない`);
      }
    }
    this.moveTo(fromLeft * 32 + this.offset.x, fromTop * 32 + this.offset.y);
    this.updateCollider(); // TODO: 動的プロパティ
  }

  destroy(delay = 0) {
    const _remove = () => {
      this.remove();
      if (this.shadow) this.shadow.remove();
      if (this.hpLabel) this.hpLabel.remove();
    };
    if (delay > 0) this.setTimeout(_remove.bind(this), delay);
    else _remove.call(this);
  }

  setFrame(
    behavior: string,
    frame: (number | null)[] | ((this: RPGObject) => (number | null)[])
  ) {
    // behavior is Type:string
    // frame is Frames:array or Getter:function
    if (typeof frame === 'function') {
      this.getFrameOfBehavior[behavior] = frame;
    } else {
      this.getFrameOfBehavior[behavior] = () => frame;
    }
  }

  getFrame() {
    if (this.getFrameOfBehavior[this.behavior] instanceof Function) {
      return this.getFrameOfBehavior[this.behavior].call(this);
    }
    return [];
  }

  setTimeout(
    callback: (this: RPGObject) => any,
    wait: number,
    timing = 'enterframe'
  ) {
    const target = this.age + Math.max(1, wait);
    let flag = true;

    const task = () => {
      if (this.age === target && flag) {
        callback.call(this);
        stopTimeout();
      }
    };

    const stopTimeout = () => {
      flag = false;
      this.removeEventListener(timing, task);
    };
    this.on(timing, task);
    return stopTimeout;
  }

  setInterval(
    callback: (this: RPGObject, count: number) => any,
    interval: number
  ) {
    const current = this.age;
    let flag = true;

    let count = 0;

    const task = () => {
      if ((this.age - current) % interval === 0 && flag) {
        callback.call(this, ++count);
      }
    };

    const stopInterval = () => {
      flag = false;
      this.removeEventListener('enterframe', task);
    };
    this.on('enterframe', task);
    return stopInterval;
  }

  async attack() {
    if (this.behavior !== BehaviorTypes.Idle || !Hack.isPlaying) return;
    this.behavior = BehaviorTypes.Attack;
    const dx = this.mapX + this.forward.x;
    const dy = this.mapY + this.forward.y;

    if (this.skill) {
      // アセットをしょうかんする
      this.しょうかんする(this.skill);
    } else {
      // ダメージを与えるオブジェクトを生成する
      const damageObject = new RPGObject();
      damageObject.damage = this.atk;
      registerServant(this, damageObject);
      damageObject.collider = new SAT.Box(new SAT.V(0, 0), 8, 8).toPolygon();
      damageObject.collider.setOffset(new SAT.V(12, 12));
      if (this.map) {
        damageObject.locate(dx, dy, this.map.name); // 同じ場所に配置する
      } else {
        damageObject.locate(dx, dy);
      }
      damageObject.setTimeout(
        () => damageObject.destroy(),
        this.getFrame().length
      );
    }

    await new Promise(resolve => {
      this.setTimeout(resolve, this.getFrame().length);
    });

    this.behavior = BehaviorTypes.Idle;
  }

  async walk(
    distance = 1,
    forward: { x: number; y: number } | null = null,
    setForward = true
  ) {
    if (!Hack.isPlaying) return;
    if (!this.isKinematic) return;
    if (this.behavior !== BehaviorTypes.Idle) return;

    if (forward && setForward) this.forward = forward;

    // 距離が 1 以下
    if (distance < 1) return;

    distance = Math.round(distance);

    // distance 回歩く
    for (let i = 0; i < distance; ++i) {
      await startFrameCoroutine(this, this.walkImpl(forward || this.forward));
    }
  }

  *walkImpl(forward: { x: number; y: number }) {
    // タイルのサイズ
    const tw = Hack.map.tileWidth;
    const th = Hack.map.tileHeight;

    // マップのタイル数
    const tx = Hack.map.tileNumX;
    const ty = Hack.map.tileNumY;

    // 移動先
    const nextX = this.mapX + forward.x;
    const nextY = this.mapY + forward.y;

    let isHit = Hack.map.hitTest(nextX * tw, nextY * th);

    // 画面外
    if (nextX < 0 || nextX >= tx || nextY < 0 || nextY >= ty) {
      // 画面外なら歩かない
      if (this.collideMapBoader) {
        this.dispatchCollidedEvent([], true);
        // 1 フレーム待つ
        yield;
        return;
      }
      // 画面外に判定はない
      else isHit = false;
    }

    // 歩く先にあるオブジェクト
    const hits = RPGObject.collection.filter(obj => {
      return (
        obj.isKinematic &&
        obj.collisionFlag &&
        obj.mapX === nextX &&
        obj.mapY === nextY
      );
    });

    // 初めて衝突したオブジェクト
    const newHits = hits.filter(node => {
      return !this._collidedNodes.includes(node);
    });
    this._collidedNodes.push(...newHits);

    // 障害物があるので歩けない
    if (isHit || hits.length) {
      this.dispatchCollidedEvent(newHits, false);
      // 1 フレーム待つ
      yield;
      return;
    }

    // 速度が 0.0 以下なら歩けない
    if (this.speed <= 0.0) return;

    // 歩く
    this.behavior = BehaviorTypes.Walk;
    this.dispatchEvent(new enchant.Event('walkstart'));

    // 衝突リストを初期化
    this._collidedNodes = [];

    const animation = [...this.getFrame()];
    // 最後に null が入っているので削除
    animation.pop();

    // 1F の移動量
    let move = 1.0 / animation.length;

    // 移動量に速度をかける
    move *= this.speed;

    // 1 マス移動するのにかかるフレーム数
    // 最速でも 1 フレームはかかるようになっている
    const endFrame = Math.ceil(1.0 / move);

    // 移動開始座標
    const beginX = this.x;
    const beginY = this.y;

    for (let frame = 1; frame <= endFrame; ++frame) {
      // アニメーション番号を算出
      this.frame = animation[Math.floor((animation.length / endFrame) * frame)];

      const x = beginX + move * tw * frame * forward.x;
      const y = beginY + move * th * frame * forward.y;

      // 移動
      this.moveTo(x, y);

      this.dispatchEvent(new enchant.Event('walkmove'));

      // 最終フレームなら待たない
      if (frame === endFrame) break;

      // 1 フレーム待機する
      yield;
    }

    // 移動の誤差を修正
    this.x = beginX + tw * forward.x;
    this.y = beginY + th * forward.y;
    this.updateCollider(); // TODO: 動的プロパティ

    this.dispatchEvent(new enchant.Event('walkend'));

    this.behavior = BehaviorTypes.Idle;
  }

  dispatchCollidedEvent(hits: RPGObject[], map: boolean) {
    // 衝突イベントを dispatch
    const event = new enchant.Event('collided');
    event.map = map;
    event.hit = hits[0];
    event.hits = hits;
    event.item = event.hit; // イベント引数の統一
    this.dispatchEvent(event);
    if (hits.length) {
      // 相手に対してイベントを dispatch
      const event = new enchant.Event('collided');
      event.map = false;
      event.hit = this;
      event.hits = [this];
      event.item = event.hit; // イベント引数の統一
      hits.forEach(hitObj => {
        hitObj.dispatchEvent(event);
      });
    }
  }

  velocity(x: number, y: number) {
    this.velocityX = x;
    this.velocityY = y;
  }

  force(x: number, y: number) {
    this.accelerationX = x / this.mass;
    this.accelerationY = y / this.mass;
  }

  get hasHp() {
    return this._hp !== undefined;
  }
  get hp() {
    return this._hp || 0;
  }
  set hp(value: number) {
    if (!isNaN(value) && value !== this._hp) {
      this.hpchangeFlag = true;
      this._hp = value;
    }
  }

  get behavior() {
    return this._behavior;
  }
  set behavior(value) {
    if (typeof value === 'string') {
      this.isBehaviorChanged = true;
      this._behavior = value;
    }
  }

  get layer() {
    return this._layer;
  }
  set layer(value) {
    if (this === Hack.player) return; // プレイヤーのレイヤー移動を禁止
    if (value === this._layer) return;

    const { Layer } = <any>RPGMap;

    // Range of layer
    var sortingOrder = Object.keys(Layer).map(function(key) {
      return Layer[key];
    });
    var max = Math.max.apply(null, sortingOrder);
    var min = Math.min.apply(null, sortingOrder);
    this._layer = Math.max(Math.min(value, max), min);

    // 他オブジェクトはプレイヤーレイヤーに干渉できないようにする
    if (this._layer === Layer.Player) {
      switch (Math.sign(value - this._layer)) {
        case 1:
          this._layer = this.bringOver();
        case -1:
          this._layer = this.bringUnder();
        default:
          break;
      }
    }

    this.map.layerChangeFlag = true; // レイヤーをソートする
  }

  bringOver() {
    const { Layer } = <any>RPGMap;
    // 現在のレイヤーより大きいレイヤーのうち最も小さいもの
    var uppers = Object.keys(Layer)
      .map(key => {
        return Layer[key];
      }, this)
      .filter(layer => {
        return layer > this.layer;
      }, this);
    this.layer = uppers.length > 0 ? Math.min.apply(null, uppers) : this.layer;
    return this.layer;
  }

  bringUnder() {
    const { Layer } = <any>RPGMap;
    // 現在のレイヤーより小さいレイヤーのうち最も大きいもの
    var unders = Object.keys(Layer)
      .map(key => {
        return Layer[key];
      }, this)
      .filter(layer => {
        return layer < this.layer;
      }, this);
    this.layer = unders.length > 0 ? Math.max.apply(null, unders) : this.layer;
    return this.layer;
  }

  shoot(node: RPGObject, vector?: { x: number; y: number }, speed?: number) {
    node.collisionFlag = false;

    // 置くだけ
    if (!vector) {
      return node.locate(this.mapX, this.mapY);
    }

    // 配列ならベクトル化
    if (Array.isArray(vector)) {
      vector = {
        x: vector[0],
        y: vector[1]
      };
    }

    // 正規化
    var length = Math.pow(vector.x, 2) + Math.pow(vector.y, 2);
    if (length > 0) length = 1 / length;
    vector = {
      x: vector.x * length,
      y: vector.y * length
    };

    node.locate(
      Math.round(this.mapX + vector.x),
      Math.round(this.mapY + vector.y)
    );

    // 速度をかける
    if (speed !== undefined) {
      vector.x *= speed;
      vector.y *= speed;
    } else {
      speed = 1;
    }
    node.velocity(vector.x, vector.y);

    var angle = 0;

    // 対象が MapObject かつベクトルの長さが 0.0 より大きいなら
    if (
      node.directionType === 'single' &&
      !(vector.x === 0 && vector.y === 0)
    ) {
      angle = 90 - (Math.atan2(-vector.y, vector.x) * 180) / Math.PI;
    }

    // 速度がマイナスなら角度はそのままにする
    if (speed < 0) angle += 180;

    node._rotation = angle;

    return this;
  }

  mod(func: (this: RPGObject) => any) {
    func.call(this);
  }

  get forward() {
    if (this._forward) return this._forward;
    switch (this.directionType) {
      case 'single':
        return { x: 0, y: -1 };
      case 'double':
        return { x: -1, y: 0 };
      default:
        return { x: 0, y: 1 };
    }
  }
  set forward(value) {
    let vec;
    if (Array.isArray(value)) {
      vec = {
        x: value[0],
        y: value[1]
      };
    } else if (typeof value.x === 'number' && typeof value.y === 'number') {
      vec = {
        x: value.x,
        y: value.y
      };
    } else {
      throw new TypeError(
        `${value} は forward に代入できません (${this.name})`
      );
    }
    var norm = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    if (norm > 0) {
      this._forward = {
        x: vec.x / norm,
        y: vec.y / norm
      };
    }
    switch (this._directionType) {
      case 'single':
        // 画像は上向きと想定する
        const angle = this._forward
          ? (Math.atan2(this._forward.y, this._forward.x) / Math.PI) * 180 + 90
          : 0; // 基準は上,時計回りの度数法
        this.rotation = (angle + 360) % 360;
        break;
      case 'double':
        // 画像は左向きと想定する
        if (this._forward) {
          if (this._forward.x !== 0) {
            this.scaleX = -Math.sign(this._forward.x) * Math.abs(this.scaleX);
          }
        }
        break;
      case 'quadruple':
        var dir = Hack.Vec2Dir(this._forward);
        const c = this._graphicColumn || 9; // ６列画像に対応する
        this.frame = [dir * c + (this.frame % c)];
        break;
      default:
        // 未設定
        break;
    }
  }

  get direction() {
    switch (this.directionType) {
      case 'single':
        return 0;
      case 'double':
        return this.forward.x;
      case 'quadruple':
        return Hack.Vec2Dir(this.forward);
    }
  }

  set direction(value: number) {
    switch (this.directionType) {
      case 'single':
      case 'quadruple':
        this._forward = Hack.Dir2Vec(value);
        break;
      case 'double':
        this._forward = { x: Math.sign(value) || -1, y: 0 };
        break;
    }
  }

  setFrameD9(
    behavior: string,
    frame: (number | null)[] | (() => (number | null)[])
  ) {
    const array = typeof frame === 'function' ? frame() : frame;

    this.setFrame(behavior, () => {
      const _array: (number | null)[] = [];
      array.forEach((item, index) => {
        _array[index] =
          item !== null && item >= 0 ? item + this.direction * 9 : item;
      }, this);
      return _array;
    });
  }

  turn(amount = 1) {
    switch (this.directionType) {
      case 'double':
        this.direction = 1 - this.direction; // どうせ使わないので雑に実装
        break;
      case 'single':
      case 'quadruple':
        // 0: 下
        // 1: 左
        // 2: 右
        // 3: 上
        amount = (amount < 0 ? 4 - amount : amount) % 4;
        let dir = this.direction;
        for (let i = 0; i < amount; i++) {
          switch (dir) {
            case 0:
              return 1; // 下 => 左
            case 1:
              return 3; // 左 => 上
            case 2:
              return 0; // 右 => 下
            case 3:
              return 2; // 上 => 右
          }
        }
        this.direction = dir;
        break;
    }
  }

  dispatchEvent(event: any) {
    enchant.EventTarget.prototype.dispatchEvent.call(this, event);
    // Synonym Event を発火
    const events = <any>synonyms.events;
    const synonym: any = <any>events[event.type];
    if (synonym) {
      var clone = Object.assign({}, event, {
        type: synonym
      });
      enchant.EventTarget.prototype.dispatchEvent.call(this, clone);
    }
  }

  isListening(eventType: string) {
    // eventType のリスナーを持っているか
    const events = <any>synonyms.events;
    var synonym = events[eventType];
    return (
      this['on' + eventType] ||
      this._listeners[eventType] ||
      (synonym && (this['on' + synonym] || this._listeners[synonym]))
    );
  }

  start(virtual: any) {
    let count = 1;
    const override = async () => {
      // １フレームだけディレイを入れる
      await this.wait();
      // count をインクリメントして同じ関数をコール
      return virtual(this, ++count, override);
    };
    // 初回のみ即座にコール
    virtual(this, count, override);
  }

  wait(second = 0) {
    let frame = second * game.fps;
    return new Promise(resolve => {
      const handler = () => {
        if (!Hack.world || Hack.world._stop) return; // ゲームがストップしている
        if (--frame <= 0) {
          resolve();
          game.removeEventListener('enterframe', handler);
        }
      };
      game.on('enterframe', handler);
    });
  }

  async endless(virtual: any) {
    if (!this._endless) {
      // ルーチンをスタート
      let count = 1;
      this._endless = virtual;
      // this._endless が空で上書きされたときストップ
      while (this._endless) {
        // つねに this._endless をコールし続ける
        await this._endless(this, count++);
        // 安全ディレイ
        await this.wait();
      }
    } else {
      // 次回呼ぶ関数を上書き (フラグの役割を兼ねている)
      this._endless = virtual;
    }
  }

  pickUp() {
    // Find items and dispatch pickedup event
    RPGObject.collection
      .filter(item => {
        return item.mapX === this.mapX && item.mapY === this.mapY;
      })
      .forEach(item => {
        const event = new enchant.Event('pickedup');
        event.actor = this;
        item.dispatchEvent(event);
      });
  }

  get family() {
    return this._family || Family.Independence; // デフォルトでは独立軍
  }

  set family(family) {
    this._family = family;
  }

  summon(skin: DeprecatedSkin, _class = RPGObject) {
    // 自分と同じ Family を持つ従者とする
    const appended = new _class(skin);
    registerServant(this, appended);
    if (this.map) {
      // 同じ場所に配置する
      appended.locate(this.mapX, this.mapY, this.map.name);
    }
    return appended;
  }

  set imageUrl(url: string) {
    if (typeof url !== 'string') {
      throw new Error(`${this.name}の imageUrl に文字列以外が代入されました`);
    }
    if (url.indexOf('http') === 0) {
      throw new Error(`http から始まる URL は読み込めません`);
    }
    const image = enchant.Surface.load(url, () => {
      this.image = image;
      this.width = image.width;
      this.height = image.height;
      this.offset = {
        x: (32 - this.width) / 2,
        y: (32 - this.height) / 2
      };
      this.directionType = 'single';
      this.locate(this.mapX, this.mapY);
    });
  }

  /**
   * ドラゴンのブレス. 暫定
   * @param {Object} params
   */
  breath(params: any) {
    console.warn('breath は非推奨になりました');
    params = {
      // デフォルトのパラメータ
      skin: (<any>DeprecatedSkin).バクエン,
      speed: 5,
      scale: 1,
      ...params
    };
    this.endless((self: RPGObject, count: number) => {
      if (count % 2 === 0) return;
      const effect = self.summon(params.skin);
      effect.mod(Hack.createDamageMod(self.atk, self)); // ダメージオブジェクトにする
      self.shoot(effect, self.forward, params.speed);
      const fx = self.forward.x;
      const fy = self.forward.y;
      effect.moveBy(fx * random(64, 96), fy * random(64, 96));
      effect.velocityX += random(-0.99, 1);
      effect.velocityY += random(-0.99, 1);
      effect.scale(random(params.scale, params.scale * 1.5));
      effect.destroy(20);
    });
  }

  /**
   * object の warpTo で設定された位置へ移動する
   * @param {RPGObject} object
   */
  warp(object: RPGObject) {
    console.warn('warp は非推奨になりました. teleport を使ってください');
    if (!(object instanceof RPGObject)) {
      throw new Error(
        `${this.name} の warp に RPGObject ではなく ${object} が与えられました`
      );
    }
    const { warpTarget } = object;
    if (!(warpTarget instanceof RPGObject)) {
      throw new Error(
        `${
          object.name
        } の warpTo が設定されていません. warpTarget が ${warpTarget} です`
      );
    }
    if (!warpTarget.parentNode) {
      throw new Error(
        `${warpTarget.name} の ワープ先のオブジェクトが削除されています. ${
          this.name
        } はワープできませんでした`
      );
    }
    this.locate(warpTarget.mapX, warpTarget.mapY, warpTarget.map.name);
  }

  /**
   * warp の飛び先を決める
   * @param {Number} x
   * @param {Number} y
   * @param {String} mapName
   */
  warpTo(x: number, y: number, mapName: string) {
    console.warn('warpTo は非推奨になりました');
    const { _ruleInstance } = this;
    if (!(_ruleInstance instanceof Rule)) {
      throw new Error(
        `warpTo を設定できません. new RPGObject(Skin.${
          this.name
        }) を rule.つくる('${this.name}') に書きかえてください`
      );
    }
    const warpTarget = _ruleInstance.つくる(this.name); // 同じアセットを作る
    warpTarget.locate(x, y, mapName);
    warpTarget.warpTarget = this; // 飛び先の飛び先は自分
    this.warpTarget = warpTarget;
    return warpTarget;
  }

  teleport(portal: RPGObject) {
    if (this.behavior !== BehaviorTypes.Idle) return;
    const { pairedObject } = portal;
    if (!pairedObject) return;
    this.locate(pairedObject.mapX, pairedObject.mapY, pairedObject.map.name);
  }

  /**
   * rule.メッセージされたとき を発火させる
   * @param {String} アセットの名前
   */
  message(name: string) {
    const { _ruleInstance } = this;
    if (!(_ruleInstance instanceof Rule)) {
      throw new Error(
        `${this.name} からメッセージを送れません. new RPGObject(Skin.${
          this.name
        }) を rule.つくる('${this.name}') に書きかえてください`
      );
    }
    _ruleInstance.message(this, name);
  }

  /**
   * summon の rule.つくる バージョン
   */
  しょうかんする(name: string) {
    const { _ruleInstance } = this;
    if (!(_ruleInstance instanceof Rule)) {
      throw new Error(
        `${this.name} からメッセージを送れません. new RPGObject(Skin.${
          this.name
        }) を rule.つくる('${this.name}') に書きかえてください`
      );
    }
    const appended = _ruleInstance.つくる(
      name,
      this.mapX + this.forward.x,
      this.mapY + this.forward.y,
      this.map ? this.map.name : undefined,
      () => Vector2.from(this.forward),
      this
    );
    registerServant(this, appended); // 自分と同じ Family を持つ従者とする
    return appended;
  }

  へんしんする(name: string) {
    const { _ruleInstance, hp } = this;
    if (!_ruleInstance) return;
    _ruleInstance.installAsset(name);
    _ruleInstance.unregisterRules(this);
    _ruleInstance.registerRules(this, name);
    this.hp = hp; // 体力だけは引き継ぐ
  }

  getNearest(collection: RPGObject[]): RPGObject | null {
    let nearestObject: RPGObject | null = null;
    let nearestDistance: number = Infinity;
    for (const item of collection) {
      if (!item.parentNode || !item.scene) continue; // マップ上に存在しないオブジェクトはのぞく
      const dx = item.mapX - this.mapX;
      const dy = item.mapY - this.mapY;
      const distance = dx * dx + dy * dy;
      if (distance < nearestDistance) {
        nearestObject = item;
        nearestDistance = distance;
      }
    }
    return nearestObject;
  }

  /**
   * 指定されたアセットのインスタンスのうち一つを追う
   * いない場合は何もしない
   * (chase4 のシノニム)
   * @param {String} name
   */
  chase(name: string) {
    return this.chase4(name);
  }

  /**
   * 指定されたアセットのインスタンスのうち一つを追う
   * いない場合は何もしない
   * @param {String} name
   */
  async chase4(name: string) {
    const { _ruleInstance } = this;
    if (!_ruleInstance) return;
    const item = this.getNearest(_ruleInstance.getCollection(name));
    if (!item) return;

    const x = item.mapX - this.mapX;
    const y = item.mapY - this.mapY;
    if (x === 0 && y === 0) return;
    const absX = Math.abs(x);
    const absY = Math.abs(y);

    if (absX > absY || (absX === absY && Math.random() < 0.5)) {
      // 遠い方優先で動く. 同じだった場合はランダム
      this.forward = { x: Math.sign(x), y: 0 };
    } else {
      this.forward = { x: 0, y: Math.sign(y) };
    }
    await this.walk(); // あるく
  }

  async chase8(name: string) {
    const { _ruleInstance } = this;
    if (!_ruleInstance) return;
    const item = this.getNearest(_ruleInstance.getCollection(name));
    if (!item) return;

    const x = Math.sign(item.mapX - this.mapX);
    const y = Math.sign(item.mapY - this.mapY);
    if (x === 0 && y === 0) return;
    this.forward = { x, y };
    await this.walk(); // あるく
  }

  set dir(dir: Dir) {
    this.forward = dir();
  }

  private _lastAssignedSkin?: Skin.Result; // 参照比較するためのプロパティ
  private _skin: Skin.Result | null = null; // Promise<(object: RPGObject) => void>
  get skin() {
    return this._skin;
  }
  set skin(value) {
    if (!value) return;
    const { _skin } = this;
    if (_skin) {
      if (this._lastAssignedSkin === value) return; // 同じスキンなのでスルー
      this._lastAssignedSkin = value;
      // 前回に与えられた skin が resolve(reject) するまで待つ
      this._skin = _skin.then(() => value).then(this.applySkin);
    } else {
      this._skin = value.then(this.applySkin);
    }
  }

  private applySkin = ((f: (object: RPGObject) => void) => {
    f(this); // スキンを適用
    var routine = this.getFrameOfBehavior[this.behavior];
    if (routine) this.frame = routine.call(this); // frame を設定し直す
    return f;
  }).bind(this);

  flyToward(target?: RPGObject | string) {
    const { _ruleInstance } = this;
    if (!_ruleInstance) return;
    const targetObject =
      typeof target === 'string'
        ? this.getNearest(_ruleInstance.getCollection(name))
        : target;
    if (targetObject) {
      this._flyToward = new Vector2(targetObject.mapX, targetObject.mapY)
        .subtract({ x: this.mapX, y: this.mapY })
        .normalize();
    } else {
      this._flyToward =
        this._flyToward || Vector2.from(this.forward).normalize();
    }
  }

  private _isJustBeingFound = false; // みつけたときに同フレーム内で this.find() して Stackoverflow するのを防ぐフラグ
  async find() {
    if (this.behavior !== BehaviorTypes.Idle) return;
    if (this._isJustBeingFound) return; // 同フレーム内でみつけたときがコールされたばかり
    const { _ruleInstance } = this;
    if (!_ruleInstance) return;
    const sight = Vector2.from(this.forward)
      .unit()
      .scale(this.lengthOfView); // 視線に対して平行な単位ベクトル
    const right = sight
      .rotateAngle(90)
      .unit()
      .scale(this.fieldOfView); // 視線に対して右手方向 (X軸とは限らない) の単位ベクトル
    // this の (x, y) を原点として, ~ +sight までと, -right ~ +right までの矩形が視界の範囲
    const x1 = this.mapX - right.x;
    const x2 = this.mapX + sight.x + right.x;
    const y1 = this.mapY - right.y;
    const y2 = this.mapY + sight.y + right.y;
    const rangeOfView = {
      left: Math.min(x1, x2),
      right: Math.max(x1, x2),
      top: Math.min(y1, y2),
      bottom: Math.max(y1, y2)
    };
    // 「みつけたとき」イベントが発火しうる対象のうち最も近いものを探す
    const foundable = RPGObject.collection
      .filter(
        item =>
          rangeOfView.left <= item.mapX &&
          item.mapX <= rangeOfView.right &&
          rangeOfView.top <= item.mapY &&
          item.mapY <= rangeOfView.bottom
      )
      .filter(item =>
        _ruleInstance.hasTwoObjectListenerWith('みつけたとき', this.name, item)
      );
    const found = this.getNearest(foundable);
    if (found) {
      this._isJustBeingFound = true; // このフレームでは find() をスキップ
      const p = _ruleInstance.runTwoObjectListener('みつけたとき', this, found);
      this._isJustBeingFound = false; // スキップタイム終了
      await p; // await this.find() でみつけたときをループできるよう, 終了を待つ
    }
  }
}

function makeHpLabel(self: RPGObject) {
  const label = new (<any>enchant).ui.ScoreLabel();
  label.label = 'HP:';
  label.opacity = 0;
  self.parentNode.addChild(label);
  self.on('enterframe', (e: any) => {
    if (self.parentNode && self.parentNode !== label.parentNode) {
      self.parentNode.addChild(label);
    }
    label.x = self.x;
    label.y = self.y;
    const diff = 1.01 - label.opacity;
    label.opacity = Math.max(0, label.opacity - diff / 10);
  });
  return label;
}
