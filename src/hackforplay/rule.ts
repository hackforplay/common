import RPGObject from './object/object';

function throwError(error: Error) {
  return (<any>window).feeles.throwError.apply(null, arguments);
}

function handleError(title: string, name: string, promiseLike?: Promise<void>) {
  if (promiseLike && promiseLike instanceof Promise) {
    return promiseLike.catch(error => {
      console.error(`RuleError: ${title} of ${name}`);
      throwError(error);
    });
  }
}

const Anyone: unique symbol = Symbol('Rule.Anyone');

interface OneObjectLisener {
  [key: string]: Function;
}

interface TwoObjectListener {
  [key: string]: {
    [key: string]: Function;
    [Anyone]?: Function;
  };
}

export default class Rule {
  constructor() {}

  static readonly Anyone = Anyone;

  // public vars
  this: string | null = null;
  item: string | typeof Anyone | null = null;
  // listeners
  _ゲームがはじまったとき?: Function;
  _つくられたとき: OneObjectLisener = {};
  _つねに: OneObjectLisener = {};
  _たおされたとき: OneObjectLisener = {};
  _ふまれたとき: TwoObjectListener = {};
  _ぶつかったとき: TwoObjectListener = {};
  _すすめなかったとき: OneObjectLisener = {};

  ゲームがはじまったとき(func: Function) {
    if (this._ゲームがはじまったとき) {
      throw new Error(`ゲームがはじまったとき はすでに決まっています`);
    }
    this._ゲームがはじまったとき = func;
  }

  async runゲームがはじまったとき() {
    if (this._ゲームがはじまったとき) {
      await handleError(
        'ゲームがはじまったとき',
        '',
        this._ゲームがはじまったとき()
      );
    }
  }

  つくられたとき(func: Function) {
    const name = this.this;
    if (!name) {
      throw new Error(`つくられたとき の this がありません`);
    }
    if (this._つくられたとき[name]) {
      throw new Error(
        `this="${name}" の つくられたとき はすでに決まっています`
      );
    }
    this._つくられたとき[name] = func;
  }

  つくる(name: string) {
    const object = new RPGObject();
    object.name = name;
    // つくられたとき
    let promise;
    if (this._つくられたとき[name]) {
      promise = this._つくられたとき[name].call(object);
      handleError('つくられたとき', name, promise); // エラーハンドリング
    }
    // つねに
    if (this._つねに[name]) {
      // rule.つねに がある
      promise = (promise || Promise.resolve()).then(() => {
        this.runつねに(object);
      });
      handleError('つねに', name, promise); // エラーハンドリング
    }

    if (this._たおされたとき[name]) {
      // rule.たおされたとき がある
      object.on('becomedead', () => this.handleBecomeDead(object));
    }
    if (this._ふまれたとき[name]) {
      // rule.ふまれたとき がある
      object.on('addtrodden', (event: {}) =>
        this.handleAddTrodden(object, event)
      );
    }
    if (this._ぶつかったとき[name]) {
      // rule.ぶつかったとき がある
      object.on('triggerenter', (event: {}) =>
        this.handleTriggerEnter(object, event)
      );
    }
    if (this._すすめなかったとき[name] || this._ぶつかったとき[name]) {
      // rule.すすめなかったとき or rule.ぶつかったとき がある
      object.on('collided', (event: {}) => this.handleCollided(object, event));
    }
    return object;
  }

  つねに(func: Function) {
    const name = this.this;
    if (!name) {
      throw new Error(`つねに の this がありません`);
    }
    if (this._つねに[name]) {
      throw new Error(`this="${name}" の つねに はすでに決まっています`);
    }
    this._つねに[name] = func;
  }

  runつねに(object: any) {
    requestAnimationFrame(() => {
      const func = this._つねに[object.name];
      if (!func) return;

      const result = func.call(object);
      if (result && result instanceof Promise) {
        result.then(() => this.runつねに(object));
      } else {
        this.runつねに(object);
      }
    });
  }

  たおされたとき(func: Function) {
    const name = this.this;
    if (!name) {
      throw new Error(`たおされたとき の this がありません`);
    }
    if (this._たおされたとき[name]) {
      throw new Error(
        `this="${name}" の たおされたとき はすでに決まっています`
      );
    }
    this._たおされたとき[name] = func;
  }

  handleBecomeDead(object: any) {
    const name: string = object.name || '';
    if (this._たおされたとき[name]) {
      handleError(
        'たおされたとき',
        name,
        this._たおされたとき[name].call(object)
      );
    }
  }

  ふまれたとき(func: Function) {
    const name = this.this;
    if (!name) {
      throw new Error(`ふまれたとき の this がありません`);
    }
    const item = this.item;
    const container =
      this._ふまれたとき[name] || (this._ふまれたとき[name] = {});
    if (item === Anyone || typeof item === 'string') {
      container[item] = func;
    } else {
      throw new Error(`ふまれたとき の item には使えません: ${item}`);
    }
  }

  handleAddTrodden(object: any, event: any) {
    const name: string = object.name || '';
    const item: string = event.item.name || '';
    const container = this._ふまれたとき[name];
    if (!container) return;
    if (container[item]) {
      // 特定のアセットにだけ作用
      handleError(
        'ふまれたとき',
        name,
        container[item].call(object, event.item)
      );
    }
    const anyone = container[Anyone];
    if (anyone) {
      // 誰でも良い
      handleError('ふまれたとき', name, anyone.call(object, event.item));
    }
  }

  ぶつかったとき(func: Function) {
    const name = this.this;
    if (!name) {
      throw new Error(`すすめなかったとき の this がありません`);
    }
    const item = this.item;
    const container =
      this._ぶつかったとき[name] || (this._ぶつかったとき[name] = {});
    if (item === Anyone || typeof item === 'string') {
      container[item] = func;
    } else {
      throw new Error(`ぶつかったとき の item には使えません: ${item}`);
    }
  }

  すすめなかったとき(func: Function) {
    const name = this.this;
    if (!name) {
      throw new Error(`すすめなかったとき の this がありません`);
    }
    if (this._すすめなかったとき[name]) {
      throw new Error(
        `this="${name}" の すすめなかったとき はすでに決まっています`
      );
    }
    this._すすめなかったとき[name] = func;
  }

  handleCollided(object: any, event: any) {
    if (event.map || event.hits.length === 0) {
      // マップの枠か、cmapとぶつかった => 相手のいない衝突
      const name: string = object.name || '';
      const func = this._すすめなかったとき[name];
      if (func) {
        handleError('すすめなかったとき', name, func.call(object));
      }
    } else {
      // 何かとぶつかった
      const name: string = object.name || '';
      const item: string = event.item.name || '';
      const container = this._ぶつかったとき[name];
      if (!container) return;
      if (container[item]) {
        // 特定のアセットにだけ作用
        handleError(
          'ぶつかったとき',
          name,
          container[item].call(object, event.item)
        );
      }
      const anyone = container[Anyone];
      if (anyone) {
        // 誰でも良い
        handleError('ぶつかったとき', name, anyone.call(object, event.item));
      }
    }
  }

  handleTriggerEnter(object: any, event: any) {
    const asset: string = object.name || '';
    const item: string = event.item.name || '';
    const container = this._ぶつかったとき[asset];
    if (!container) return;
    if (container[item]) {
      // 特定のアセットにだけ作用
      handleError(
        'ぶつかったとき',
        name,
        container[item].call(object, event.item)
      );
    }
    const anyone = container[Anyone];
    if (anyone) {
      // 誰でも良い
      handleError('ぶつかったとき', name, anyone.call(object, event.item));
    }
  }
}
