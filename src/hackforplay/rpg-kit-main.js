import '../mod/stop';
import SAT from '../lib/sat.min';
import Hack from './hack';
import './rpg-kit-rpgobjects';
import './rpg-kit-color';
import enchant from '../enchantjs/enchant';
import Camera from './camera';
import { CanvasRenderer } from '../enchantjs/enchant';
import { KeyClass } from './key';
import { isOpposite } from './family';
import BehaviorTypes from './behavior-types';
import Keyboard from './keyboard';
import { stringToArray, dakuten, handakuten } from './utils/string-utils';
import RPGMap from './rpg-map';
import game from './game';

game.preload(
  'resources/enchantjs/monster1.gif',
  'resources/enchantjs/monster2.gif',
  'resources/enchantjs/monster3.gif',
  'resources/enchantjs/monster4.gif',
  'resources/enchantjs/monster5.gif',
  'resources/enchantjs/bigmonster1.gif',
  'resources/enchantjs/bigmonster2.gif',
  // 'resources/enchantjs/x2/map1.gif',
  'resources/enchantjs/x2/dotmat.gif',
  'resources/enchantjs/x1.5/chara0.png',
  'resources/enchantjs/x1.5/chara5.png',
  'resources/hackforplay/enchantbook.png',
  'resources/enchantjs/icon0.png',
  'resources/enchantjs/x2/effect0.png',
  'resources/hackforplay/madosyo_small.png',
  'resources/enchantjs/shadow.gif',
  'resources/enchantjs/x1.5/chara7.png',
  'resources/hackforplay/clear.png',
  'resources/hackforplay/gameover.png',
  // 'hackforplay/button_retry.png',
  // 'hackforplay/new_button_replay.png',
  'resources/hackforplay/new_button_retry.png',
  'resources/hackforplay/menu-button-menu.png',
  // 'hackforplay/menu-button-restage.png',
  // 'hackforplay/menu-button-hint.png',
  'resources/hackforplay/menu-button-comment.png',
  'resources/hackforplay/menu-button-retry.png',
  'resources/hackforplay/new_button_next.png',
  // 'hackforplay/new_button_comment.png',
  // 'hackforplay/new_button_restage.png',
  'resources/hackforplay/attack.png',
  'resources/hackforplay/magician_girl.png'
);

game.keybind(' '.charCodeAt(0), 'a');

Hack.on('load', function() {
  // Appending to Hack.maps
  if (Hack.maps && !Hack.maps['next']) {
    Object.defineProperty(Hack.maps, 'next', {
      get: function() {
        var next = null;
        Object.keys(Hack.maps).reduce(function(previousKey, currentKey, index) {
          next = Hack.map === Hack.maps[previousKey] ? currentKey : next;
        });
        return next;
      }
    });
  }
  if (Hack.maps && !Hack.maps['current']) {
    Object.defineProperty(Hack.maps, 'current', {
      get: function() {
        var current = null;
        Object.keys(Hack.maps).forEach(function(key) {
          current = Hack.map === Hack.maps[key] ? key : current;
        });
        return current;
      }
    });
  }
  if (Hack.maps && !Hack.maps['previous']) {
    Object.defineProperty(Hack.maps, 'previous', {
      get: function() {
        var previous = null;
        Object.keys(Hack.maps).reduceRight(function(previousKey, currentKey) {
          previous =
            Hack.map === Hack.maps[previousKey] ? currentKey : previous;
        });
        return previous;
      }
    });
  }
});

/**
 * デフォルトのキーボードを生成する
 */
