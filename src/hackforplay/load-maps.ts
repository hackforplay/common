import { log } from '@hackforplay/log';
import createCompatibleMap from './create-compatible-map';
import { fetchText } from './feeles';
import { getHack } from './get-hack';
import RPGMap from './rpg-map';
import { SystemError } from './stdlog';

const Hack = getHack();

const rpgMaps = new Map<string, RPGMap>();

let fallbackMapJson: string | undefined = undefined;
/**
 * 生成されたマップを取得するか、存在しなければ fallback を生成する
 * @param mapName 取得したいマップの名前
 * @param callback 描画かかる時間を待ちたい場合は callback を使う
 */
export function getMap(mapName: string, callback?: (map: RPGMap) => void) {
  const loaded = rpgMaps.get(mapName);
  if (loaded) {
    callback?.(loaded);
    return loaded;
  }

  // fallback map を作って返す
  if (!fallbackMapJson) {
    throw new SystemError('デフォルトマップを読み込めませんでした');
  }
  const map = createCompatibleMap(JSON.parse(fallbackMapJson), {}, () => {
    callback?.(map);
  });
  rpgMaps.set(mapName, map);
  Hack.maps[mapName] = map; // backword compatibility
  return map;
}

let loadMapsPromise: Promise<unknown> | undefined = undefined;
/**
 * 全てのマップをプリロードする。一度コールしたら結果をキャッシュする
 * @param mapJsonFile マップ定義ファイルの名前
 */
export function loadMaps(mapJsonFile = 'maps.json') {
  loadMapsPromise = loadMapsPromise ?? loadMapsImpl(mapJsonFile);
  return loadMapsPromise;
}

async function loadMapsImpl(mapJsonFile: string) {
  console.log('loadMapImpl');
  if (!fetchText) {
    throw new Error('feeles.fetchText が取得できません');
  }

  try {
    // maps.json を参照してマップを構築する
    const mapsJson = await fetchText(mapJsonFile);
    try {
      const maps = JSON.parse(mapsJson);

      const promises = [
        fetchText(maps.fallback).then(json => {
          fallbackMapJson = json; // 設定されていないマップに行った時に使うマップ定義
        })
      ];

      // その他のマップ定義ファイルのロードを開始
      for (const key of Object.keys(maps.files)) {
        const scopedKey = key;
        const loading = fetchText(maps.files[key])
          .then(makeMap)
          .then(map => {
            Hack.maps = Hack.maps ?? {};
            Hack.maps[scopedKey] = map;
          });
        promises.push(loading);
      }
      await Promise.all(promises); // 全てのロードが終わるまで待つ
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

async function makeMap(mapJson: string) {
  return new Promise<RPGMap>(resolve => {
    const parsedMapJson = JSON.parse(mapJson);
    const map = createCompatibleMap(parsedMapJson, {}, () =>
      resolve(map)
    ) as RPGMap;
  });
}
