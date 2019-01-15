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
      // 設定されていないマップに行った時
      Hack.fallbackMapName = maps.fallback;
      Hack.maps[maps.fallback] = await loadMap(
        await feeles.fetchText(maps.fallback)
      );
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

function loadMap(mapJson: string): Promise<RPGMap> {
  const parsedMapJson = JSON.parse(mapJson);
  return new Promise(resolve => {
    const map = createCompatibleMap(parsedMapJson, {}, () =>
      resolve(map)
    ) as RPGMap;
  });
}
