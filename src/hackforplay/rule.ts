import { log } from '@hackforplay/log';
import { IDir } from './dir';
import { Direction } from './direction';
import { hasContract, isOpposite } from './family';
import { install } from './feeles';
import { getHack } from './get-hack';
import { emitGlobalsChangedIfNeeded } from './globals';
import RPGObject from './object/object';
import { errorInEvent, logFromAsset } from './stdlog';
import { synonyms } from './synonyms/rule';
import { PropertyMissing, synonymizeClass } from './synonyms/synonymize';
import talk from './talk';
import { loadMaps } from './load-maps';

interface IEvent {
  target: RPGObject;
  item: RPGObject;
}
interface ICollidedEvent extends IEvent {
  map: boolean;
  hits: RPGObject[];
}

type E<T extends string, Args> = {
  eventName: T;
  args: Args;
  callback?: () => void;
};

type EventType =
  | E<'つくられたとき', [RPGObject]>
  | E<'つねに', [RPGObject]>
  | E<'こうげきするとき', [RPGObject]>
  | E<'たおされたとき', [RPGObject]>
  | E<'すすめなかったとき', [RPGObject]>
  | E<'おかねがかわったとき', [RPGObject]>
  | E<'じかんがすすんだとき', [RPGObject]>
  | E<'タップされたとき', [RPGObject]>
  | E<'マップがかわったとき', [RPGObject]>
  | E<'あるいたとき', [RPGObject]>
  | E<'へんすうがかわったとき', [RPGObject]>
  | E<'ふまれたとき', [RPGObject, RPGObject]>
  | E<'どかれたとき', [RPGObject, RPGObject]>
  | E<'ぶつかったとき', [RPGObject, RPGObject]>
  | E<'こうげきされたとき', [RPGObject, RPGObject]>
  | E<'メッセージされたとき', [RPGObject, RPGObject]>
  | E<'しょうかんされたとき', [RPGObject, RPGObject]>
  | E<'みつけたとき', [RPGObject, RPGObject]>;

const Hack = getHack();

function handleError(
  title: string,
  name: string,
  promiseLike?: Promise<void>
): Promise<void> {
  if (promiseLike && promiseLike instanceof Promise) {
    return promiseLike.catch(error => errorInEvent(error, { name }, title));
  }
  return Promise.resolve();
}

const Anyone: unique symbol = Symbol('Rule.Anyone');
const Enemy: unique symbol = Symbol('Rule.Enemy');

type NoObjectListener = (this: void) => Promise<void>;
type OneObjectListener = (this: RPGObject) => Promise<void>;
type TwoObjectListener = (this: RPGObject, item: RPGObject) => Promise<void>;

export class Rule {
  /**
   * @deprecated
   */
  public static readonly Anyone = Anyone;
  /**
   * @deprecated
   */
  public static readonly Enemy = Enemy;

  public get this(): string | null {
    return window.__sandbox_context_name;
  }
  private readonly _knownThisNames: Set<string> = new Set();
  // listeners
  private readonly _listenersOfNo: {
    [type: string]: NoObjectListener;
  } = {};
  private readonly _listenersOfOne: {
    [type: string]: {
      [name: string]: OneObjectListener;
    };
  } = {};
  private readonly _listenersOfTwo: {
    [type: string]: {
      [name: string]: {
        [item: string]: TwoObjectListener;
        [Enemy]?: TwoObjectListener;
        [Anyone]?: TwoObjectListener;
      };
    };
  } = {};
  private readonly _collections: {
    [type: string]: RPGObject[];
  } = {};

  private readonly _pairingWaitList: { [key: string]: RPGObject } = {};

  public addNoObjectListener(type: string, func: NoObjectListener) {
    if (this._listenersOfNo[type]) {
      errorInEvent('上書きしてしまう', { name }, type);
    }
    this._listenersOfNo[type] = func;
  }

  public async runNoObjectListener(type: string) {
    if (this._listenersOfNo[type]) {
      await handleError(type, '', this._listenersOfNo[type]());
    }
  }

