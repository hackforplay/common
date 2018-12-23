import RPGObject from './object/object';
import { hasContract } from './family';
import { default as Hack } from './hack';
import { Dir } from './dir';

interface Event {
  item: RPGObject;
}
interface CollidedEvent extends Event {
  map: Boolean;
  hits: RPGObject[];
}

function throwError(error: Error) {
  return (<any>window).feeles.throwError.apply(null, arguments);
}

function handleError(
  title: string,
  name: string,
  promiseLike?: Promise<void>
): Promise<void> {
  if (promiseLike && promiseLike instanceof Promise) {
    return promiseLike.catch(error => {
      console.error(`RuleError: ${title} of ${name}`);
      throwError(error);
    });
  }
  return Promise.resolve();
}

const Anyone: unique symbol = Symbol('Rule.Anyone');

type NoObjectListener = (this: void) => Promise<void>;
type OneObjectListener = (this: RPGObject) => Promise<void>;
type TwoObjectListener = (this: RPGObject, item: RPGObject) => Promise<void>;

const feeles = (<any>window).feeles || {};

export default class Rule {
  constructor() {}

  static readonly Anyone = Anyone;

  // public vars
  get this(): string | null {
    return this._this;
  }
  set this(value: string | null) {
    if (value && this._knownThisNames.indexOf(value) < 0) {
      this._knownThisNames.push(value);
    }
    this._this = value;
  }
  _this: string | null = null;
  _knownThisNames: string[] = [];
  item: string | typeof Anyone | null = null;
  // listeners
  _listenersOfNo: {
    [type: string]: NoObjectListener;
  } = {};
  _listenersOfOne: {
    [type: string]: {
      [name: string]: OneObjectListener;
    };
  } = {};
  _listenersOfTwo: {
    [type: string]: {
      [name: string]: {
        [item: string]: TwoObjectListener;
        [Anyone]?: TwoObjectListener;
      };
    };
  } = {};
  // collections
  _collections: {
    [type: string]: RPGObject[];
  } = {};

  addNoObjectListener(type: string, func: NoObjectListener) {
    if (this._listenersOfNo[type]) {
      throw new Error(`${type} はすでに決まっています`);
    }
    this._listenersOfNo[type] = func;
  }

  async runNoObjectListener(type: string) {
    if (this._listenersOfNo[type]) {
      await handleError(type, '', this._listenersOfNo[type]());
    }
  }

