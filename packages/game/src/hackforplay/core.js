import { log } from '@hackforplay/log';
import '../mod/collider-debugger';
import coordinate from '../mod/coordinate';
import * as logFunc from '../mod/logFunc';
import './camera';
import createCompatibleMap from './create-compatible-map';
import { damageUpdate } from './damage-update';
import deprecated from './deprecated';
import { setTimeout } from './feeles';
import find from './find';
import game from './game';
import { getHack } from './get-hack';
import loadMap from './load-map';
import { loadMaps } from './load-maps';
import './loader';
import { physicsCollision, physicsUpdate } from './physics-update';
import './rpg-kit-main';
import { audioConfigs, getConfig } from './se-data';
import { getBaseUrl, getSkin, setBaseUrl } from './skin';
import './trodden';

const Hack = getHack();

// Notice to deprecated event
function checkDeprecated() {
  const message = deprecated();
  if (message) {
    console.error(message);
  } else {
    // また調べる
    setTimeout(checkDeprecated, 1000);
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
    const callback = () => resolve(map);
    map = createCompatibleMap(parsedMapJson, {}, callback);
    if (mapName) {
      Hack.maps = Hack.maps || {};
      Hack.maps[mapName] = map;
    }
  });
};

Hack.loadMap = loadMap;

Hack.loadMaps = loadMaps;

// Advanced log
Hack.logFunc = logFunc.default;
Hack.logAtPoint = logFunc.logAtPoint;
logFunc.setHeight(180);

// MODs
game.once('load', coordinate);

// patch to FireFox space key page down
window.onkeydown = event => !(event.key === ' ');

/**
 * Hack.createDamageMod
 */
Hack.createDamageMod = () =>
  log('error', 'Hack.createDamageMod is removed.', '@hackforplay/common');

/**
 * Hack.skin
 */
Hack.skin = getSkin;
/**
 * Hack.baseUrl
 */
Object.defineProperty(Hack, 'baseUrl', {
  enumerable: true,
  configurable: true,
  get: getBaseUrl,
  set: setBaseUrl
});

/**
 * Hack.audioConfigs
 */
Hack.audioConfigs = audioConfigs;
/**
 * Hack.getAudioConfig
 */
Hack.getAudioConfig = getConfig;

game.on('enterframe', physicsUpdate);
game.on('enterframe', damageUpdate);
game.on('enterframe', physicsCollision);
