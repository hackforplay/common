import { log } from '@hackforplay/log';
import { default as enchant } from '../../enchantjs/enchant';
import '../../enchantjs/ui.enchant';
import { default as SAT } from '../../lib/sat.min';
import { default as BehaviorTypes } from '../behavior-types';
import { memoMethod, objectsInDefaultMap } from '../cache';
import { default as Camera } from '../camera';
import * as Dir from '../dir';
import { Direction, turn } from '../direction';
import {
  default as Family,
  getMaster,
  isOpposite,
  registerServant
} from '../family';
import { default as game } from '../game';
import { getHack } from '../get-hack';
import { generateMapFromDefinition } from '../load-maps';
import Vector2, { IVector2 } from '../math/vector2';
import { randomCollection } from '../random';
import RPGMap from '../rpg-map';
import { Rule } from '../rule';
import soundEffect from '../se';
import { decode, getSkin, initSurface, ISkin, SkinCachedItem } from '../skin';
import { errorRemoved, logToDeprecated } from '../stdlog';
import * as _synonyms from '../synonyms';
import { synonyms } from '../synonyms/rpgobject';
import {
  PropertyMissing,
  proxyMap,
  synonymizeClass
} from '../synonyms/synonymize';
import talk from '../talk';
import { showThinkSprite } from '../think';
import { registerWalkingObject, unregisterWalkingObject } from '../trodden';
import { observeArray } from '../utils/observe-array';
import * as N from './numbers';

const Hack = getHack();

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

const walkingObjects = new WeakSet<RPGObject>(); // https://bit.ly/2KqB1Gz
const followingPlayerObjects = new WeakSet<RPGObject>();

const opt = <T>(opt: T | undefined, def: T): T =>
  opt !== undefined ? opt : def;

export default class RPGObject extends enchant.Sprite implements N.INumbers {
  // RPGObject.collection に必要な初期化
  private static _collectionTarget = [RPGObject];
  public static collection = observeArray<RPGObject>([]); // Proxy でトラップする
  private static _collective = true;
  // へんしんするときに初期化するプロパティの設定
  private static readonly propNamesToInit = [
    // 初期値で上書きしたいプロパティ
    'damage',
    'speed',
    'opacity',
    'velocityX',
    'velocityY',
    'accelerationX',
    'accelerationY',
    'mass',
    'skill',
    'fieldOfView',
    'lengthOfView',
    // 未初期化状態に戻したいプロパティ
    '_atk',
    '_penetrate',
    '_collisionFlag',
    '_isKinematic'
  ];

  public offset = {
    x: 0,
    y: 0
  };
  public damage = 0; // 0 以外のとき, ふれたときに与えるダメージ
  public speed = 1.0;
  public velocityX = 0;
  public velocityY = 0;
  public accelerationX = 0;
  public accelerationY = 0;
  public mass = 1;
  public damageTime = 0;
  public attackedDamageTime = 30; // * 1/30sec
  public _debugColor = 'rgba(0, 0, 255, 0.5)';
  public showHpLabel = true; // デフォルトで表示
  public name = ''; // アセットの名前
  public collider?: any;
  /**
   * @deprecated
   */
  public colliders?: any;
  public isAutoPickUp?: boolean;
  public pairedObject?: RPGObject; // 「rule.つくる」で直前(後)に作られたインスタンス
  public _ruleInstance?: Rule;
  public skill = ''; // 攻撃時にしょうかんするアセットの名前
  public fieldOfView = 1; // 自分を起点に隣何マスまで find 可能か
  public lengthOfView = 10; // 自分を起点に何マス先まで find 可能か
  public _mayRotate = false; // 向いている方向に合わせてスプライト自体を回転させるフラグ
  public isInvincible = false; // ダメージを受けなくなるフラグ
  public currentSkin?: ISkin; // 適用されているスキン
  public _stop = false; // オブジェクトの onenterframe を停止させるフラグ
  public childNodes: undefined; // enchant.js 内部で参照されるが初期化されていないプロパティ
  public detectRender: undefined; // enchant.js 内部で参照されるが初期化されていないプロパティ
  public _cvsCache: undefined; // enchant.js 内部で参照されるが初期化されていないプロパティ
  public then: undefined; // await されたときに then が参照される

  private _hp?: number;
  private _atk?: number;
  private _family?: string;
  private _money?: number; // 持っているお金
  private _isDamageObject = false;
  private _penetrate?: number; // ものに触れた時に貫通できる回数
  private _penetratedCount = 0; // すでに貫通した回数
  private _behavior: string = BehaviorTypes.Idle; // call this.onbecomeidle
  private _collisionFlag?: boolean;
  private _isKinematic?: boolean; // this.isKinematic (Default: true)
  private _layer: number = (RPGMap as any).Layer.Middle;
  private _collidedNodes: any[] = []; // 衝突した Node リスト
  private hpchangeFlag = false;
  private hpLabel?: any;
  private warpTarget?: RPGObject; // warpTo() で新しく作られたインスタンス
  public _flyToward?: Vector2; // velocity を動的に決定するための暫定プロパティ (~0.11)
  private _image?: typeof enchant.Surface;
  private _noFilterImage?: typeof enchant.Surface; // filter がかかっていないオリジナルの画像
  private isBehaviorChanged = false;
  private _collideMapBoader?: boolean; // マップの端に衝突判定があると見なすか. false ならマップ外を歩ける

