/* global feeles */

import createCompatibleMap from './create-compatible-map';
import RPGMap from './rpg-map';
import Hack from './hack';

const feeles = (<any>window).feeles;
const _cache: { [key: string]: Promise<RPGMap> } = {};
let definitions: { [key: string]: Promise<string> } = {}; // File path of map definition

export default async function loadMaps(mapJsonFile: string) {
  if (!feeles) return;
  try {
    // maps.json を参照してマップを構築する
    const mapsJson = await feeles.fetchText(mapJsonFile);
    try {
      const maps = JSON.parse(mapsJson);
      // 設定されていないマップに行った時に使うマップ定義
      Hack.fallbackMapJson = await feeles.fetchText(maps.fallback);
      // その他のマップ定義ファイルのロードを開始
      for (const key of Object.keys(maps.files)) {
        definitions[key] = feeles.fetchText(maps.files[key]);
      }
    } catch (error) {
      console.error('Error: Invalid maps.json', mapsJson);
      feeles.throwError(new Error(error));
    }
  } catch (error) {
    console.error('Error: maps.json がありません');
    feeles.throwError(new Error(error));
  }
}

export function generateMapFromDefinition(
  mapName: string,
  setAsDefault = false
) {
  _cache[mapName] = _cache[mapName] || loadMap(mapName, setAsDefault);
  return _cache[mapName];
}

async function loadMap(mapName: string, setAsDefault = false): Promise<RPGMap> {
  // definition(JSON) を取得
  const mapJson = definitions[mapName]
    ? await definitions[mapName]
    : Hack.fallbackMapJson;
  if (!mapJson) {
    throw new Error('Hack.fallbackMapJson がありません');
  }

  return new Promise(resolve => {
    const parsedMapJson = JSON.parse(mapJson);
    const map = createCompatibleMap(parsedMapJson, {}, () =>
      resolve(map)
    ) as RPGMap;
    Hack.maps = Hack.maps || {};
    Hack.maps[mapName] = map;
    if (setAsDefault) {
      Hack.map = map;
      Hack.defaultParentNode = map.scene;
    }
  });
}