function createDefaultKeyboard() {
  // デフォルトのキーボード
  const keyboard = new Keyboard();
  Hack.keyboard = keyboard;
  Hack.popupGroup.addChild(keyboard);

  keyboard.registerKeys(
    [
      'あいうえお',
      'はひふへほ',
      'かきくけこ',
      'まみむめも',
      'さしすせそ',
      'や　ゆ　よ',
      'たちつてと',
      'らりるれろ',
      'なにぬねの',
      'わ　を　ん',
      'ぁぃぅぇぉ',
      'っ　ゃゅょ',
      'ー～…、。 ',
      '・！？「」'
    ],
    0
  );

  keyboard.registerKeys(
    [
      'アイウエオ',
      'ハヒフヘホ',
      'カキクケコ',
      'マミムメモ',
      'サシスセソ',
      'ヤ　ユ　ヨ',
      'タチツテト',
      'ラリルレロ',
      'ナニヌネノ',
      'ワ　ヲ　ン',
      'ァィゥェォ',
      'ッ　ャュョ',
      'ー～…、。 ',
      '♂♀#/&'
    ],
    1
  );

  keyboard.registerKeys(
    [
      '12345',
      '67890',
      'ABCDE',
      'FGHIJ',
      'KLMNO',
      'PQRST',
      'UVWXY',
      'Z()!?',
      'abcde',
      'fghij',
      'klmno',
      'pqrst',
      'uvwxy',
      'z @🍣😎'
    ],
    2
  );

  keyboard.registerFunctionKey('かな', 0).on('click', () => {
    keyboard.pageIndex = 0;
  });

  keyboard.registerFunctionKey('カナ', 1).on('click', () => {
    keyboard.pageIndex = 1;
  });

  keyboard.registerFunctionKey('A/1', 2).on('click', () => {
    keyboard.pageIndex = 2;
  });

  keyboard.registerFunctionKey('゛　', 3).on('click', () => {
    if (!keyboard.value) return;
    const values = stringToArray(keyboard.value);
    const char = values.pop();
    values.push(dakuten(char));
    keyboard.value = values.join('');
  });

  keyboard.registerFunctionKey('゜　', 4).on('click', () => {
    if (!keyboard.value) return;
    const values = stringToArray(keyboard.value);
    const char = values.pop();
    values.push(handakuten(char));
    keyboard.value = values.join('');
  });

  keyboard.registerFunctionKey('←', 5).on('click', () => {
    keyboard.value = stringToArray(keyboard.value)
      .slice(0, stringToArray(keyboard.value).length - 1)
      .join('');
  });

  keyboard.registerFunctionKey('スペース', 6).on('click', () => {
    keyboard.value += ' ';
  });
}