  public addOneObjectLisener(type: string, func: OneObjectListener) {
    const name = this.this;
    if (!name) {
      errorInEvent(
        'Context not found',
        undefined,
        `addOneObjectListener('${type}')`
      );
      return;
    }
    const listeners =
      this._listenersOfOne[type] || (this._listenersOfOne[type] = {});
    if (listeners[name]) {
      errorInEvent('上書きしてしまう', { name }, type);
    }
    listeners[name] = func;
    this._knownThisNames.add(name);
  }

  public async runOneObjectLisener(type: string, object: RPGObject) {
    const name: string = object.name || '';
    const listeners = this._listenersOfOne[type];
    if (!listeners) return;
    const specify = listeners[name];
    if (specify) {
      await handleError(type, name, specify.call(object.proxy)); // エラーハンドリング
    }
  }

  public addTwoObjectListener(type: string, func: TwoObjectListener) {
    const name = this.this;
    if (!name) {
      errorInEvent(
        'Context not found',
        undefined,
        `addTwoObjectListener('${type}')`
      );
      return;
    }
    const container =
      this._listenersOfTwo[type] || (this._listenersOfTwo[type] = {});
    const listeners = container[name] || (container[name] = {});
    if (listeners[name]) {
      errorInEvent('上書きしてしまう', { name }, type);
    }
    listeners[Anyone] = func; // 後方互換性のため
    this._knownThisNames.add(name);
  }

  public async runTwoObjectListener(
    type: string,
    object: RPGObject,
    item: RPGObject
  ) {
    const name: string = object.name || '';
    const itemName: string = item.name || '';
    const container = this._listenersOfTwo[type];
    if (!container) return;
    const listeners = container[name];
    if (!listeners) return;
    // 条件によって複数のルールが定義できる場合, 詳細度が細かいものから順に実行される
    const specify = listeners[itemName];
    if (specify) {
      // 特定のアセットにだけ作用
      await handleError(type, name, specify.call(object.proxy, item.proxy));
    }
    const enemy = listeners[Enemy];
    if (enemy && isOpposite(item, object) && item.hp > 0) {
      // 自分の敵なら
      await handleError(type, name, enemy.call(object.proxy, item.proxy));
    }
    const anyone = listeners[Anyone];
    if (anyone) {
      // 誰でも良い
      await handleError(type, name, anyone.call(object.proxy, item.proxy));
    }
  }

  /**
   * そのルールが登録されているかを調べる
   * @param type
   * @param name アセットの名前
   */
  public hasListener(type: string, name?: string) {
    if (this.hasNoObjectListener(type)) return true;
    if (!name) return false;
    return (
      this.hasOneObjectLisener(type, name) ||
      this.hasTwoObjectListener(type, name)
    );
  }

  public hasNoObjectListener(type: string) {
    return Boolean(this._listenersOfNo[type]);
  }

  public hasOneObjectLisener(type: string, name: string) {
    const listeners = this._listenersOfOne[type];
    if (!listeners) return false;
    return Boolean(listeners[name]);
  }

  public hasTwoObjectListener(type: string, name: string) {
    const container = this._listenersOfTwo[type];
    if (!container) return false;
    return Boolean(container[name]);
  }

  public hasTwoObjectListenerWith(
    type: string,
    self: RPGObject,
    item: RPGObject
  ) {
    const container = this._listenersOfTwo[type];
    if (!container) return false;
    const listeners = container[self.name];
    if (!listeners) return false;
    return (
      Boolean(listeners[Anyone]) ||
      (Boolean(listeners[Enemy]) && item.hp > 0 && isOpposite(self, item)) ||
      item.name in listeners
    );
  }

  public getCollection(name: string) {
    if (!this._collections[name]) {
      return [];
    }
    return [...this._collections[name]];
  }

  private addToCollection(object: RPGObject) {
    const collections =
      this._collections[object.name] || (this._collections[object.name] = []);
    collections.push(object.reverseProxy);
  }

  private removeFromCollection(object: RPGObject) {
    const collections = this._collections[object.name];
    if (!collections) return;
    const index = collections.indexOf(object.reverseProxy);
    if (index < 0) return;
    collections.splice(index, 1);
  }

