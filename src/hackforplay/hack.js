import enchant from '../enchantjs/enchant';
import { hide, textArea } from '../mod/logFunc';
import Camera from './camera';
import { code$, emphasizeCode, reload } from './feeles';
import game from './game';
import { getHack } from './get-hack';
import requestPostMessage from './request-post-message';
import { errorInEvent } from './stdlog';

function refocus() {
  window.document.activeElement.blur(); // Blur an enchantBook
  window.parent.focus(); // Blur an input in parent window
  window.focus(); // focus game
}

const Hack = getHack();

// Surface.load される時の基底パス
Hack.basePath = 'https://storage.googleapis.com/hackforplay-common/';

// Hack.start
Hack.start = function () {
  // game start
  Hack.maps = Hack.maps || {};
  Hack.dispatchEvent(new enchant.Event('load'));
  game.start().error(e => errorInEvent(e, null, 'Hack.start'));
  window.focus();
};

// クリック時に再度フォーカス
Hack.focusOnClick = true;
window.addEventListener('click', function () {
  if (Hack.focusOnClick) {
    window.document.activeElement.blur(); // Blur an enchantBook
    window.parent.focus(); // Blur an input in parent window
    window.focus(); // focus game
  }
});

Hack.on('error', function (event) {
  Hack.log('It was slient. // うまく うごかなかった');
  console.error(event.error);
});

