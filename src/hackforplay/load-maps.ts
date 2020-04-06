import { log } from '@hackforplay/log';
import createCompatibleMap from './create-compatible-map';
import { fetchText } from './feeles';
import { getHack } from './get-hack';
import RPGMap from './rpg-map';

const Hack = getHack();

const _cache: { [key: string]: Promise<RPGMap> } = {};
const definitions: { [key: string]: Promise<string> } = {}; // File path of map definition

export default async function loadMaps(mapJsonFile: string) {
  if (!fetchText) return;

  try {
    // maps.json を参照してマップを構築する
    const mapsJson = await fetchText(mapJsonFile);
    try {
      const maps = JSON.parse(mapsJson);
      // 設定されていないマップに行った時に使うマップ定義
      Hack.fallbackMapJson = await fetchText(maps.fallback);
      // その他のマップ定義ファイルのロードを開始
      for (const key of Object.keys(maps.files)) {
        definitions[key] = fetchText(maps.files[key]);
      }
    } catch (error) {
      log(
        'error',
        'maps.json がおかしいみたい。ためしにマップをかえてみて！',
        '@hackforplay/common'
      );
      console.error(mapsJson);
    }
  } catch (error) {
    log(
      'error',
      'maps.json がないみたい。ためしにマップをかえてみて！',
      '@hackforplay/common'
    );
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
    const map =
      createCompatibleMap(parsedMapJson, {}, () => resolve(map)) as RPGMap;
    Hack.maps = Hack.maps || {};
    Hack.maps[mapName] = map;
    if (setAsDefault) {
      Hack.map = map;
      Hack.defaultParentNode = map.scene;
    }
  });
}