  /**
   * あるアセットに向けてメッセージをおくる.
   * メッセージされたとき ルールが実行される
   * @param sender
   * @param name
   */
  public message(sender: RPGObject, name: string) {
    const collections = this._collections[name];
    if (!collections) return;
    for (const item of collections) {
      this.scheduleEventEmit({
        eventName: 'メッセージされたとき',
        args: [item, sender]
      });
    }
  }

  /**
   * ペアが空いていれば RPGObject.pairedObject に設定する
   * @param object
   */
  private tryPairing(object: RPGObject) {
    const waiting = this._pairingWaitList[object.name];
    if (!waiting || object === waiting) {
      this._pairingWaitList[object.name] = object; // 次のオブジェクトとペアリング
      return;
    }
    // 互いに参照を持つ
    object.pairedObject = waiting;
    waiting.pairedObject = object;
    delete this._pairingWaitList[object.name]; // ペアリング完了
  }

  /**
   * つねに をコールするフラグ
   * 初期値は undefined で、つねに をコールしない
   * つねに がコールされたら false にして、 resolve したら true に戻す
   */
  private enabledUpdate = new WeakMap<RPGObject, boolean>();

  public startUpdate(object: RPGObject) {
    this.enabledUpdate.set(object.reverseProxy, true);
  }

  /**
   * このゲームのメインループ（にしたいもの）
   */
  private mainLoop() {
    if (!Hack.isPlaying) return; // ゲームが終了した

    // つねに をコールする
    // this._collections を使うべきか？（へんしんしたときちゃんと動くか？）
    for (const object of Array.from(RPGObject.collection)) {
      if (!this.enabledUpdate.get(object)) {
        continue; // まだ途中になっているものがある => スキップ
      }
      this.enabledUpdate.set(object, false); // 終わるまで次のコールを pending

      this.runOneObjectLisener('つねに', object).then(() => {
        this.enabledUpdate.set(object, true);
      });
    }

    // へんすうがかわったとき をコールする
    emitGlobalsChangedIfNeeded(() => {
      for (const object of Array.from(RPGObject.collection)) {
        this.runOneObjectLisener('へんすうがかわったとき', object);
      }
    });

    // 予約されたイベントを発火させて、要素を空にする
    const events = Array.from(this.scheduledEvents);
    this.scheduledEvents = [];
    for (const { args, callback, eventName } of events) {
      let p: Promise<void> | void;
      if (args.length === 1) {
        p = this.runOneObjectLisener(eventName, args[0].proxy);
      } else if (args.length === 2) {
        p = this.runTwoObjectListener(eventName, args[0].proxy, args[1].proxy);
      }
      if (callback && p) {
        p.then(callback);
      }
    }

    // 次のループを準備
    requestAnimationFrame(() => {
      this.mainLoop();
    });
  }

  public async runゲームがはじまったとき() {
    this.startTimer(); // 自動的にタイマーをスタートさせる
    await loadMaps(Hack.mapJsonFile); // Hack.mapJsonFile は通常 undefined
    await this.runNoObjectListener('ゲームがはじまったとき');
    this.mainLoop();
  }

  private previousNow = 0;
  private elapsedTimeCounter = 0; // 0-999 number
  private isTimerEnabled = false;
  private timerId = 0;
  private progressTime: FrameRequestCallback = ((time: number) => {
    if (!this.isTimerEnabled) return;
    const elapsed = time - this.previousNow;
    this.previousNow = time;
    this.timerId = requestAnimationFrame(this.progressTime);

    if (Hack.world._stop || !Hack.isPlaying) return;
    this.elapsedTimeCounter += Math.min(elapsed, 100); // ブラウザタブが離れた時のために, 1frame < 100ms 以内に詰める
    if (this.elapsedTimeCounter >= 1000) {
      this.runじかんがすすんだとき();
      this.elapsedTimeCounter -= 1000;
    }
  }).bind(this);

  private runじかんがすすんだとき() {
    Hack.time++;
    const listeners = this._listenersOfOne['じかんがすすんだとき'];
    if (!listeners) return;
    for (const name of Object.keys(listeners)) {
      for (const item of this.getCollection(name)) {
        this.scheduleEventEmit({
          eventName: 'じかんがすすんだとき',
          args: [item]
        });
      }
    }
  }

  public startTimer() {
    if (this.isTimerEnabled) return;
    this.isTimerEnabled = true;
    this.previousNow = performance.now();
    this.timerId = requestAnimationFrame(this.progressTime);
  }

