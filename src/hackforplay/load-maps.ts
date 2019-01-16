/* global feeles */

import createCompatibleMap from './create-compatible-map';
import RPGMap from './rpg-map';
import Hack from './hack';

const feeles = (<any>window).feeles;

export default async function loadMaps(mapJsonFile: string) {
  if (!feeles) return;
  try {
    // maps.json を参照してマップを構築する
    const mapsJson = await feeles.fetchText(mapJsonFile);
    try {
      const maps = JSON.parse(mapsJson);
      // 設定されていないマップに行った時に使うマップ定義
      Hack.fallbackMapJson = await feeles.fetchText(maps.fallback);
      // マップの背景を設定
      for (const key of Object.keys(maps.files)) {
        Hack.maps[key] = await loadMap(await feeles.fetchText(maps.files[key]));
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

const _cache: { [key: string]: Promise<RPGMap> } = {};

export function generateMapFromFallback(mapName: string, setAsDefault = false) {
  if (!Hack.fallbackMapJson) {
    throw new Error('Hack.fallbackMapJson がありません');
  }
  _cache[mapName] =
    _cache[mapName] || loadMap(Hack.fallbackMapJson, setAsDefault);
  return _cache[mapName];
}

function loadMap(mapJson: string, setAsDefault = false): Promise<RPGMap> {
  const parsedMapJson = JSON.parse(mapJson);
  return new Promise(resolve => {
    const map = createCompatibleMap(parsedMapJson, {}, () =>
      resolve(map)
    ) as RPGMap;
    if (setAsDefault) {
      Hack.map = map;
      Hack.defaultParentNode = map.scene;
    }
  });
}
