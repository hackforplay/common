import enchant from '../../enchantjs/enchant';
import BehaviorTypes from '../behavior-types';
import Camera from '../camera';
import Key from '../key';
import RPGMap from '../rpg-map';
import RPGObject from './object';

class Player extends RPGObject {
  constructor(mod) {
    super(mod);
    this.initialize();
  }

  initialize() {
    this.enteredStack = [];
    this.on('enterframe', Player.prototype.stayCheck);
    this.on('walkend', Player.prototype.enterCheck);
    const set = key => {
      if (!(key in this)) {
        this[key] = Player.prototype[key].bind(this);
      }
    };
    set('checkInput');
    set('onenterframe');
    set('enterCheck');
    set('stayCheck');
    this.zIndex = RPGMap.Layer.Player;

    this.hp = 3;
    this.atk = 1;

    this.input = {
      up: 'up',
      down: 'down',
      left: 'left',
      right: 'right',
      attack: 'space'
    };

    // デフォルトのカメラを作成する
    if (!Camera.main) {
      const camera = new Camera();
      camera.target = this.proxy; // https://bit.ly/39lHonB
      Camera.main = camera;
      Hack.camera = Hack.camera; // 後方互換性 (~0.11)
    }

    // 歩き終わったときに自動でモノを拾う (pickUp)
    this.isAutoPickUp = true;
  }

  static set(object) {
    Player.prototype.initialize.call(object);
  }

  checkInput(type) {
    const input = Array.isArray(this.input[type])
      ? this.input[type]
      : [this.input[type]];
    return input
      .map(function (name) {
        return Key[name].pressed;
      })
      .reduce(function (a, b) {
        return a + b;
      });
  }

  onenterframe() {
    if (!Hack.isPlaying) return;

    if (this.behavior === BehaviorTypes.Idle) {
      if (this.checkInput('attack')) {
        this.attack();
      }
    }

    if (this.behavior === BehaviorTypes.Idle) {
      const hor = this.checkInput('right') - this.checkInput('left');
      const ver = hor ? 0 : this.checkInput('down') - this.checkInput('up');
      if (hor || ver) {
        // Turn
        this.forward = [hor, ver];
        this.walk();
      }
    }
  }

  enterCheck() {
    // Dispatch playerenter Event
    RPGObject.collection
      .filter(function (item) {
        return item.mapX === this.mapX && item.mapY === this.mapY;
      }, this)
      .forEach(function (item) {
        item.dispatchEvent(new enchant.Event('playerenter'));
        this.enteredStack.push(item);
      }, this);
  }

  stayCheck() {
    // Dispatch playerstay/playerexit Event
    this.enteredStack?.forEach(function (item) {
      // TODO: item が削除されている場合があるので検証する
      if (item.parent === null) return;

      if (item.mapX === this.mapX && item.mapY === this.mapY) {
        item.dispatchEvent(new enchant.Event('playerstay'));
      } else {
        item.dispatchEvent(new enchant.Event('playerexit'));
        const index = this.enteredStack.indexOf(item);
        this.enteredStack.splice(index, 1);
      }
    }, this);
  }
}

export default Player;
