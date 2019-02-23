import RPGObject from './object/object';
import { hasContract, isOpposite } from './family';
import { default as Hack } from './hack';
import { IDir } from './dir';

interface IEvent {
  target: RPGObject;
  item: RPGObject;
}
interface ICollidedEvent extends IEvent {
  map: boolean;
  hits: RPGObject[];
}

function throwError(error: Error) {
  return (window as any).feeles.throwError.apply(null, arguments);
}

function handleError(
  title: string,
  name: string,
  promiseLike?: Promise<void>
): Promise<void> {
  if (promiseLike && promiseLike instanceof Promise) {
    return promiseLike.catch(error => {
      console.error(error);
      console.error(`above error was occured in "${name}" when "${title}"`);
      throwError(error);
    });
  }
  return Promise.resolve();
}

const Anyone: unique symbol = Symbol('Rule.Anyone');
const Enemy: unique symbol = Symbol('Rule.Enemy');

type NoObjectListener = (this: void) => Promise<void>;
type OneObjectListener = (this: RPGObject) => Promise<void>;
type TwoObjectListener = (this: RPGObject, item: RPGObject) => Promise<void>;

const feeles = (window as any).feeles || {};

export default class Rule {
  public static readonly Anyone = Anyone;
  public static readonly Enemy = Enemy;

  // public vars
  public get this(): string | null {
    return this._this;
  }
  public set this(value: string | null) {
    if (value && this._knownThisNames.indexOf(value) < 0) {
      this._knownThisNames.push(value);
    }
    this._this = value;
  }
  private _this: string | null = null;
  private readonly _knownThisNames: string[] = [];
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
      throw new Error(`${type} はすでに決まっています`);
    }
    this._listenersOfNo[type] = func;
  }

  public async runNoObjectListener(type: string) {
    if (this._listenersOfNo[type]) {
      await handleError(type, '', this._listenersOfNo[type]());
    }
  }

  public addOneObjectLisener(type: string, func: OneObjectListener) {
    const name = this._this;
    if (!name) {
      throw new Error(`${type} の this がありません`);
    }
    const listeners =
      this._listenersOfOne[type] || (this._listenersOfOne[type] = {});
    if (listeners[name]) {
      throw new Error(`this="${name}" の ${type} はすでに決まっています`);
    }
    listeners[name] = func;
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
    const name = this._this;
    if (!name) {
      throw new Error(`${type} の this がありません`);
    }
    const item = this.item;
    if (!item) {
      throw new Error(`${type} の item がありません`);
    }
    const container =
      this._listenersOfTwo[type] || (this._listenersOfTwo[type] = {});
    const listeners = container[name] || (container[name] = {});
    if (listeners[name]) {
      throw new Error(
        `this="${name}" item="${item.toString()}" の ${type} はすでに決まっています`
      );
    }
    listeners[item] = func;
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
    if (enemy && isOpposite(this, object)) {
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
      (Boolean(listeners[Enemy]) && isOpposite(self, item)) ||
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
    await this.runNoObjectListener('ゲームがはじまったとき');
  }

  public registerRules(object: RPGObject, name: string, summoner?: RPGObject) {
    object.name = name;
    if (this.hasOneObjectLisener('つくられたとき', name)) {
      this.runOneObjectLisener('つくられたとき', object);
    }
    if (summoner && this.hasTwoObjectListener('しょうかんされたとき', name)) {
      this.runTwoObjectListener('しょうかんされたとき', object, summoner);
    }
    if (this.hasOneObjectLisener('つねに', name)) {
      this.runつねに(object, name);
    }
    if (this.hasOneObjectLisener('こうげきするとき', name)) {
      object.on('becomeattack', this.onこうげきするとき);
    }
    if (this.hasOneObjectLisener('たおされたとき', name)) {
      object.on('becomedead', this.onたおされたとき);
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
    if (this._knownThisNames.indexOf(name) < 0) {
      Hack.log(`${name} というアセットは ないかもしれない`);
      feeles.install && feeles.install(name);
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

    const object = new RPGObject();
    object._ruleInstance = this;
    if (dir) {
      object.forward = dir(object);
    }
    if (x !== undefined && y !== undefined) {
      object.locate(x, y, map);
    }

    this.registerRules(object, name, summoner);
    this.tryPairing(object);

    return object;
  }

  private onこうげきするとき = ((e: IEvent) => {
    this.runOneObjectLisener('こうげきするとき', e.target);
  }).bind(this);
  private onたおされたとき = ((e: IEvent) => {
    this.runOneObjectLisener('たおされたとき', e.target);
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