game.onawake = () => {
  // マウス座標
  let mouseX = null;
  let mouseY = null;
  // 正規化されたマウス座標
  let normalizedMouseX = null;
  let normalizedMouseY = null;

  game._element.onmousemove = function({ x, y }) {
    const rect = this.getBoundingClientRect();
    mouseX = x;
    mouseY = y;
    normalizedMouseX = x / rect.width;
    normalizedMouseY = y / rect.height;
  };

  Object.defineProperties(Hack, {
    mouseX: { get: () => mouseX },
    mouseY: { get: () => mouseY },
    normalizedMouseX: { get: () => normalizedMouseX },
    normalizedMouseY: { get: () => normalizedMouseY }
  });

  // マウスの入力状態
  Hack.mouseInput = new KeyClass();
  let mousePressed = false;
  game.rootScene.on('touchstart', () => (mousePressed = true));
  game.rootScene.on('touchend', () => (mousePressed = false));
  game.on('enterframe', () => Hack.mouseInput.update(mousePressed));

  // カメラグループ
  const cameraGroup = new enchant.Group();
  cameraGroup.name = 'CameraGroup';
  cameraGroup.order = 100;

  Hack.cameraGroup = cameraGroup;
  game.rootScene.addChild(cameraGroup);

  // コントローラーグループ
  const controllerGroup = new enchant.Group();
  controllerGroup.name = 'ControllerGroup';
  controllerGroup.order = 300;

  Hack.controllerGroup = controllerGroup;

  game.rootScene.addChild(controllerGroup);

  // マップ関連の親
  const world = new enchant.Group();
  world.name = 'World';
  Hack.world = world;
  game.rootScene.addChild(world);

  // Feeles の Stop/Resume 機能
  feeles.connected.then(({ port }) => {
    port.addEventListener('message', e => {
      switch (e.data.query) {
        case 'stop':
          if (typeof Hack.world.stop === 'function') {
            Hack.world.stop();
          }
          break;
        case 'resume':
          if (typeof Hack.world.resume === 'function') {
            Hack.world.resume();
          }
        default:
          break;
      }
    });
  });

  // ワールドが描画される前に描画先をマップのサーフェイスに差し替える
  world.on('prerender', ({ canvasRenderer }) => {
    if (Hack.map) {
      canvasRenderer.targetSurface = Hack.map._surface;
    }
  });

  // ワールドが描画されたら描画先をデフォルトのキャンバスに差し替える
  world.on('postrender', ({ canvasRenderer }) => {
    canvasRenderer.targetSurface = game.rootScene._layers.Canvas;

    // カメラに描画する
    for (const camera of Camera.collection) {
      camera.render();
    }
  });

  const overlayGroup = new enchant.Group();
  overlayGroup.name = 'OverlayGroup';
  overlayGroup.order = 1000;
  Hack.overlayGroup = overlayGroup;
  game.rootScene.addChild(overlayGroup);

  // DOMGroup
  const domGroup = new enchant.Group();
  domGroup.name = 'DOMGroup';
  domGroup.order = 500;
  Hack.domGroup = domGroup;
  // _element が存在すると DOM layer に追加される
  domGroup._element = {};
  game.rootScene.addChild(domGroup);

  // PopupGroup
  const popupGroup = new enchant.Group();
  popupGroup.name = 'PopupGroup';
  popupGroup.order = 1500;
  Hack.popupGroup = popupGroup;
  game.rootScene.addChild(popupGroup);

  // デフォルトのキーボードを生成する
  createDefaultKeyboard();

  const pad = new enchant.ui.Pad();
  pad.moveTo(20, 200);

  controllerGroup.addChild(pad);

  Hack.pad = pad;

  const apad = new enchant.Sprite(64, 64);
  apad.image = game.assets['resources/hackforplay/attack.png'];
  apad.buttonMode = 'a';
  apad.moveTo(400, 250);

  controllerGroup.addChild(apad);
  Hack.apad = apad;

  Hack.pad.name = 'Pad';
  Hack.apad.name = 'APad';

  // Enchant book
  Hack.enchantBookIcon = Hack.createSprite(64, 64, {
    image: game.assets['resources/hackforplay/enchantbook.png'],
    defaultParentNode: Hack.menuGroup,
    visible: !!Hack.hint,
    ontouchend: function() {
      Hack.textarea.hide();
      Hack.openEditor();
    }
  });
  Hack.onhintset = function(event) {
    Hack.enchantBookIcon.visible = true;
  };

  // Textarea
  Hack.textarea.moveTo(64, 0);
  Hack.textarea.width = 340;
  Hack.textarea.height = 32;

  // Life label (後方互換性 ~0.11)
  Object.defineProperty(Hack, 'lifeLabel', {
    get() {
      console.warn(
        `Hack.lifeLabel は非推奨になりました. ラベルを消したい場合は, Camera.main.removeNumberLabel('hp'); を使ってください`
      );
      return (
        Camera.main &&
        Camera.main.numberLabels.find(label => label._key === 'hp')
      );
    }
  });

  Hack.scoreLabel = (function(self, source) {
    Object.keys(source)
      .filter(function(key) {
        var desc = Object.getOwnPropertyDescriptor(source, key);
        return desc !== undefined && desc.enumerable;
      })
      .forEach(function(key) {
        self[key] = source[key];
      });
    Hack.menuGroup.addChild(self);
    return self;
  })(
    new enchant.ui.ScoreLabel(Hack.menuGroup.x + 10, Hack.menuGroup.y + 88),
    Hack.scoreLabel
  );

  feeles.setAlias('Hack', Hack);
  feeles.setAlias('game', game);
};

RPGMap.Layer = {
  Over: 4,
  Player: 3,
  Middle: 2,
  Shadow: 1,
  Under: 0
};

Hack.createMap = function(template) {
  // テンプレートリテラルからマップを生成するラッパー
  const zenkaku = /[０１２３４５６７８９]/g.exec(template);
  if (zenkaku) {
    Hack.log(`⚠️ 全かくの ${zenkaku[0]} がマップに入っています!`);
  }
  var source = template
    .split('\n')
    .map(function(line) {
      return line.match(/\s*\d+[\s\|]?/g);
    })
    .filter(function(line) {
      return Array.isArray(line);
    });
  var int = function(item) {
    return parseInt(item, 10);
  };
  var bmap = source.map(function(line) {
    return line.map(int);
  });
  var bar = function(item) {
    return item.substr(-1) === '|' ? 1 : 0;
  };
  var cmap = source.map(function(line) {
    return line.map(bar);
  });

  const map = new RPGMap(32, 32, bmap[0].length, bmap.length);
  map.imagePath = 'resources/enchantjs/x2/dotmat.gif';
  map.bmap.loadData(bmap);
  map.cmap = cmap;
  return map;
};

