import enchant from '../enchantjs/enchant';
import './rpg-kit-main';
import './camera';
import './loader';
import './rpg-kit-rpgobjects';
import './trodden';
import Hack from './hack';
import * as synonyms from './synonyms';
import Skin from './skin';
import '../mod/collider-debugger';
import stopOnBlur from '../mod/stop-on-blur';
import * as logFunc from '../mod/logFunc';
import find from './find';
import deprecated from './deprecated';
import createCompatibleMap from './create-compatible-map';
import loadMap from './load-map';
import coordinate from '../mod/coordinate';
import game from './game';

// Assign synonyms
Hack.assets = Hack.assets || {};
for (const [from, _global, _skin] of synonyms.assets) {
  const mod = Hack.assets[from];
  if (typeof mod === 'function') {
    self[_global] = Skin[_skin] = mod; // synonym
    Skin.__name.set(mod, _skin); // Skin.__name.get(mod) === 'mod name'
  }
}

// Notice to deprecated event
function checkDeprecated() {
  const message = deprecated();
  if (message) {
    console.error(message);
  } else {
    // また調べる
    feeles.setTimeout(checkDeprecated, 1000);
  }
}
game.on('load', checkDeprecated);

// find
/**
 * その name をもつオブジェクトを取得する
 * @param {string} name オブジェクトの名前
 * @returns {RPGObject|null} オブジェクトあるいは null
 */
Hack.find = find;

/**
 * 完全な JSON 文字列からマップを生成する
 * @param {String|undefined} mapName マップの名前
 * @param {String} mapJson stringify された Map JSON
 * @returns {Promise<RPGMap>}
 */
Hack.parseMapJson = function parseMapJson(mapName, mapJson) {
  // mapName はなくても良いが、第１引数にしたい
  if (mapJson === undefined) {
    mapJson = mapName;
    mapName = undefined;
  }
  const parsedMapJson = JSON.parse(mapJson);
  return new Promise(resolve => {
    let map;
    const callback = () => {
      if (mapName) {
        Hack.maps = Hack.maps || {};
        Hack.maps[mapName] = map;
      }
      resolve(map);
    };
    map = createCompatibleMap(parsedMapJson, {}, callback);
  });
};

Hack.loadMap = loadMap;

// Advanced log
Hack.logFunc = logFunc.default;
Hack.logAtPoint = logFunc.logAtPoint;
logFunc.setHeight(180);

// MODs
game.on('awake', stopOnBlur);
game.on('load', coordinate);
