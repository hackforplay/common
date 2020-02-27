import { log } from '@hackforplay/log';
import RPGObject from './object/object';
import { synonyms } from './synonyms/family';
import { synonymize } from './synonyms/synonymize';

enum Family {
  // Default Families
  Independence = '__Independence',
  Player = 'Player',
  Map = 'Map',
  Player2 = 'Player2',
  Monster = 'Monster'
}

export default synonymize(Family, synonyms, chainedName => {
  const message = `なかま に「${chainedName}」はないみたい`;
  log('error', message, '@hackforplay/common');
});

const servantMasterMap = new WeakMap<RPGObject, RPGObject>(); // 従者関係の参照を保持するマップ

/**
 * item1 と item2 が対立関係にあるかどうか
 * @param {RPGObject} item1 オブジェクト
 * @param {RPGObject} item2 別のオブジェクト
 */
export function isOpposite(item1: RPGObject, item2: RPGObject) {
  if (item1 === item2 || hasContract(item1, item2)) {
    return false; // どちらかが一方の従者である
  }
  if (
    item1.family === Family.Independence ||
    item2.family === Family.Independence
  ) {
    // 独立軍はどのファミリーにも属していない
    return true;
  }
  // 今は文字列で実装されているので単純な比較を行う
  return item1.family !== item2.family;
}

/**
 * どちらかがどちらかのマスターになっているかどうかを調べる
 * @param {RPGObject} item1
 * @param {RPGObject} item2
 */
export function hasContract(item1: RPGObject, item2: RPGObject) {
  return isMaster(item1, item2) || isMaster(item2, item1);
}

/**
 *
 * @param {RPGObject} master マスターかもしれないオブジェクト
 * @param {RPGObject} servant サーヴァントかもしれないオブジェクト
 */
export function isMaster(master: RPGObject, servant: RPGObject): boolean {
  // servant => master => master's master... を再帰的に調べる
  const actualMaster = servantMasterMap.get(servant); // 直属のマスター
  // master が直属のマスターであるか, あるいは直属のマスターと契約関係にあるか
  return (
    actualMaster !== undefined &&
    (actualMaster === master || isMaster(master, actualMaster))
  );
}

export function getMaster(servant: RPGObject) {
  return servantMasterMap.get(servant);
}

/**
 * master を servant の従者オブジェクト (かつ同じファミリー) として登録する
 * @param {RPGObject} master マスターになるオブジェクト
 * @param {RPGObject} servant サーヴァントになるオブジェクト
 */
export function registerServant(master: RPGObject, servant: RPGObject) {
  // [servant] => master の参照を記録する
  servantMasterMap.set(servant, master);
  // master と同じファミリーに所属させる
  servant.family = master.family;
}

/**
 * master を servant の従者オブジェクトではなくする
 * @param {RPGObject} master マスターだったオブジェクト
 * @param {RPGObject} servant サーヴァントだったオブジェクト
 */
export function unregisterServant(master: RPGObject, servant: RPGObject) {
  if (servantMasterMap.get(servant) === master) {
    // [servant] => master の参照を削除
    servantMasterMap.delete(servant);
  }
}
