import { IDir } from './dir';
import { hasContract, isOpposite } from './family';
import { install } from './feeles';
import { getHack } from './get-hack';
import RPGObject, { RPGObjectWithSynonym } from './object/object';
import { errorInEvent, errorRemoved, logFromAsset } from './stdlog';
import talk from './talk';

interface IEvent {
  target: RPGObject;
  item: RPGObject;
}
interface ICollidedEvent extends IEvent {
  map: boolean;
  hits: RPGObject[];
}

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

export default class Rule {
  public static readonly Anyone = Anyone;
  public static readonly Enemy = Enemy;

  // public vars
  public get this(): string | null {
    return window.__sandbox_context_name || this._this; // 互換性保持のため
  }
  public set this(value: string | null) {
    errorRemoved('rule.this');
  }
  private _this: string | null = null;
  private readonly _knownThisNames: Set<string> = new Set();
  public item: string | typeof Enemy | typeof Anyone | null = null;
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
      await handleError(type, name, specify.call(object)); // エラーハンドリング
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
    let item = this.item;
    if (!item) {
      errorInEvent('rule.item がない', { name }, type);
      item = Anyone;
    }
    const container =
      this._listenersOfTwo[type] || (this._listenersOfTwo[type] = {});
    const listeners = container[name] || (container[name] = {});
    if (listeners[name]) {
      errorInEvent('上書きしてしまう', { name }, type);
    }
    listeners[item] = func;
    this._knownThisNames.add(name);
    this.item = null;
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
      await handleError(type, name, specify.call(object, item));
    }
    const enemy = listeners[Enemy];
    if (enemy && isOpposite(item, object) && item.hp > 0) {
      // 自分の敵なら
      await handleError(type, name, enemy.call(object, item));
    }
    const anyone = listeners[Anyone];
    if (anyone) {
      // 誰でも良い
      await handleError(type, name, anyone.call(object, item));
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
    collections.push(object);
  }

  private removeFromCollection(object: RPGObject) {
    const collections = this._collections[object.name];
    if (!collections) return;
    const index = collections.indexOf(object);
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
      this.runTwoObjectListener('メッセージされたとき', item, sender);
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
   * 「つねに」を再帰的にコールするラッパー
   * @param object RPGObject
   * @param name string このアセットとして実行する (へんしんしたらストップしたい)
   */
  public runつねに(object: RPGObject, name: string) {
    if (!Hack.isPlaying) return; // ゲームが終了した
    if (object.name !== name) return; // へんしんしたので終了
    // TODO: パフォーマンスが悪化しそうなので改善する
    requestAnimationFrame(() => {
      if (Hack.world._stop || object._stop || !object.parentNode) {
        return this.runつねに(object, name);
      }
      this.runOneObjectLisener('つねに', object).then(() =>
        this.runつねに(object, name)
      );
    });
  }

  public async runゲームがはじまったとき() {
    this.startTimer(); // 自動的にタイマーをスタートさせる
    await this.runNoObjectListener('ゲームがはじまったとき');
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
        this.runOneObjectLisener('じかんがすすんだとき', item);
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
      Promise.all(pendings).then(() => this.runつねに(object, name));
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
    object.name = ''; // つねに() を終了させる
    object.removeEventListener('becomeattack', this.onこうげきするとき);
    object.removeEventListener('becomedead', this.onたおされたとき);
    object.removeEventListener('addtrodden', this.onふまれたとき);
    object.removeEventListener('triggerenter', this.onぶつかったとき);
    object.removeEventListener('collided', this.onすすめなかったとき);
    object.removeEventListener('attacked', this.onこうげきされたとき);
    this.removeFromCollection(object);
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
  public つくる(
    name: string,
    x?: number,
    y?: number,
    map?: string,
    dir?: IDir,
    summoner?: RPGObject
  ) {
    this.installAsset(name);

    const object = new RPGObjectWithSynonym();
    object._ruleInstance = this;
    if (dir) {
      object.forward = dir(object);
    }
    if (x !== undefined && y !== undefined) {
      object.locate(x, y, map);
    }

    this.registerRules(object, name, summoner);
    this.tryPairing(object);

    logFromAsset(
      object,
      `${name} が (${object.mapX}, ${object.mapY}, '${object.map &&
        object.map.name}') にあらわれた`
    );

    return object;
  }

  private onこうげきするとき = ((e: IEvent) => {
    this.runOneObjectLisener('こうげきするとき', e.target);
  }).bind(this);
  private onたおされたとき = ((e: IEvent) => {
    this.runOneObjectLisener('たおされたとき', e.target);
  }).bind(this);
  private onタップされたとき = ((e: IEvent) => {
    this.runOneObjectLisener('タップされたとき', e.target);
  }).bind(this);
  private onすすめなかったとき = ((e: ICollidedEvent) => {
    if (e.map || e.hits.length === 0) {
      // マップの枠か、cmapとぶつかった => 相手のいない衝突
      this.runOneObjectLisener('すすめなかったとき', e.target);
    } else {
      // 何かとぶつかった
      this.runTwoObjectListener('ぶつかったとき', e.target, e.item);
    }
  }).bind(this);
  private onふまれたとき = ((e: IEvent) => {
    this.runTwoObjectListener('ふまれたとき', e.target, e.item);
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

  public ゲームがはじまったとき(func: NoObjectListener) {
    this.addNoObjectListener('ゲームがはじまったとき', func);
  }
  public つくられたとき(func: OneObjectListener) {
    this.addOneObjectLisener('つくられたとき', func);
  }
  public つねに(func: OneObjectListener) {
    this.addOneObjectLisener('つねに', func);
  }
  public こうげきするとき(func: OneObjectListener) {
    this.addOneObjectLisener('こうげきするとき', func);
  }
  public たおされたとき(func: OneObjectListener) {
    this.addOneObjectLisener('たおされたとき', func);
  }
  public すすめなかったとき(func: OneObjectListener) {
    this.addOneObjectLisener('すすめなかったとき', func);
  }
  public おかねがかわったとき(func: OneObjectListener) {
    this.addOneObjectLisener('おかねがかわったとき', func);
  }
  public じかんがすすんだとき(func: OneObjectListener) {
    this.addOneObjectLisener('じかんがすすんだとき', func);
  }
  public タップされたとき(func: OneObjectListener) {
    this.addOneObjectLisener('タップされたとき', func);
  }
  public ふまれたとき(func: TwoObjectListener) {
    this.addTwoObjectListener('ふまれたとき', func);
  }
  public ぶつかったとき(func: TwoObjectListener) {
    this.addTwoObjectListener('ぶつかったとき', func);
  }
  public こうげきされたとき(func: TwoObjectListener) {
    this.addTwoObjectListener('こうげきされたとき', func);
  }
  public メッセージされたとき(func: TwoObjectListener) {
    this.addTwoObjectListener('メッセージされたとき', func);
  }
  public しょうかんされたとき(func: TwoObjectListener) {
    this.addTwoObjectListener('しょうかんされたとき', func);
  }
  public みつけたとき(func: TwoObjectListener) {
    this.addTwoObjectListener('みつけたとき', func);
  }
}
