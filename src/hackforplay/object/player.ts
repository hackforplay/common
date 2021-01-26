import enchant from '../../enchantjs/enchant';
import RPGObject from './object';
import Key from '../key';
import BehaviorTypes from '../behavior-types';
import RPGMap from '../rpg-map';
import Camera from '../camera';

class Player extends RPGObject {
  constructor() {
    super();
    this.initialize();
  }

  enteredStack: RPGObject[] = [];

  initialize() {
    this.enteredStack = [];
    this.on('enterframe', Player.prototype.stayCheck);
    this.on('walkend', Player.prototype.enterCheck);
    const set = (key: string) => {
      if (!(key in this)) {
        this[key] = Player.prototype[key].bind(this);
      }
    };
    set('checkInput');
    set('onenterframe');
    set('enterCheck');
    set('stayCheck');
    this._layer = RPGMap.Layer.Player;

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
    }

    // 歩き終わったときに自動でモノを拾う (pickUp)
    this.isAutoPickUp = true;
  }

  static set(object: RPGObject) {
    Player.prototype.initialize.call(object);
  }

  checkInput(type: string) {
    const input = Array.isArray(this.input[type])
      ? this.input[type]
      : [this.input[type]];
    return input
      .map(function (name: keyof typeof Key) {
        return Key[name].pressed;
      })
      .reduce(function (a: number, b: number) {
        return a + b;
      });
  }

  onenterframe() {
    if (!(Hack as any).isPlaying) return;

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
      .filter(item => {
        return item.mapX === this.mapX && item.mapY === this.mapY;
      })
      .forEach(item => {
        item.dispatchEvent(new enchant.Event('playerenter'));
        this.enteredStack.push(item);
      });
  }

  stayCheck() {
    // Dispatch playerstay/playerexit Event
    this.enteredStack.forEach(item => {
      if (item.mapX === this.mapX && item.mapY === this.mapY) {
        item.dispatchEvent(new enchant.Event('playerstay'));
      } else {
        item.dispatchEvent(new enchant.Event('playerexit'));
        const index = this.enteredStack.indexOf(item);
        this.enteredStack.splice(index, 1);
      }
    });
  }
}

export default Player;
