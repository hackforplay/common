import createCompatibleMap from './create-compatible-map';
import { fetch } from './feeles';
import Hack from './hack';

/**
 * マップJSONをインターネットから取得してマップにセットする
 * @param {String} mapName セットしたいマップの名前
 * @param {String} url URL
 */
export default async function loadMap(mapName, url) {
  if (!mapName) {
    throw new TypeError(
      'Hack.loadMap: mapName must be string and not be empty'
    );
  }
  const res = await fetch(url);
  const json = await res.text();
  const scene = JSON.parse(json);

  return new Promise(resolve => {
    const newMap = createCompatibleMap(scene, {}, () => {
      if (Hack.map && Hack.map.name === mapName) {
        // 今いるマップが上書きされた
        const r = n => n.parentNode.removeChild(n);
        r(Hack.map.bmap);
        r(Hack.map.scene);
        r(Hack.map.fmap);
        newMap.load();
      }
      resolve();
    });
    Hack.maps = Hack.maps || {};
    Hack.maps[mapName] = newMap;
  });
}
