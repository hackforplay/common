import enchant from '../../enchantjs/enchant';
import RPGObject from './object';
import dictionary from './dictionary';
import game from '../game';

function skin() {
  this.image = game.assets['resources/enchantjs/x2/dotmat.gif'];
  this.directionType = 'single';
  this.forward = [0, -1];
}

class MapObject extends RPGObject {
  constructor(value) {
    super(skin);
    if (typeof value === 'number') {
      this.frame = value;
    } else {
      this.name = value;
    }
  }

  get name() {
    let search = '';
    Object.keys(MapObject.dictionary).forEach(function(key) {
      if (MapObject.dictionary[key] === this.frame) {
        search = key;
      }
    }, this);
    return search;
  }

  set name(key) {
    if (MapObject.dictionary.hasOwnProperty(key)) {
      this.frame = MapObject.dictionary[key];
    }
  }

  onenterframe() {}
}

// 互換性維持
MapObject._dictionary = {
  ...dictionary,
  ...(MapObject.Dictionaly || {})
};
Object.defineProperty(MapObject, 'dictionary', {
  configurable: true,
  enumerable: true,
  get: function() {
    return this._dictionary;
  },
  set: function(value) {
    Object.keys(value).forEach(function(key) {
      this._dictionary[key] = value[key];
    }, this);
  }
});

// １枚ずつ切り分けたsurface
MapObject.surfaces = {};
Object.keys(dictionary).forEach(function(name) {
  Object.defineProperty(MapObject.surfaces, name, {
    enumerable: true,
    configurable: true,
    get: function() {
      return tryFetchMapImage(name);
    },
    set: function(value) {
      Object.defineProperty(MapObject.surfaces, name, {
        value: value
      });
    }
  });
});

function tryFetchMapImage(name) {
  if (game.assets['resources/enchantjs/x2/dotmat.gif']) {
    const length = 20,
      w = 32,
      h = 32;
    const frame = MapObject.dictionary[name],
      x = (frame % length) * w,
      y = ((frame / length) >> 0) * h;
    const s = new enchant.Surface(w, h);
    s.draw(
      game.assets['resources/enchantjs/x2/dotmat.gif'],
      x,
      y,
      w,
      h,
      0,
      0,
      w,
      h
    );
    return (MapObject.surfaces[name] = s);
  }
  return undefined;
}

export default MapObject;