  public stopTimer() {
    this.isTimerEnabled = false;
    cancelAnimationFrame(this.timerId);
  }

  public registerRules(object: RPGObject, name: string, summoner?: RPGObject) {
    object.name = name;
    const pendings = [];
    if (this.hasOneObjectLisener('つくられたとき', name)) {
      const p = this.runOneObjectLisener('つくられたとき', object);
      pendings.push(p);
    }
    if (summoner && this.hasTwoObjectListener('しょうかんされたとき', name)) {
      const p = this.runTwoObjectListener(
        'しょうかんされたとき',
        object,
        summoner
      );
      pendings.push(p);
    }
    if (this.hasOneObjectLisener('つねに', name)) {
      Promise.all(pendings).then(() => this.startUpdate(object));
    }
    if (this.hasOneObjectLisener('こうげきするとき', name)) {
      object.on('becomeattack', this.onこうげきするとき);
    }
    if (this.hasOneObjectLisener('たおされたとき', name)) {
      object.on('becomedead', this.onたおされたとき);
    }
    if (this.hasOneObjectLisener('タップされたとき', name)) {
      object.on('touchend', this.onタップされたとき);
    }
    if (this.hasTwoObjectListener('ふまれたとき', name)) {
      object.on('addtrodden', this.onふまれたとき);
    }
    if (this.hasTwoObjectListener('どかれたとき', name)) {
      object.on('removetrodden', this.onどかれたとき);
    }
    if (this.hasTwoObjectListener('ぶつかったとき', name)) {
      object.on('triggerenter', this.onぶつかったとき);
    }
    if (
      this.hasOneObjectLisener('すすめなかったとき', name) ||
      this.hasTwoObjectListener('ぶつかったとき', name)
    ) {
      object.on('collided', this.onすすめなかったとき);
    }
    if (this.hasTwoObjectListener('こうげきされたとき', name)) {
      object.on('attacked', this.onこうげきされたとき);
    }
    this.addToCollection(object);
  }

  public unregisterRules(object: RPGObject) {
    object.removeEventListener('becomeattack', this.onこうげきするとき);
    object.removeEventListener('becomedead', this.onたおされたとき);
    object.removeEventListener('addtrodden', this.onふまれたとき);
    object.removeEventListener('removetrodden', this.onどかれたとき);
    object.removeEventListener('triggerenter', this.onぶつかったとき);
    object.removeEventListener('collided', this.onすすめなかったとき);
    object.removeEventListener('attacked', this.onこうげきされたとき);
    this.removeFromCollection(object);
    object.name = ''; // つねに() を終了させる
  }

  public installAsset(name: string) {
    if (!this._knownThisNames.has(name)) {
      talk(
        `${name} というアセットは ないかもしれない`,
        'インストールする',
        '今はいい'
      ).then(answer => {
        if (answer === 'インストールする') {
          install && install(name);
        }
      });
    }
  }

  // 実際にコールする関数
  public create(
    name: string,
    x?: number,
    y?: number,
    map?: string,
    dir?: IDir | Direction,
    summoner?: RPGObject
  ) {
    this.installAsset(name);

    const object = new RPGObject();
    object._ruleInstance = this;
    if (typeof dir === 'function') {
      object.forward = dir(object);
    } else if (dir) {
      object.direction = dir;
    }
    if (x !== undefined && y !== undefined) {
      object.locate(x, y, map);
    }

    this.registerRules(object, name, summoner);
    this.tryPairing(object);

    logFromAsset(
      object,
      `${name} が (${object.mapX}, ${object.mapY}, '${
        object.map && object.map.name
      }') にあらわれた`
    );

    return object.proxy;
  }