  public constructor() {
    super(0, 0);

    this.moveTo(game.width, game.height);

    // Destroy when dead
    this.on('becomedead', () => {
      this.destroy(this.getFrameLength());
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
    this.on('hpchange', () => {
      if (this.hasHp && this.showHpLabel) {
        this.hpLabel = this.hpLabel || makeHpLabel(this);
        this.hpLabel.label = 'HP:';
        this.hpLabel.score = this.hp;
        this.hpLabel.opacity = 1;
      }
    });

    // 後方互換性保持
    this.collider =
      this.collider ||
      new SAT.Box(new SAT.V(0, 0), this.width, this.height).toPolygon();

    // ツリーに追加
    Hack.defaultParentNode && Hack.defaultParentNode.addChild(this);
  }

  private n(type: string, operator: string, amount: number) {
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

  public get atk(): number {
    if (typeof this._atk === 'number') return this._atk;
    const master = getMaster(this);
    if (master) return master.atk;
    return 0;
  }

  public set atk(value) {
    this._atk = value;
  }

  public get time() {
    return Hack.time;
  }

  public set time(value) {
    Hack.time = value;
  }

  public get map(): RPGMap | null {
    return this.parentNode ? this.parentNode.ref : null;
  }

  public get mapX() {
    return Math.floor((this.x - this.offset.x + 16) / 32);
  }

  public get mapY() {
    return Math.floor((this.y - this.offset.y + 16) / 32);
  }

  public get mapName() {
    return this.map ? this.map.name : undefined;
  }

  public set mapName(mapName) {
    if (mapName && mapName !== this.mapName) {
      this.locate(this.mapX, this.mapY, mapName);
    }
  }

  public get center() {
    return {
      x: this.x - this.offset.x + 16,
      y: this.y - this.offset.y + 16
    };
  }

  public get hasMoney() {
    return this._money !== undefined;
  }
  public get money() {
    return this._money || 0;
  }
  public set money(value: number) {
    if (this._money === value) return;
    this._money = value;
    const { _ruleInstance } = this;
    if (!_ruleInstance) return;
    _ruleInstance.runOneObjectLisener('おかねがかわったとき', this);
  }

  public get opacity() {
    return this._opacity as number;
  }

  public set opacity(value: number) {
    (this as any)._opacity = Math.max(0, Math.min(1, value));
  }

  /**
   * マップの端に衝突判定があると見なすか. false ならマップ外を歩ける
   * デフォルトは isKinematic と同じ
   */
  public get collideMapBoader() {
    return this._collideMapBoader !== undefined
      ? this._collideMapBoader
      : this.isKinematic;
  }
  public set collideMapBoader(value) {
    this._collideMapBoader = value;
  }

  public get isPlayer() {
    return Boolean(Camera && Camera.main && Camera.main.target === this);
  }

  private getFrameLength() {
    const { _frameSequence, isBehaviorChanged, behavior, currentSkin } = this;
    if (isBehaviorChanged) {
      if (!currentSkin) return 0; // Cannot compute
      const { frame } = currentSkin;
      if (!frame || !(behavior in frame)) return 0; // Cannot compute
      const key = behavior as keyof NonNullable<ISkin['frame']>;
      const animation = frame[key];
      if (!animation || animation.length < 1) return 0; // No length
      return decode(...animation).length; // null と関係なく長さを取得
    }
    if (!Array.isArray(_frameSequence)) return 0;
    for (let index = 0; index < _frameSequence.length; index++) {
      if (_frameSequence[index] === null) return index;
    }
    return 0; // means Infinity
  }

  private computeFrame(direction = this.direction, behavior = this.behavior) {
    const { _width, _image, currentSkin } = this;
    if (!_image || !_width || !currentSkin) return;

    const { frame, column } = currentSkin;
    if (!frame || !(behavior in frame)) return;
    const key = behavior as keyof NonNullable<ISkin['frame']>;
    const animation = frame[key];
    if (!animation || animation.length < 1) return; // skip
    const row =
      currentSkin.direction === 1 // 向きが１方向分しかないスキンの場合
        ? 0
        : direction === Direction.Down
        ? 0
        : direction === Direction.Left
        ? 1
        : direction === Direction.Right
        ? 2
        : direction === Direction.Up
        ? 3
        : 0;
    (this as any)._frameSequence = decode(...animation).map(n =>
      n === null ? null : n + column * row
    );
  }

  public updateCollider() {
    this.collider.pos.x = this.x;
    this.collider.pos.y = this.y;
  }

  private rotateIfNeeded() {
    if (this.mayRotate) {
      // 画像は上向きと想定する
      const angle = (this.forward.angle() / Math.PI) * 180 + 90; // 基準は上,時計回りの度数法
      this.rotation = (angle + 360) % 360;
    }
  }

  public get mayRotate() {
    return this._mayRotate;
  }

  public set mayRotate(value: boolean) {
    this._mayRotate = value;
    this.rotateIfNeeded();
  }

  // https://bit.ly/2Zif1lt
  private getDefaultCollisionFlag = memoMethod(() => {
    const noCollisionEvents = [
      'addtrodden',
      'removetrodden',
      'playerenter',
      'playerstay',
      'playerexit',
      'pickedup'
    ];
    for (let i = 0; i < noCollisionEvents.length; i++) {
      if (this.isListening(noCollisionEvents[i])) {
        return false;
      }
    }
    return true;
  }).bind(this);
  public get collisionFlag() {
    return this._collisionFlag !== undefined
      ? this._collisionFlag
      : this.damage
      ? false // ダメージオブジェクトは衝突処理がない
      : this.getDefaultCollisionFlag();
  }

  public set collisionFlag(value: boolean) {
    this._collisionFlag = value;
  }

  public get isKinematic() {
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
  public set isKinematic(value: boolean) {
    this._isKinematic = value;
  }

  public get isDamageObject() {
    return this.damage !== 0 || this._isDamageObject;
  }

  public set isDamageObject(value) {
    this._isDamageObject = value;
  }

  public get penetrate() {
    return this._penetrate !== undefined ? this._penetrate : 0;
  }

  public set penetrate(value) {
    this._penetrate = value;
  }

  public addPenetratedCount() {
    this._penetratedCount++;
    if (
      this._penetrate !== undefined && // そもそも貫通限界が設定されているか
      this._penetrate < this._penetratedCount // 貫通限界を超えたか
    ) {
      this.destroy();
    }
  }

  private geneticUpdate() {
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
      this.computeFrame();
      // becomeイベント内でbehaviorが変更された場合、
      // 次のフレームで１度だけbecomeイベントが発火します。
      this.isBehaviorChanged = false;
      const event = new enchant.Event('become' + this.behavior, {
        item: this // イベント引数の統一
      });
      this.dispatchEvent(event);
    }
  }

  public async locate(
    fromLeft: number,
    fromTop: number,
    mapName?: string,
    ignoreTrodden = false
  ) {
    if (mapName) {
      if (!(mapName in Hack.maps)) {
        // 存在しないマップ
        const hasZenkaku = /[０-９]/.exec(mapName); // 全角数字が含まれている場合は警告する
        if (hasZenkaku) {
          Hack.log(
            `locate(${fromLeft}, ${fromTop}, ${mapName}) には全角の${hasZenkaku[0]}が入っています！全角/半角を押して半角文字にしましょう`
          );
          return;
        }
        generateMapFromDefinition(mapName).then(map => {
          Hack.maps[mapName] = map;
          this.locate(fromLeft, fromTop, mapName, ignoreTrodden); // マップができたらもう一度呼び出す
        });
        console.info(
          `${mapName} is automaticaly generated. You can set background of map!`
        );
        return;
      }
      // オブジェクトのマップを移動させる
      const map = Hack.maps[mapName] as RPGMap;
      if (map instanceof RPGMap && this.map !== map) {
        if (this.isPlayer) {
          // プレイヤーがワープする場合は, 先にマップを変更する
          await Hack.changeMap(mapName);
          // つき従えているキャラクターをワープさせる
          for (const item of [...RPGObject.collection]) {
            if (followingPlayerObjects.has(item)) {
              item.locate(fromLeft, fromTop, mapName, true); // 一旦フラグが消失してしまうので,
              followingPlayerObjects.add(item); // すぐ元に戻す
            }
          }
        }
        map.scene.addChild(this);
        // トリガーを発火
        this._ruleInstance?.runOneObjectLisener(
          'マップがかわったとき',
          this.proxy
        );
      }
    }
    if (ignoreTrodden) {
      // 移動後に trodden が発生しないようにする
      unregisterWalkingObject(this);
    } else if (fromLeft !== this.mapX || fromTop !== this.mapY || mapName) {
      // 位置に変更があれば trodden をフックできるようにする
      registerWalkingObject(this);
    }
    this.moveTo(fromLeft * 32 + this.offset.x, fromTop * 32 + this.offset.y);
    this.updateCollider(); // TODO: 動的プロパティ
    walkingObjects.delete(this);
    followingPlayerObjects.delete(this); // プレイヤーとはぐれた
  }

  public destroy(delay = 0) {
    const _remove = () => {
      this.dispatchEvent(new enchant.Event('destroy')); // ondestroy event を発火
      this.remove.call(this.proxy);
      if (this.hpLabel) this.hpLabel.remove();
    };
    if (delay > 0) this.setTimeout(_remove.bind(this), delay);
    else _remove.call(this);
    // fix: https://github.com/hackforplay/common/issues/91
    this._ruleInstance?.unregisterRules(this.proxy);
  }
  private setFrame() {
    errorRemoved('setFrame', this);
  }

  private getFrame() {
    errorRemoved('getFrame', this);
  }

  private setTimeout(
    callback: (this: RPGObject) => any,
    wait: number,
    timing = 'enterframe'
  ) {
    const target = this.age + Math.max(1, wait);
    let flag = true;
    const task = () => {
      if (this.age === target && flag) {
        callback.call(this);
        stopTimeout.call(this);
      }
    };
    this.on(timing, task);
    function stopTimeout(this: RPGObject) {
      flag = false;
      this.removeEventListener(timing, task);
    }
    return stopTimeout.bind(this);
  }

  private setInterval(
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

  public async attack() {
    if (this.behavior !== BehaviorTypes.Idle || !Hack.isPlaying) return;
    if (!this.parentNode) return; // fix: https://bit.ly/37739X3
    this.behavior = BehaviorTypes.Attack;
    const dx = this.mapX + this.forward.x;
    const dy = this.mapY + this.forward.y;
    let damageObject: RPGObject | undefined;

    if (this.skill) {
      // アセットをしょうかんする
      this.summon(this.skill);
    } else {
      // ダメージを与えるオブジェクトを生成する
      damageObject = new RPGObjectWithSynonym(); // eslint-disable-line
      damageObject.damage = this.atk;
      damageObject.collisionFlag = false;
      registerServant(this, damageObject);
      damageObject.collider = new SAT.Box(new SAT.V(0, 0), 8, 8).toPolygon();
      damageObject.collider.setOffset(new SAT.V(12, 12));
      if (this.map) {
        damageObject.locate(dx, dy, this.map.name); // 同じ場所に配置する
      } else {
        damageObject.locate(dx, dy);
      }
    }

    await new Promise(resolve => {
      this.setTimeout(resolve, this.getFrameLength());
      this.on('destroy', resolve);
    });

    this.behavior = BehaviorTypes.Idle;
    damageObject && damageObject.destroy();
  }

  public async walk(distance = 1, forward?: IVector2, setForward = true) {
    if (!Hack.isPlaying) return;
    if (!this.isKinematic) return;
    if (this.behavior !== BehaviorTypes.Idle) return;

    if (forward && setForward) this.forward = Vector2.from(forward);

    // 距離が 1 以下
    if (distance < 1) return;

    distance = Math.round(distance);

    // distance 回歩く
    walkingObjects.add(this);
    for (let i = 0; i < distance; ++i) {
      await startFrameCoroutine(this, this.walkImpl(forward || this.forward));
    }
    walkingObjects.delete(this); // delete する必要はないが, 意味的に一応しておく
  }

  public walkRight() {
    const forward = Dir.rightHand(this);
    return this.walk(1, forward, false);
  }

  public walkLeft() {
    const forward = Dir.leftHand(this);
    return this.walk(1, forward, false);
  }

  public canWalk(forward: IVector2) {
    if (!this.map) return false; // 削除された
    const x = this.mapX + forward.x;
    const y = this.mapY + forward.y;
    if (
      this.collideMapBoader &&
      (x < 0 || x >= this.map.tileNumX || y < 0 || y >= this.map.tileNumY)
    )
      return false; // 画面外
    if (this.map.cmap && this.map.cmap[y][x] === 1) return false; // 障害物
    for (const item of RPGObject.collection) {
      if (
        item.collisionFlag &&
        this !== item &&
        this.map === item.map &&
        x === item.mapX &&
        y === item.mapY
      )
        return false; // 衝突
    }
    return true;
  }

  private walkDestination?: IVector2;
  private *walkImpl(forward: IVector2) {
    if (!this.map) return;
    if (!walkingObjects.has(this)) return;

    // タイルのサイズ
    const tw = this.map.tileWidth;
    const th = this.map.tileHeight;

    // マップのタイル数
    const tx = this.map.tileNumX;
    const ty = this.map.tileNumY;

    // 移動先
    const unit = Vector2.from(forward).unit8();
    const nextMapX = this.mapX + unit.x;
    const nextMapY = this.mapY + unit.y;

    const isHitCMap = this.map.hitTest(nextMapX * tw, nextMapY * th); // cmap が 1 のマス
    const isHitMapBorder =
      (this.collideMapBoader && nextMapX < 0) ||
      nextMapX >= tx ||
      nextMapY < 0 ||
      nextMapY >= ty; // 画面外にいこうとしている

    // プレイヤーだけは例外的に仲間のいるマスをすり抜けられる
    const mayCollideItems = this.isPlayer
      ? objectsInDefaultMap().filter(item => this.family !== item.family)
      : objectsInDefaultMap();

    // 歩く先にあるオブジェクト
    const hits = mayCollideItems.filter(obj => {
      return (
        obj.isKinematic &&
        obj.collisionFlag &&
        (obj.walkDestination
          ? // 行こうとしているマスで判断
            obj.walkDestination.x === nextMapX &&
            obj.walkDestination.y === nextMapY
          : // 今いるマスで判断
            obj.mapX === nextMapX && obj.mapY === nextMapY)
      );
    });

    // 初めて衝突したオブジェクト
    const newHits = hits.filter(node => {
      return !this._collidedNodes.includes(node);
    });
    this._collidedNodes.push(...newHits);

    // 障害物があるので歩けない
    if (isHitCMap || isHitMapBorder || hits.length) {
      this.dispatchCollidedEvent(newHits, isHitMapBorder);
      // 1 フレーム待つ
      yield;
      return;
    }

    // 速度が 0.0 以下なら歩けない
    if (this.speed <= 0.0) return;

    // 歩く
    this.behavior = BehaviorTypes.Walk;
    this.dispatchEvent(new enchant.Event('walkstart'));
    registerWalkingObject(this);

    // 衝突リストを初期化
    this._collidedNodes = [];

    let baseSpeed = 12; // speed=1 の時にかかる frame
    const walkAnim =
      this.currentSkin && this.currentSkin.frame && this.currentSkin.frame.walk;
    if (walkAnim) {
      baseSpeed = decode(...walkAnim).length - 1;
    }

    // 1 マス移動するのにかかるフレーム数
    // 最速でも 1 フレームはかかるようになっている
    const requiredFrames = Math.ceil(baseSpeed / this.speed);

    // 移動開始座標
    const beginX = this.x;
    const beginY = this.y;
    const nextX = beginX + tw * unit.x;
    const nextY = beginY + th * unit.y;

    this.walkDestination = new Vector2(nextMapX, nextMapY); // 歩行中にぶつからないようにする
    // startCoroutine の時点で 1frame 遅れていると考えて, 1 から始める
    for (let frame = 1; frame < requiredFrames; ++frame) {
      if (!walkingObjects.has(this)) break;
      const t = frame / requiredFrames;
      const x = beginX + t * (nextX - beginX);
      const y = beginY + t * (nextY - beginY);

      // 移動
      this.moveTo(x, y);
      this.updateCollider(); // TODO: 動的プロパティ

      this.dispatchEvent(new enchant.Event('walkmove'));

      // 1 フレーム待機する
      yield;
    }
    this.walkDestination = undefined;

    if (walkingObjects.has(this)) {
      // 移動の誤差を修正
      this.x = nextX;
      this.y = nextY;
      this.updateCollider(); // TODO: 動的プロパティ
    }

    this.dispatchEvent(new enchant.Event('walkmove'));
    this.dispatchEvent(new enchant.Event('walkend'));

    this.behavior = BehaviorTypes.Idle;
  }

  private dispatchCollidedEvent(hits: RPGObject[], map: boolean) {
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

  public velocity(x: number, y: number) {
    this.velocityX = x;
    this.velocityY = y;
  }

  public force(x: number, y: number) {
    this.accelerationX = x / this.mass;
    this.accelerationY = y / this.mass;
  }

  public get hasHp() {
    return this._hp !== undefined;
  }
  public get hp() {
    return this._hp || 0;
  }
  public set hp(value: number) {
    if (!isNaN(value) && value !== this._hp) {
      this.hpchangeFlag = true;
      this._hp = value;
    }
  }

  public get behavior() {
    return this._behavior;
  }

  public set behavior(value) {
    if (typeof value === 'string') {
      this.isBehaviorChanged = true;
      this._behavior = value;
    }
  }

  public get layer() {
    return this._layer;
  }
  public set layer(value) {
    if (this === Hack.player) return; // プレイヤーのレイヤー移動を禁止
    if (value === this._layer) return;

    const { Layer } = RPGMap as any;

    // Range of layer
    const sortingOrder = Object.keys(Layer).map(function (key) {
      return Layer[key];
    });
    const max = Math.max.apply(null, sortingOrder);
    const min = Math.min.apply(null, sortingOrder);
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

    if (this.map) {
      this.map.layerChangeFlag = true; // レイヤーをソートする
    }
  }

  private bringOver() {
    const { Layer } = RPGMap as any;
    // 現在のレイヤーより大きいレイヤーのうち最も小さいもの
    const uppers = Object.keys(Layer)
      .map(key => {
        return Layer[key];
      }, this)
      .filter(layer => {
        return layer > this.layer;
      }, this);
    this.layer = uppers.length > 0 ? Math.min.apply(null, uppers) : this.layer;
    return this.layer;
  }

  private bringUnder() {
    const { Layer } = RPGMap as any;
    // 現在のレイヤーより小さいレイヤーのうち最も大きいもの
    const unders = Object.keys(Layer)
      .map(key => {
        return Layer[key];
      }, this)
      .filter(layer => {
        return layer < this.layer;
      }, this);
    this.layer = unders.length > 0 ? Math.max.apply(null, unders) : this.layer;
    return this.layer;
  }

  public shoot(
    node: RPGObject,
    vector?: { x: number; y: number },
    speed?: number
  ) {
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
    let length = Math.pow(vector.x, 2) + Math.pow(vector.y, 2);
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

    let angle = 0;

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

  public mod(func: (this: RPGObject) => any) {
    func.call(this);
  }

  public get forward() {
    return this.direction === Direction.Down
      ? Vector2.Down
      : this.direction === Direction.Left
      ? Vector2.Left
      : this.direction === Direction.Right
      ? Vector2.Right
      : this.direction === Direction.Up
      ? Vector2.Up
      : Vector2.Down; // default
  }
  public set forward(value: any) {
    const unit = Vector2.from(value).unit();
    this.direction =
      unit.y > 0
        ? Direction.Down
        : unit.x < 0
        ? Direction.Left
        : unit.x > 0
        ? Direction.Right
        : unit.y < 0
        ? Direction.Up
        : Direction.Down; // default

    this.computeFrame();
    this.rotateIfNeeded();
  }

  private _direction = Direction.Down;

  public get direction() {
    return this._direction;
  }
  public set direction(value) {
    this._direction = value;
    this.computeFrame();
  }

  public setFrameD9() {
    errorRemoved('setFrameD9', this);
  }

  public turn(dir: Dir.IDir | Direction): void {
    if (typeof dir === 'function') {
      // 後方互換性のため
      this.forward = dir(this);
    } else {
      this.direction = turn(this.direction, dir);
    }
    this.computeFrame();
  }

  public dispatchEvent(event: any) {
    enchant.EventTarget.prototype.dispatchEvent.call(this, event);
    // Synonym Event を発火
    const events = (_synonyms as any).events;
    const synonym: any = (events as any)[event.type];
    if (synonym) {
      const clone = Object.assign({}, event, {
        type: synonym
      });
      enchant.EventTarget.prototype.dispatchEvent.call(this, clone);
    }
  }

  private isListening(eventType: string) {
    // eventType のリスナーを持っているか
    const events = (_synonyms as any).events;
    const synonym = events[eventType];
    return (
      'on' + eventType in this ||
      eventType in this._listeners ||
      (synonym && ('on' + synonym in this || synonym in this._listeners))
    );
  }

  public start(virtual: any) {
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

  public wait(second = 0) {
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

  public async endless(virtual: any) {
    if (!this._endless) {
      // ルーチンをスタート
      let count = 1;
      this._endless = virtual;
      // this._endless が空で上書きされたときストップ
      while (this._endless && this.parentNode) {
        if (this.map === Hack.map) {
          // つねに this._endless をコールし続ける
          await this._endless(this, count++);
        }
        // 安全ディレイ
        await this.wait();
      }
    } else {
      // 次回呼ぶ関数を上書き (フラグの役割を兼ねている)
      this._endless = virtual;
    }
  }

  private pickUp() {
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

  public get family() {
    return this._family || Family.Independence; // デフォルトでは独立軍
  }

  public set family(family) {
    this._family = family;
  }

  public get image() {
    return this._image || null;
  }

  public set image(image: typeof enchant.Sprite | null) {
    if (!image || this._image === image) return;
    this._image = image;
    this._noFilterImage = image;
    this._computeFramePosition();
  }

  public filter(filter = '') {
    if (!('filter' in CanvasRenderingContext2D.prototype)) return; // ブラウザが非対応
    if (!this._noFilterImage || !this._image) return;
    if (this._image.context && this._image.context.filter === filter) return; // 同じフィルター
    if (!filter) {
      this._image = this._noFilterImage; // オリジナルに戻す
      return;
    }
    const _element: HTMLImageElement | HTMLCanvasElement = this._noFilterImage
      ._element;
    const { width, height } = _element;
    this._image = new enchant.Surface(width, height);
    const context: CanvasRenderingContext2D = this._image.context;
    context.filter = filter;
    context.drawImage(_element, 0, 0);
  }

  public get parent() {
    return getMaster(this);
  }

  public set imageUrl(url: string) {
    errorRemoved('imageUrl', this);
  }

  public breath() {
    errorRemoved('breath', this);
  }

  public warp() {
    errorRemoved('warp', this);
  }

  public warpTo() {
    errorRemoved('warpTo', this);
  }

  public teleport(portal: RPGObject) {
    const { pairedObject } = portal;
    if (!pairedObject || !pairedObject.map) return;
    this.locate(
      pairedObject.mapX,
      pairedObject.mapY,
      pairedObject.map.name,
      true
    );
  }

  public teleportRandom() {
    const { map } = this;
    if (!map) return;
    const pos = randomCollection(map.walkablePositions);
    if (!pos) return;
    this.locate(pos.x, pos.y);
  }

  /**
   * rule.メッセージされたとき を発火させる
   * @param {String} アセットの名前
   */
  public message(name: string) {
    const { _ruleInstance } = this;
    if (!(_ruleInstance instanceof Rule)) {
      throw new Error(
        `${this.name} からメッセージを送れません. new RPGObject(Skin.${this.name}) を rule.つくる('${this.name}') に書きかえてください`
      );
    }
    _ruleInstance.message(this, name);
  }

  /**
   * このキャラクターに別のキャラクターをしょうかんさせる
   * とくに設定しなければ、しょうかんされたキャラクターは同じ[なかま]になる
   */
  public summon(
    name: string,
    forward = 1,
    right = 0,
    map?: string,
    dir?: Dir.IDir
  ) {
    const { _ruleInstance } = this;
    if (!(_ruleInstance instanceof Rule)) {
      throw new Error(
        `${this.name} からメッセージを送れません. new RPGObject(Skin.${this.name}) を rule.つくる('${this.name}') に書きかえてください`
      );
    }
    const { x, y } = this.forward;
    const appended = _ruleInstance.create(
      name,
      this.mapX + forward * x - right * y,
      this.mapY + forward * y + right * x,
      opt(map, this.map ? this.map.name : undefined),
      opt(dir, () => Vector2.from(this.forward)),
      this
    );
    registerServant(this, appended); // 自分と同じ Family を持つ従者とする
    return appended;
  }

  /**
   * 「しょうかんする」の足元バージョン
   */
  public おとす(name: string) {
    return this.しょうかんする(name, 0, 0);
  }

  private static _initializedReference: RPGObject;
  public transform(name: string) {
    const { _ruleInstance, _hp } = this;
    if (!_ruleInstance) return;

    // 初期値を参照するためのインスタンスを作る
    RPGObject._initializedReference =
      RPGObject._initializedReference || new RPGObject();

    // 一部のパラメータを初期値に戻す
    for (const key of RPGObject.propNamesToInit) {
      this[key] = RPGObject._initializedReference[key];
    }

    _ruleInstance.installAsset(name);
    _ruleInstance.unregisterRules(this.proxy);
    _ruleInstance.registerRules(this.proxy, name);
    if (_hp !== undefined) {
      this.hp = _hp; // https://bit.ly/2P37rph
    }
  }

  private getNearestByName(name: string) {
    const { _ruleInstance } = this;
    if (!_ruleInstance) return null;
    return this.getNearest(_ruleInstance.getCollection(name));
  }

  private getNearest(collection: RPGObject[]): RPGObject | null {
    let nearestObject: RPGObject | null = null;
    let nearestDistance = Infinity;
    for (const item of collection) {
      if (!item.parentNode || !item.scene) continue; // マップ上に存在しないオブジェクトはのぞく
      if (item.map !== this.map) continue; // 違うマップにいる場合はのぞく
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
   * 相手のキャラクターの方を振り向く
   * @param target 相手キャラクターの変数または名前
   */
  public faceTo(target: RPGObject | string) {
    const item =
      typeof target === 'string' ? this.getNearestByName(target) : target;

    if (!item || this.map !== item.map) return; // 違うマップなら振り向かない
    const dx = Math.abs(item.mapX - this.mapX);
    const dy = Math.abs(item.mapY - this.mapY);
    this.direction =
      dx >= dy
        ? item.mapX > this.mapX
          ? Direction.Right
          : Direction.Left
        : item.mapY > this.mapY
        ? Direction.Down
        : Direction.Up;
  }

  private chaseSameMap(item: RPGObject, unit8: boolean) {
    if (this.map !== item.map) return; // 違うマップなら追わない
    const dx = item.mapX - this.mapX;
    const dy = item.mapY - this.mapY;
    const farXthanY = Math.abs(dx) - Math.abs(dy);
    const prioritizeX =
      farXthanY > 0
        ? true // X の方が Y より遠いなら X 優先
        : farXthanY < 0
        ? false // Y の方が X より遠いなら Y 優先
        : Math.random() < -0.5; // 同じならランダム

    const movements = unit8 ? [new Vector2(dx, dy)] : []; // ナナメありか
    movements.push(new Vector2(dx, 0));
    movements.push(new Vector2(0, dy));

    return this.mayWalkTo(movements, unit8, prioritizeX);
  }

  /**
   * 指定されたアセットのインスタンスのうち一つを追う
   * いない場合は何もしない
   * @param {String} nameOrTarget
   */
  public async chase(nameOrTarget: string | RPGObject, unit8 = false) {
    const item =
      typeof nameOrTarget === 'string'
        ? this.getNearestByName(nameOrTarget)
        : nameOrTarget;
    if (!item || !item.parentNode) return;

    if (!followingPlayerObjects.has(this)) {
      if (item.family === this.family && item.isPlayer) {
        // 追いかけている相手が仲間のプレイヤーであれば、参照を保持する
        followingPlayerObjects.add(this);
      }
    }

    // 相手のいるマスへ１歩すすむ
    return this.chaseSameMap(item, unit8);
  }

  public chase4(nameOrTarget: string | RPGObject) {
    return this.chase(nameOrTarget, false);
  }

  public chase8(nameOrTarget: string | RPGObject) {
    return this.chase(nameOrTarget, true);
  }

  /**
   * 指定された候補（移動量）が移動可能か調べ, 可能なら移動する
   * @param movements 移動量の候補
   * @param prioritizeX X の移動を優先する
   */
  private async mayWalkTo(
    movements: Vector2[],
    unit8 = false,
    prioritizeX = false
  ) {
    movements = movements.filter(vec => vec.x !== 0 || vec.y !== 0);
    // 優先されている方の差が大きい順
    movements.sort((a, b) =>
      prioritizeX
        ? Math.abs(b.x) - Math.abs(a.x)
        : Math.abs(b.y) - Math.abs(a.y)
    );
    // ちゃんと歩けるところ探す
    for (const forward of movements) {
      const unit = unit8 ? forward.unit8() : forward.unit();
      if (this.canWalk(unit)) {
        this.forward = unit;
        await this.walk();
        return;
      }
    }
    // 歩こうとする（ぶつかる） 0.24~ 仕様変更
    const [first] = movements;
    if (first) {
      this.forward = first;
      await this.walk();
    }
  }

  private _costume = '';
  public async costume(name: string) {
    if (this._costume === name) return; // 同じ見た目なのでスルー
    this._costume = name;
    try {
      const currentSkin: SkinCachedItem | null = getSkin(name);
      if (!currentSkin) return;
      const dress = await currentSkin;
      if (this._costume !== name) return; // 読み込み中に見た目が変わった
      this.applySkin(dress);
    } catch (error) {
      const message = [
        this ? `${this.name} の` : '',
        `みためを '${name}' という なまえにしてしまったみたい`
      ].join(' ');
      log('error', message, this.name ? `modules/${this.name}.js` : 'Unknown');

      // スキンの名前を間違えたことが分かるようにする
      this.image = initSurface(32, 32, undefined, '#fff');
      const context: CanvasRenderingContext2D = this.image.context;
      context.fillStyle = '#000';
      context.fillText(name, 0, 16, 32);
      this.width = 32;
      this.height = 32;
    }
  }

  private applySkin = ((f: (object: RPGObject) => void) => {
    f(this); // スキンを適用
    // 現在の behavior に応じた frame をセットする.
    // もし frame が存在しなければ(e.g. frame=[]), init を適用する
    this.computeFrame(this.direction, BehaviorTypes.Init);
    this.computeFrame(); // なければスキップされる -> init が適用される
    this.rotateIfNeeded();
    return f;
  }).bind(this);

  public flyToward(target?: RPGObject | string) {
    const { _ruleInstance } = this;
    if (!_ruleInstance) return;
    const targetObject =
      typeof target === 'string'
        ? this.getNearest(_ruleInstance.getCollection(target))
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
  private async findImpl(filter?: (item: RPGObject) => boolean) {
    if (!Hack.isPlaying) return; // ゲームが終了している
    if (this.behavior !== BehaviorTypes.Idle) return;
    if (this._isJustBeingFound) return; // 同フレーム内でみつけたときがコールされたばかり
    const { _ruleInstance } = this;
    if (!_ruleInstance) return;
    const sight = Vector2.from(this.forward).unit().scale(this.lengthOfView); // 視線に対して平行な単位ベクトル
    const right = sight.rotateDegree(90).unit().scale(this.fieldOfView); // 視線に対して右手方向 (X軸とは限らない) の単位ベクトル
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
          item !== this &&
          item.map === this.map && // 同じマップにいる場合のみ見つけられる
          rangeOfView.left <= item.mapX &&
          item.mapX <= rangeOfView.right &&
          rangeOfView.top <= item.mapY &&
          item.mapY <= rangeOfView.bottom
      )
      .filter(item =>
        _ruleInstance.hasTwoObjectListenerWith('みつけたとき', this, item)
      );
    const found = this.getNearest(
      filter ? foundable.filter(filter) : foundable
    );
    if (found) {
      this._isJustBeingFound = true; // このフレームでは find() をスキップ
      const p = _ruleInstance.runTwoObjectListener('みつけたとき', this, found);
      this._isJustBeingFound = false; // スキップタイム終了
      await p; // await this.find() でみつけたときをループできるよう, 終了を待つ
    }
  }

  public async find() {
    return this.findImpl();
  }

  /**
   * 敵とみなされるキャラクターに限定した find()
   */
  public async findEnemy() {
    return this.findImpl(item => this.isEnemy(item));
  }

  public toJSON() {
    return {
      name: this.name
    };
  }

  public se(name: string) {
    return soundEffect(name);
  }

  public async talk(text: string, ...choices: string[]) {
    return talk(text, ...choices);
  }

  public async speak(text: string) {
    const utterThis = new SpeechSynthesisUtterance(text);
    return new Promise((resolve, reject) => {
      utterThis.addEventListener('end', () => {
        resolve();
      });
      utterThis.addEventListener('error', e => {
        reject(e);
      });
      speechSynthesis.speak(utterThis);
    });
  }

  /**
   * このインスタンスの名前が与えられた名前と一致するかどうかを調べる
   * @param name アセットの名前
   */
  public is(name: string) {
    return this.name === name;
  }

  /**
   * 相手のキャラクターが敵かどうかを調べる
   * @param item 相手のキャラクター
   */
  public isEnemy(item: RPGObject) {
    return isOpposite(this, item) && item.hp > 0;
  }

  private cancelPreviousThink = () => {};
  /**
   * キャラクターの頭の上に感情や状態を表す記号を表示する
   * @param name 感情を表す記号. "!" や "?" など
   */
  public think(name: string) {
    this.cancelPreviousThink();
    return new Promise(resolve => {
      this.cancelPreviousThink = showThinkSprite(name, this, resolve);
    });
  }

  /**
   * 互換性保持のため
   */
  public set dir(dir: Dir.IDir) {
    logToDeprecated('this.dir = Dir.(...)');
    this.forward = dir(this);
  }

  /**
   * https://github.com/hackforplay/common/issues/84
   * enchant.js のイベントハンドラはコール時に this を bind してしまうため
   * this が Proxy ではなく RPGObject になってしまう。
   * それではコレクション配列に保持されているオブジェクトの参照と一致しないため
   * 例えば remove() などのメソッドが動かなくなる。
   * そこで、 Proxy を bind すべきメソッドをさらに bind するために、
   * 元の参照から Proxy オブジェクトの参照を得る（WeakMap を使う）。
   * ただし Proxy オブジェクトかどうかを判定する術はないので、
   * 取得できなかったとしても、それを知ることは出来ない
   */
  public get proxy(): RPGObject {
    return proxyMap.get(this) || this;
  }

  public [PropertyMissing](chainedName: string) {
    const message = `${this.name} の「${chainedName}」はないみたい`;
    log('error', message, '@hackforplay/common');
  }
}

export const RPGObjectWithSynonym = synonymizeClass(RPGObject, synonyms);

function makeHpLabel(self: RPGObject) {
  const label = new (enchant as any).ui.ScoreLabel();
  label.label = 'HP:';
  label.opacity = 0;
  self.parentNode.addChild(label);
  self.on('enterframe', () => {
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
