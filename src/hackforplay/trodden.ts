import { default as enchant } from '../enchantjs/enchant';
import SAT from '../lib/sat.min';
import BehaviorTypes from './behavior-types';
import game from './game';
import Hack from './hack';
import RPGObject from './object/object';

game.on('enterframe', trodden);

const walkingRPGObjects = new WeakSet<RPGObject>();
const targetItemSetMap = new WeakMap<RPGObject, Set<RPGObject>>();

/**
 * 1. 任意の RPGObject(item) が Walk から Idle になった (歩き終えた) とき,
 * 2. もし (item) の center がある別の RPGObject(target) の colliders の
 *    いずれかに含まれていたとき, (target) に "addtrodden" イベントを発火する
 * 3. その後, (item) が (target) から離れたとき (target) に "removetrodden" イベントを発火する
 * NOTICE: "removetrodden" イベント中に locate で移動すると, うまく移動できない
 */
export default function trodden() {
  const collection = [...RPGObject.collection].filter(
    item => item.map === Hack.map
  );

  // 2
  for (const item of collection) {
    if (walkingRPGObjects.has(item) && item.behavior === BehaviorTypes.Idle) {
      const targets = collection.filter(target => isTrodden(target, item));
      for (const target of targets) {
        dispatch('addtrodden', target, item);
        const itemSet = targetItemSetMap.get(target);
        if (!itemSet) {
          const itemSet = new Set();
          itemSet.add(item);
          targetItemSetMap.set(target, itemSet);
        } else {
          itemSet.add(item);
        }
      }
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

  // 1
  for (const item of collection) {
    if (item.behavior === BehaviorTypes.Walk) {
      walkingRPGObjects.add(item);
    } else {
      walkingRPGObjects.delete(item);
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
    !RPGObject.collection.includes(target) ||
    !RPGObject.collection.includes(item)
  ) {
    return false;
  }
  const colliders: any[] = target.colliders || [target.collider];
  const p = new SAT.Vector(item.center.x, item.center.y);
  return colliders.some(poly => SAT.pointInPolygon(p, poly));
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