  private onこうげきするとき = ((e: IEvent) => {
    this.scheduleEventEmit({
      eventName: 'こうげきするとき',
      args: [e.target]
    });
  }).bind(this);
  private onたおされたとき = ((e: IEvent) => {
    this.scheduleEventEmit({
      eventName: 'たおされたとき',
      args: [e.target]
    });
  }).bind(this);
  private onタップされたとき = ((e: IEvent) => {
    this.scheduleEventEmit({
      eventName: 'タップされたとき',
      args: [e.target]
    });
  }).bind(this);
  private onすすめなかったとき = ((e: ICollidedEvent) => {
    if (e.map || e.hits.length === 0) {
      // マップの枠か、cmapとぶつかった => 相手のいない衝突
      this.scheduleEventEmit({
        eventName: 'すすめなかったとき',
        args: [e.target]
      });
    } else {
      // 何かとぶつかった
      this.scheduleEventEmit({
        eventName: 'ぶつかったとき',
        args: [e.target, e.item]
      });
    }
  }).bind(this);
  private onふまれたとき = ((e: IEvent) => {
    this.scheduleEventEmit({
      eventName: 'ふまれたとき',
      args: [e.target, e.item]
    });
  }).bind(this);
  private onどかれたとき = ((e: IEvent) => {
    this.scheduleEventEmit({
      eventName: 'どかれたとき',
      args: [e.target, e.item]
    });
  }).bind(this);
  private onぶつかったとき = ((e: IEvent) => {
    if (e && e.item) {
      const { collisionFlag } = e.item;
      if (collisionFlag && !hasContract(e.target, e.item)) {
        // item が障害物で、かつ互いに「しょうかんされた」ものではないとき
        this.runTwoObjectListener('ぶつかったとき', e.target, e.item);
      }
    }
  }).bind(this);
  private onこうげきされたとき = ((e: IEvent) => {
    this.runTwoObjectListener('こうげきされたとき', e.target, e.item);
  }).bind(this);

  public gameStarted(func: NoObjectListener) {
    this.addNoObjectListener('ゲームがはじまったとき', func);
  }
  public created(func: OneObjectListener) {
    this.addOneObjectLisener('つくられたとき', func);
  }
  public updated(func: OneObjectListener) {
    this.addOneObjectLisener('つねに', func);
  }
  public attacked(func: OneObjectListener) {
    this.addOneObjectLisener('こうげきするとき', func);
  }
  public defeated(func: OneObjectListener) {
    this.addOneObjectLisener('たおされたとき', func);
  }
  public canNotWalk(func: OneObjectListener) {
    this.addOneObjectLisener('すすめなかったとき', func);
  }
  public moneyChanged(func: OneObjectListener) {
    this.addOneObjectLisener('おかねがかわったとき', func);
  }
  public timePassed(func: OneObjectListener) {
    this.addOneObjectLisener('じかんがすすんだとき', func);
  }
  public tapped(func: OneObjectListener) {
    this.addOneObjectLisener('タップされたとき', func);
  }
  public mapChanged(func: OneObjectListener) {
    this.addOneObjectLisener('マップがかわったとき', func);
  }
  public walked(func: OneObjectListener) {
    this.addOneObjectLisener('あるいたとき', func);
  }
  public globalsChanged(func: OneObjectListener) {
    this.addOneObjectLisener('へんすうがかわったとき', func);
  }
  public trodden(func: TwoObjectListener) {
    this.addTwoObjectListener('ふまれたとき', func);
  }
  public removeTrodden(func: TwoObjectListener) {
    this.addTwoObjectListener('どかれたとき', func);
  }
  public collided(func: TwoObjectListener) {
    this.addTwoObjectListener('ぶつかったとき', func);
  }
  public beAttacked(func: TwoObjectListener) {
    this.addTwoObjectListener('こうげきされたとき', func);
  }
  public messaged(func: TwoObjectListener) {
    this.addTwoObjectListener('メッセージされたとき', func);
  }
  public summoned(func: TwoObjectListener) {
    this.addTwoObjectListener('しょうかんされたとき', func);
  }
  public found(func: TwoObjectListener) {
    this.addTwoObjectListener('みつけたとき', func);
  }

  /**
   * このループの最後にイベントを実行させる
   * RPGObject は自動的に proxy に変換される
   */
  public scheduleEventEmit(event: EventType) {
    this.scheduledEvents.push(event);
  }
  private scheduledEvents: EventType[] = [];

  public [PropertyMissing](chainedName: string) {
    const message = `トリガーに「${chainedName}」はないみたい`;
    log('error', message, '@hackforplay/common');
  }
}

export default synonymizeClass(Rule, synonyms);