Hack.changeMap = function(mapName) {
  (function(current, next) {
    if (next === undefined) {
      switch (typeof mapName) {
        case 'string':
          Hack.log(mapName + ' は、まだつくられていない');
          break;
        case 'object':
          Hack.log('まだ マップが つくられていないようだ');
          break;
        case 'number':
          Hack.log(
            mapName + " ではなく 'map" + mapName + "' ではありませんか？"
          );
          break;
        default:
          Hack.log("Hack.changeMap('map2'); の ように かいてみよう");
          break;
      }
    } else if (!current) {
      // 最初のマップをロード
      next.load();
    } else if (current !== next) {
      var r = function(n) {
        n.parentNode.removeChild(n);
      };
      r(Hack.map.bmap);
      r(Hack.map.scene);
      r(Hack.map.fmap);
      next.load();
      current.dispatchEvent(new enchant.Event('leavemap'));
      next.dispatchEvent(new enchant.Event('entermap'));
    }
  })(Hack.map, Hack.maps[mapName]);
};

/*  Dir2Vec
directionをforwardに変換する。 0/down, 1/left, 2/right, 3/up
*/
Hack.Dir2Vec = function(dir) {
  switch (dir) {
    case 0:
      return {
        x: 0,
        y: 1
      };
    case 1:
      return {
        x: -1,
        y: 0
      };
    case 2:
      return {
        x: 1,
        y: 0
      };
    case 3:
      return {
        x: 0,
        y: -1
      };
    default:
      return null;
  }
};

Hack.Attack = function(x, y, damage, pushX, pushY) {
  RPGObject.collection
    .filter(function(item) {
      return item.mapX === x && item.mapY === y && item !== this;
    }, this)
    .forEach(function(item) {
      // ダメージ処理
      //   従来は onattacked イベントハンドラを使っていたが,
      //   処理を上書きされないようここに移した
      if (!item.damageTime && item.hasHp) {
        // ダメージ判定が起こる状態で,
        if (isOpposite(item, this)) {
          // 敵対している相手(もしくはその関係者)なら
          item.damageTime = item.attackedDamageTime;
          item.hp -= damage;
        }
      }
      var e = new enchant.Event('attacked');
      e.attacker = e.item = this;
      e.damage = damage || 0;
      item.dispatchEvent(e);
    }, this);
};

/**
 * Hack.score
 * Generic scoring property
 * Invoke Hack.onscorechange
 */
var scorechangeFlag = false;
Object.defineProperty(Hack, 'score', {
  enumerable: true,
  configurable: false,
  get: function() {
    return Hack.scoreLabel.score;
  },
  set: function(value) {
    if (Hack.scoreLabel.score !== value) {
      Hack.scoreLabel.score = value;
      scorechangeFlag = true;
    }
  }
});
Hack.scoreLabel = Object.create(null); // 仮オブジェクト
Hack.score = 0; // Fire a event and Initialize score
game.on('enterframe', function() {
  if (scorechangeFlag && Hack.isPlaying) {
    Hack.dispatchEvent(new enchant.Event('scorechange'));
    scorechangeFlag = false;
  }
});

/* Timeline Extention
 * become(type[, time])
 * time フレームが経過した時、behavior typeを指定する
 */
enchant.Timeline.prototype.become = function(type, time) {
  this.add(
    new enchant.Action({
      onactionstart: function() {
        var capital = type[0].toUpperCase() + type.substr(1).toLowerCase();
        if (
          this instanceof RPGObject &&
          BehaviorTypes.hasOwnProperty(capital)
        ) {
          this.behavior = BehaviorTypes[capital];
        }
      },
      time: time || 0
    })
  );
  return this;
};
