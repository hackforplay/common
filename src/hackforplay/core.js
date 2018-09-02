import enchant from '../enchantjs/enchant';
import './rpg-kit-main';
import './camera';
import './loader';
import './rpg-kit-rpgobjects';
import './trodden';
import Hack from './hack';
import * as synonyms from './synonyms';
import Skin from './skin';
import Family from './family';
import '../mod/collider-debugger';
import stopOnBlur from '../mod/stop-on-blur';
import * as logFunc from '../mod/logFunc';
import RPGObject from './object/object';
import MapObject from './object/map-object';
import Player from './object/player';
import Effect from './object/effect';
import BehaviorTypes from './behavior-types';
import find from './find';
import Key from './key';
import deprecated from './deprecated';
import createCompatibleMap from './create-compatible-map';

// Global
self.Hack = self.Hack || Hack;
self.Skin = self.Skin || Skin;
self.Family = self.Family || Family;
self.RPGObject = self.RPGObject || RPGObject;
self.BehaviorTypes = self.BehaviorTypes || BehaviorTypes;
self.MapObject = self.MapObject || MapObject;
self.Player = self.Player || Player;
self.Effect = self.Effect || Effect;
self.Key = self.Key || Key;

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
enchant.Core.instance.on('load', checkDeprecated);

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

// Advanced log
Hack.logFunc = logFunc.default;
Hack.logAtPoint = logFunc.logAtPoint;
logFunc.setHeight(180);

// MODs
enchant.Core.instance.on('awake', stopOnBlur);
