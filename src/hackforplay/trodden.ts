import { default as enchant } from '../enchantjs/enchant';
import SAT from '../lib/sat.min';
import BehaviorTypes from './behavior-types';
import { objectsInDefaultMap } from './cache';
import game from './game';
import RPGObject from './object/object';

game.on('enterframe', trodden);

const walkingRPGObjectIds = new Set<number>();
const targetItemSetMap = new WeakMap<RPGObject, Set<RPGObject>>();

/**
 * 1. 任意の RPGObject(item) が Walk から Idle になった (歩き終えた) とき,
 * 2. もし (item) の center がある別の RPGObject(target) の colliders の
 *    いずれかに含まれていたとき, (target) に "addtrodden" イベントを発火する
 * 3. その後, (item) が (target) から離れたとき (target) に "removetrodden" イベントを発火する
 * NOTICE: "removetrodden" イベント中に locate で移動すると, うまく移動できない
 */
export default function trodden() {
  const collection = objectsInDefaultMap();

  // 2
  for (const item of collection) {
    if (
      walkingRPGObjectIds.has(item.id) &&
      item.behavior === BehaviorTypes.Idle
    ) {
      // 1. 歩き終わったタイミングをフックする
      const targets = collection.filter(target => isTrodden(target, item));
      for (const target of targets) {
        dispatch('addtrodden', target, item);
        const itemSet = targetItemSetMap.get(target);
        if (!itemSet) {
          const itemSet = new Set([item]);
          targetItemSetMap.set(target, itemSet);
        } else {
          itemSet.add(item);
        }
      }
      walkingRPGObjectIds.delete(item.id);
    }
  }

  // 3
  // さっきまで踏んでいたオブジェクトが今も残っているか調べる
  // オブジェクトは collection から削除されている可能性があることに注意する
  for (const target of collection) {
    const itemSet = targetItemSetMap.get(target);
    if (itemSet) {
      for (const item of new Set(itemSet)) {
        if (!isTrodden(target, item)) {
          dispatch('removetrodden', target, item);
          itemSet.delete(item);
        }
      }
      if (itemSet.size < 1) {
        targetItemSetMap.delete(target);
      }
    }
  }
}

/**
 * colliders を item が踏んでいるかどうかを調べる
 * @param {RPGObject} target ふまれるかも知れないオブジェクトのコライダー
 * @param {RPGObject} item ふむかも知れないオブジェクト
 */
function isTrodden(target: RPGObject, item: RPGObject) {
  if (
    target === item ||
    target.map !== item.map ||
    !target.parentNode ||
    !item.parentNode
  ) {
    return false;
  }
  const collider = target.collider || target.colliders?.[0];
  const p = new SAT.Vector(item.center.x, item.center.y);
  return collider && SAT.pointInPolygon(p, collider);
}

/**
 * addtrodden または removetrodden イベントを発火させる
 * @param {String} name イベント名
 * @param {RPGObject} target ふまれたオブジェクト
 * @param {RPGObject} item ふんだオブジェクト
 */
function dispatch(name: string, target: RPGObject, item: RPGObject) {
  const event = new enchant.Event(name);
  event.item = item;
  target.dispatchEvent(event);
}

export function unregister() {
  game.off('enterframe', trodden);
}

/**
 * 歩き始めた（何か踏むかもしれない）オブジェクトを登録する
 * @param item 歩き始めたオブジェクト
 */
export function registerWalkingObject(item: RPGObject) {
  walkingRPGObjectIds.add(item.id);
}

export function unregisterWalkingObject(item: RPGObject) {
  walkingRPGObjectIds.delete(item.id);
}