  addOneObjectLisener(type: string, func: OneObjectListener) {
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

  async runOneObjectLisener(type: string, object: RPGObject) {
    const name: string = object.name || '';
    const listeners = this._listenersOfOne[type];
    if (!listeners) return;
    const specify = listeners[name];
    if (specify) {
      await handleError(type, name, specify.call(object)); // エラーハンドリング
    }
  }

  addTwoObjectListener(type: string, func: TwoObjectListener) {
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

  async runTwoObjectListener(type: string, object: RPGObject, item: RPGObject) {
    const name: string = object.name || '';
    const itemName: string = item.name || '';
    const container = this._listenersOfTwo[type];
    if (!container) return;
    const listeners = container[name];
    if (!listeners) return;
    const specify = listeners[itemName];
    if (specify) {
      // 特定のアセットにだけ作用
      handleError(type, name, specify.call(object, item));
    }
    const anyone = listeners[Anyone];
    if (anyone) {
      // 誰でも良い
      handleError(type, name, anyone.call(object, item));
    }
  }

  /**
   * そのルールが登録されているかを調べる
   * @param type
   * @param name アセットの名前
   */
  hasListener(type: string, name?: string) {
    if (this.hasNoObjectListener(type)) return true;
    if (!name) return false;
    return (
      this.hasOneObjectLisener(type, name) ||
      this.hasTwoObjectListener(type, name)
    );
  }

  hasNoObjectListener(type: string) {
    return Boolean(this._listenersOfNo[type]);
  }

  hasOneObjectLisener(type: string, name: string) {
    const listeners = this._listenersOfOne[type];
    if (!listeners) return false;
    return Boolean(listeners[name]);
  }

  hasTwoObjectListener(type: string, name: string) {
    const container = this._listenersOfTwo[type];
    if (!container) return false;
    return Boolean(container[name]);
  }

  addToCollection(name: string, object: RPGObject) {
    const collections =
      this._collections[name] || (this._collections[name] = []);
    collections.push(object);
  }

  /**
   * あるアセットに向けてメッセージをおくる.
   * メッセージされたとき ルールが実行される
   * @param sender
   * @param name
   */
  message(sender: RPGObject, name: string) {
    const collections = this._collections[name];
    if (!collections) return;
    for (const item of collections) {
      this.runTwoObjectListener('メッセージされたとき', item, sender);
    }
  }

  /**
   * 「つねに」を再帰的にコールするラッパー
   * @param object RPGObject
   */
  runつねに(object: RPGObject) {
    // TODO: パフォーマンスが悪化しそうなので改善する
    requestAnimationFrame(() => {
      if (Hack.world._stop || object._stop) {
        return this.runつねに(object);
      }
      this.runOneObjectLisener('つねに', object).then(() =>
        this.runつねに(object)
      );
    });
  }

  async runゲームがはじまったとき() {
    await this.runNoObjectListener('ゲームがはじまったとき');
  }

  // 実際にコールする関数
  つくる(
    name: string,
    x?: number,
    y?: number,
    map?: string,
    dir?: Dir,
    summoner?: RPGObject
  ) {
    if (this._knownThisNames.indexOf(name) < 0) {
      Hack.log(`${name} というアセットは ないかもしれない`);
      feeles.install && feeles.install(name);
    }
    const object = new RPGObject();
    object.name = name;
    object._ruleInstance = this;
    // つくられたとき (しょうかんしたときにも呼ばれる)
    if (this.hasOneObjectLisener('つくられたとき', name)) {
      this.runOneObjectLisener('つくられたとき', object);
    }
    // しょうかんされたとき
    if (summoner && this.hasTwoObjectListener('しょうかんされたとき', name)) {
      this.runTwoObjectListener('しょうかんされたとき', object, summoner);
    }

    // インスタンスごとのパラメータ指定
    if (dir) {
      object.forward = dir();
    }
    if (x !== undefined && y !== undefined) {
      object.locate(x, y, map);
    }

    // つねに
    if (this.hasOneObjectLisener('つねに', name)) {
      // rule.つねに がある
      this.runつねに(object);
    }
    if (this.hasOneObjectLisener('こうげきするとき', name)) {
      object.on('becomeattack', () =>
        this.runOneObjectLisener('こうげきするとき', object)
      );
    }
    if (this.hasOneObjectLisener('たおされたとき', name)) {
      // rule.たおされたとき がある
      object.on('becomedead', () =>
        this.runOneObjectLisener('たおされたとき', object)
      );
    }
    if (this.hasTwoObjectListener('ふまれたとき', name)) {
      // rule.ふまれたとき がある
      object.on('addtrodden', (event: Event) =>
        this.runTwoObjectListener('ふまれたとき', object, event.item)
      );
    }
    if (this.hasTwoObjectListener('ぶつかったとき', name)) {
      // rule.ぶつかったとき がある
      object.on('triggerenter', (event: Event) => {
        if (event && event.item) {
          const { collisionFlag } = event.item;
          if (collisionFlag && !hasContract(object, event.item)) {
            // item が障害物で、かつ互いに「しょうかんされた」ものではないとき
            this.runTwoObjectListener('ぶつかったとき', object, event.item);
          }
        }
      });
    }
    if (
      this.hasOneObjectLisener('すすめなかったとき', name) ||
      this.hasTwoObjectListener('ぶつかったとき', name)
    ) {
      object.on('collided', (event: CollidedEvent) => {
        if (event.map || event.hits.length === 0) {
          // マップの枠か、cmapとぶつかった => 相手のいない衝突
          this.runOneObjectLisener('すすめなかったとき', object);
        } else {
          // 何かとぶつかった
          this.runTwoObjectListener('ぶつかったとき', object, event.item);
        }
      });
    }
    if (this.hasTwoObjectListener('こうげきされたとき', name)) {
      object.on('attacked', (event: Event) => {
        this.runTwoObjectListener('こうげきされたとき', object, event.item);
      });
    }
    this.addToCollection(name, object); // コレクションからは永久に消えない
    return object;
  }

  ゲームがはじまったとき(func: NoObjectListener) {
    this.addNoObjectListener('ゲームがはじまったとき', func);
  }
  つくられたとき(func: OneObjectListener) {
    this.addOneObjectLisener('つくられたとき', func);
  }
  つねに(func: OneObjectListener) {
    this.addOneObjectLisener('つねに', func);
  }
  こうげきするとき(func: OneObjectListener) {
    this.addOneObjectLisener('こうげきするとき', func);
  }
  たおされたとき(func: OneObjectListener) {
    this.addOneObjectLisener('たおされたとき', func);
  }
  すすめなかったとき(func: OneObjectListener) {
    this.addOneObjectLisener('すすめなかったとき', func);
  }
  ふまれたとき(func: TwoObjectListener) {
    this.addTwoObjectListener('ふまれたとき', func);
  }
  ぶつかったとき(func: TwoObjectListener) {
    this.addTwoObjectListener('ぶつかったとき', func);
  }
  こうげきされたとき(func: TwoObjectListener) {
    this.addTwoObjectListener('こうげきされたとき', func);
  }
  メッセージされたとき(func: TwoObjectListener) {
    this.addTwoObjectListener('メッセージされたとき', func);
  }
  しょうかんされたとき(func: TwoObjectListener) {
    this.addTwoObjectListener('しょうかんされたとき', func);
  }
}