Hack.fun2str = function (func) {
  // 関数の文字列化
  if (func instanceof Function) {
    const str = func.toString().match(/^function[^\{]*\{\n?(\s*)([\s\S]*)\}$/);
    if (str !== null) {
      const indent = str[1].match(/(.*)$/)[0];
      return str[2]
        .split('\n' + indent)
        .join('\n')
        .replace(/\s*$/, '');
    } else {
      // 切り分けのミス
      Hack.log(
        'Hack.restagingCode hasnot set the function because hack.js is wrong. See hack.js and fix it'
      );
    }
  }
  return '';
};

// 【旧ログ機能】
// textarea : 画面全体をおおう半透明のテキストエリア(DOM)
Hack.textarea = function () {
  // scope: new Entity

  this.name = 'HackTextarea';

  this.width = game.width - 32;
  this.height = game.height - 32;
  this.opacity = 1;
  this.visible = false;
  this.backgroundColor = 'rgba(0,0,0,0.7)';

  this._element = window.document.createElement('textarea');
  // @removed
  this._element.setAttribute('disabled', 'disabled');
  this._element.classList.add('log');

  game.on('awake', () => {
    Hack.domGroup.addChild(Hack.textarea);
  });

  Object.defineProperty(this, 'text', {
    configurable: true,
    enumerable: true,
    get: function () {
      return this._element.value;
    },
    set: function (text) {
      this._element.value = text;
    }
  });
  this.show = function (text) {
    if (text !== undefined) {
      this.text = String(text);
    }
    this.visible = true;
  };
  this.hide = function () {
    this.visible = false;
  };

  return this;
}.call(new enchant.Entity());

Hack.textArea = textArea;
game.on('awake', () => {
  Hack.menuGroup.addChild(textArea);
});
Hack.on('gameclear', hide); // ゲームクリア時閉じる
Hack.on('gameover', hide); // ゲームオーバー時閉じる

// 画面に文字を表示する（次の行に追加）
Hack.log = function () {
  try {
    const values = [];
    for (let i = arguments.length - 1; i >= 0; i--) {
      switch (typeof arguments[i]) {
        case 'object':
          values[i] = JSON.stringify(arguments[i]);
          break;
        default:
          values[i] = arguments[i] + '';
          break;
      }
    }

    this.textArea.push(
      values.join(' ') +
        (this.textarea.text !== '' ? '\n' : '') +
        this.textarea.text
    );
    this.textArea.show();
  } catch (e) {
    Hack.log('Error', e.message);
  }
};

// 画面に文字を表示する（上書き）
Hack.show = function () {
  Hack.textArea.clear();
  Hack.log.apply(this, arguments);
};

Hack.clearLog = function () {
  Hack.textarea.text = '';
  Hack.textArea.clear();
  Hack.textArea.hide();
};

// enchantBook
Hack.enchantBook = function () {
  // scope: new Entity
  let isEditorReady = false;
  Hack.on('editorready', function () {
    isEditorReady = true;
  });

  let _hint = '';
  Object.defineProperty(Hack, 'hint', {
    configurable: true,
    enumerable: true,
    get: function () {
      return _hint;
    },
    set: function (code) {
      if (isEditorReady) {
        task(code);
      } else {
        Hack.oneditorready = task.bind(this, code);
      }

      function task(value) {
        _hint = value instanceof Function ? Hack.fun2str(value) : value;
        Hack.enchantBook._element.contentWindow.postMessage(
          {
            query: 'set',
            value: _hint
          },
          '/'
        );
        const e = new enchant.Event('hintset');
        e.value = _hint;
        e.rawValue = value;
        Hack.dispatchEvent(e);
      }
    }
  });

  Hack.on('editend', function () {
    Hack.enchantBook.tl.scaleTo(0, 1, 3, enchant.Easing.LINEAR);
    refocus();
  });

  Hack.on('editcancel', function () {
    Hack.enchantBook.tl.scaleTo(0, 1, 7, enchant.Easing.BACK_EASEIN);
    refocus();
  });

  this.width = game.width;
  this.height = game.height;
  this.visible = false;
  this._element = window.document.createElement('iframe');
  this._element.id = 'editor';
  this._element.src = '';
  this._element.setAttribute('width', '480');
  this._element.setAttribute('height', '320');
  this._element.type = 'iframe';
  game.rootScene.addChild(this);

  this.name = 'EnchantBook';

  return this;
}.call(new enchant.Entity());

Hack.openEditor = function () {
  if (!this.enchantBook) return;
  this.enchantBook.scale(1, 0);
  this.enchantBook.tl.scaleTo(1, 1, 7, enchant.Easing.BACK_EASEOUT); // うごきあり
  this.enchantBook.visible = true;
  this.dispatchEvent(new enchant.Event('editstart'));
};

Hack.closeEditor = function () {
  if (!this.enchantBook) return;
  this.enchantBook.scale(1, 1);
  this.enchantBook.tl
    .scaleTo(0, 1, 7, enchant.Easing.BACK_EASEIN)
    .then(function () {
      this.visible = false;
    });
  this.dispatchEvent(new enchant.Event('editcancel'));
};

Hack.clearHistory = function () {
  if (!this.enchantBook) return;
  this.enchantBook._element.contentWindow.postMessage(
    {
      query: 'clearHistory'
    },
    '/'
  );
};

Hack.createLabel = function (text, prop) {
  return function () {
    this.text = text;
    if (prop) {
      Object.keys(prop).forEach(function (key) {
        this[key] = prop[key];
      }, this);
    }
    const parent = this.defaultParentNode || Hack.defaultParentNode;
    if (parent) {
      parent.addChild(this);
    }
    return this;
  }.call(new enchant.Label());
};

Hack.createSprite = function (width, height, prop) {
  return function () {
    if (prop) {
      Object.keys(prop).forEach(function (key) {
        this[key] = prop[key];
      }, this);
    }
    const parent = this.defaultParentNode || Hack.defaultParentNode;
    if (parent) {
      parent.addChild(this);
    }
    return this;
  }.call(new enchant.Sprite(width, height));
};

// overlay
Hack.overlay = function () {
  return function (args) {
    // scope: createSprite()

    this.image = new enchant.Surface(game.width, game.height);
    for (let i = 0; i < args.length; i++) {
      const fill = args[i];
      switch (true) {
        case fill instanceof enchant.Surface:
          this.image.draw(fill, 0, 0, game.width, game.height);
          break;
        case game.assets[fill] instanceof enchant.Surface:
          this.image.draw(game.assets[fill], 0, 0, game.width, game.height);
          break;
        default:
          this.image.context.fillStyle = fill;
          this.image.context.fillRect(0, 0, game.width, game.height);
          break;
      }
    }

    return this;
  }.call(
    Hack.createSprite(game.width, game.height, {
      defaultParentNode: Hack.overlayGroup
    }),
    arguments
  );
};

(function () {
  let playing = true;

  Object.defineProperty(Hack, 'isPlaying', {
    configurable: true,
    enumerable: true,
    get: function () {
      return playing;
    }
  });
  // Trigger
  Hack.gameclear = function () {
    if (!playing) return;
    playing = false;
    Hack.dispatchEvent(new enchant.Event('gameclear'));
  };
  Hack.gameover = function () {
    if (!playing) return;
    playing = false;
    Hack.dispatchEvent(new enchant.Event('gameover'));
  };

  // 初期値
  Hack.ongameclear = function () {
    const lay = Hack.overlay(
      'rgba(0,0,0,0.4)',
      'resources/hackforplay/clear.png'
    );
    lay.opacity = 0;
    lay.moveTo(-game.rootScene.x, -game.rootScene.y);
    lay.tl.fadeIn(30, enchant.Easing.LINEAR).then(function () {
      // [RETRY]
      Hack.createSprite(165, 69, {
        x: 314 - game.rootScene.x,
        y: 320 - game.rootScene.y,
        image: game.assets['resources/hackforplay/new_button_retry.png'],
        defaultParentNode: Hack.overlayGroup,
        ontouchend: function () {
          // [RETRY] がクリックされたとき
          reload(false);
        }
      }).tl.moveTo(
        314 - game.rootScene.x,
        0 - game.rootScene.y,
        40,
        enchant.Easing.CUBIC_EASEOUT
      );
    });
  };

  Hack.ongameover = function () {
    const lay = Hack.overlay(
      'rgba(0,0,0,0.4)',
      'resources/hackforplay/gameover.png'
    );
    lay.opacity = 0;
    lay.moveTo(-game.rootScene.x, -game.rootScene.y);
    lay.tl.fadeIn(30, enchant.Easing.LINEAR).then(function () {
      // [RETRY]
      Hack.createSprite(165, 69, {
        x: 157 - game.rootScene.x,
        y: 320 - game.rootScene.y,
        image: game.assets['resources/hackforplay/new_button_retry.png'],
        defaultParentNode: Hack.overlayGroup,
        ontouchend: function () {
          // [RETRY] がクリックされたとき
          reload(false);
        }
      }).tl.moveTo(
        157 - game.rootScene.x,
        240 - game.rootScene.y,
        20,
        enchant.Easing.CUBIC_EASEOUT
      );
    });
  };
})();

// ゲームメニュー
(function () {
  game.rootScene.name = 'RootScene';

  let visible, overlay;

  const GUIParts = [];

  // メニュー全体を包括するグループ つねに手前に描画される
  // Hack.menuGroup でアクセスできる
  const menuGroup = new enchant.Group();
  menuGroup.name = 'MenuGroup';
  menuGroup.order = 200;

  menuGroup.on('enterframe', function () {
    /*
		if (game.rootScene.lastChild !== menuGroup) {
			game.rootScene.addChild(menuGroup);
		}
		*/
    menuGroup.moveTo(-game.rootScene.x, -game.rootScene.y); // 位置合わせ
  });

  Object.defineProperty(Hack, 'menuGroup', {
    configurable: true,
    get: function () {
      return menuGroup;
    }
  });

  // Hack.menuOpenedFlag 読み取り専用プロパティ
  Object.defineProperty(Hack, 'menuOpenedFlag', {
    configurable: true,
    get: function () {
      return visible;
    }
  });

  // Hack.menuOpener Sprite 読み取り専用プロパティ
  const opener = Hack.createSprite(32, 32, {
    visible: false,
    x: 438,
    y: 10,
    defaultParentNode: menuGroup
  });
  Object.defineProperty(Hack, 'menuOpener', {
    configurable: true,
    get: function () {
      return opener;
    }
  });

  game.rootScene.addChild(menuGroup);

  // イベント Hack.onmenuopend が dispatch される
  Hack.openMenu = function () {
    if (visible) return;
    visible = true;
    Hack.dispatchEvent(new enchant.Event('menuopened'));

    // アニメーション
    overlay.tl.fadeIn(6);

    GUIParts.filter(function (item, index) {
      GUIParts[index].visible = GUIParts[index].condition();
      return GUIParts[index].visible;
    }).forEach(function (item, index) {
      item.moveTo(opener.x, opener.y);
      item.tl
        .hide()
        .fadeIn(8)
        .and()
        .moveBy(0, 40 * index + 60, 8, enchant.Easing.BACK_EASEOUT);
      item.touchEnabled = true;
    });
  };

  // イベント Hack.onmenuclosed が dispatch される
  Hack.closeMenu = function () {
    if (!visible) return;
    visible = false;
    Hack.dispatchEvent(new enchant.Event('menuclosed'));

    overlay.tl.fadeOut(6);

    GUIParts.forEach(function (item) {
      item.tl
        .fadeOut(8, enchant.Easing.BACK_EASEIN)
        .and()
        .moveTo(opener.x, opener.y, 8, enchant.Easing.BACK_EASEIN);
      item.touchEnabled = false;
    });
  };

  // スプライトの初期化
  game.on('load', function () {
    // 暗めのオーバーレイ
    overlay = new enchant.Sprite(game.width, game.height);
    overlay.image = new enchant.Surface(overlay.width, overlay.height);
    overlay.image.context.fillStyle = 'rgba(0,0,0,0.4)';
    overlay.image.context.fillRect(0, 0, overlay.width, overlay.height);
    overlay.touchEnabled = false;
    overlay.opacity = 0;
    overlay.scale(2, 2); // 動いた時に端が見えないように
    menuGroup.addChild(overlay);

    // メニューを開くボタン
    opener.image = game.assets['resources/hackforplay/menu-button-menu.png'];

    /*
		opener.onenterframe = function() {
			this.parentNode.addChild(this); // つねに手前に表示
		};
		*/

    opener.ontouchend = function () {
      if (visible) Hack.closeMenu();
      else Hack.openMenu();
    };

    // ゲームを再スタートするボタン
    addGUIParts(
      game.assets['resources/hackforplay/menu-button-retry.png'],
      function () {
        return true;
      },
      function () {
        location.reload(false);
      }
    );

    function addGUIParts(_image, _condition, _touchEvent) {
      GUIParts.push(
        Hack.createSprite(32, 32, {
          opacity: 0,
          image: _image,
          defaultParentNode: menuGroup,
          visible: _condition(),
          condition: _condition,
          touchEnabled: false,
          ontouchend: function () {
            this.tl
              .scaleTo(1.1, 1.1, 3)
              .scaleTo(1, 1, 3)
              .then(function () {
                _touchEvent();
              });
          }
        })
      );
    }
  });
})();

/**
 * Hack.define
 * obj: targeting object (If omitted: Hack)
 * prop: property name (obj.----)
 * condition: if (obj.---- === condition) { predicate(); }
 */
Hack.define = function (obj, prop, condition, predicate) {
  let _value = null,
    descriptor = Object.getOwnPropertyDescriptor(obj, prop);
  if (arguments.length < 4)
    return Hack.define(Hack, arguments[0], arguments[1], arguments[2]);
  else if (descriptor) {
    if (!descriptor.configurable) {
      Hack.log('Cannot define prop ' + prop + '. It is NOT configurable');
    } else if (descriptor.value !== undefined && !descriptor.writable) {
      Hack.log('Cannot define prop ' + prop + '. It is NOT writable');
    } else if (descriptor.value === undefined && descriptor.set === undefined) {
      Hack.log('Cannot define prop ' + prop + '. It has NOT setter');
    } else if (descriptor.value !== undefined) {
      // Append setter
      _value = descriptor.value;
      descriptor = {
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,
        get: function () {
          return _value;
        },
        set: function (value) {
          if ((_value = value) === condition && predicate instanceof Function) {
            predicate();
          }
        }
      };
    } else {
      // Extend setter
      const setter = descriptor.set;
      descriptor.set = function (value) {
        setter.call(obj, value);
        if (value === condition && predicate instanceof Function) {
          predicate();
        }
      };
    }
  } else {
    descriptor = {
      configurable: true,
      enumerable: true,
      get: function () {
        return _value;
      },
      set: function (value) {
        if ((_value = value) === condition && predicate instanceof Function) {
          predicate();
        }
      }
    };
  }
  Object.defineProperty(obj, prop, descriptor);
};

/*
game.addEventListener('load', function() {
	if (Hack.defaultParentNode) {
		game.rootScene.addChild(Hack.defaultParentNode);
	} else {
		Hack.defaultParentNode = game.rootScene;
	}
});
*/

/**
 * Hack.css2rgb
 * style: CSS Color style / Array
 * @return [r, g, b]
 */
(function () {
  const ctx = new enchant.Surface(1, 1).context;
  Hack.css2rgb = function (style) {
    if (typeof style === 'string') {
      ctx.fillStyle = style;
      ctx.fillRect(0, 0, 1, 1);
      return Array.prototype.slice.call(
        ctx.getImageData(0, 0, 1, 1).data,
        0,
        3
      );
    } else if (style instanceof Array && style.length !== 3) {
      return [0, 0, 0].map(function (elem, index) {
        return Math.min(255, Math.max(0, style[index] || elem)) >> 0;
      });
    } else if (style instanceof Array) {
      return style;
    }
    throw new Error(
      'Hack.css2rgb requires CSS style string or Array of number'
    );
  };
})();

/*  Vec2Dir
forwardをdirectionに変換する。およそのベクトルをまるめて近い向きに直す
*/
Hack.Vec2Dir = function (vec) {
  if (vec.x === undefined || vec.y === undefined) {
    return null;
  }
  if (vec.x === 0 && vec.y === 0) {
    return null;
  }
  const deg = (Math.atan2(vec.y, vec.x) / Math.PI) * 180;
  if (-135 <= deg && deg <= -45) {
    return 3;
  } // up
  if (-45 <= deg && deg <= 45) {
    return 2;
  } // right
  if (45 <= deg && deg <= 135) {
    return 0;
  } // down
  return 1; // left
};

// statusLabel を変更するとゲーム画面上部のバーにその文字が表示される
let _statusLabel = null;
Object.defineProperty(Hack, 'statusLabel', {
  enumerable: true,
  configurable: true,
  get() {
    return _statusLabel;
  },
  set(value) {
    _statusLabel = value;
    requestPostMessage('statusLabel', value);
  }
});

// ゲームの経過時間を知るためのプロパティ
let _time = 0;
Object.defineProperty(Hack, 'time', {
  enumerable: true,
  configurable: true,
  get() {
    return _time;
  },
  set(value) {
    _time = Math.max(0, Math.ceil(value));
  }
});

Hack.showLabel = key => {
  if (!Camera.numberLabels.includes(key)) {
    Camera.numberLabels = Camera.numberLabels.concat(key);
  }
};

Hack.hideLabel = key => {
  const labels = Camera.numberLabels;
  const index = labels.indexOf(key);
  if (index > -1) {
    labels.splice(index, 1);
    Camera.numberLabels = labels;
  }
};

Hack.seBaseUrl = 'https://storage.googleapis.com/hackforplay-sounds/';

Object.defineProperty(Hack, 'code', {
  enumerable: true,
  configurable: true,
  set(code) {
    code$ && code$.next(code);
  },
  get() {
    return code$ ? code$.value : '';
  }
});

Hack.emphasizeCode = emphasizeCode;

/**
 * talk などの半角=>全角切り替えを無効にするフラグ
 */
Hack.disableZenkakuMode = false;

/**
 * 「見た目を〇〇という名前にしてしまったみたい」というエラーログを表示しないフラグ
 */
Hack.disableSkinNotFoundError = false;

export default Hack;
