import SAT from '../lib/sat.min';
import enchant from '../enchantjs/enchant';
import './enchantjs-kit';
import RPGObject from './object/object';
import BehaviorTypes from './behavior-types';

const game = enchant.Core.instance;
game.on('enterframe', trodden);

const walkingRPGObjects = new WeakSet();
const targetItemSetMap = new WeakMap();

/**
 * 1. 任意の RPGObject(item) が Walk から Idle になった (歩き終えた) とき,
 * 2. もし (item) の center がある別の RPGObject(target) の colliders の
 *    いずれかに含まれていたとき, (target) に "addtrodden" イベントを発火する
 * 3. その後, (item) が (target) から離れたとき (target) に "removetrodden" イベントを発火する
 * NOTICE: "removetrodden" イベント中に locate で移動すると, うまく移動できない
 */
export default function trodden() {
	const collection = [...RPGObject.collection];

	// 2
	for (const item of collection) {
		if (walkingRPGObjects.has(item) && item.behavior === BehaviorTypes.Idle) {
			const targets = collection.filter(target => isTrodden(target, item));
			for (const target of targets) {
				dispatch('addtrodden', target, item);
				if (!targetItemSetMap.has(target)) {
					const itemSet = new Set();
					itemSet.add(item);
					targetItemSetMap.set(target, itemSet);
				} else {
					const itemSet = targetItemSetMap.get(target);
					itemSet.add(item);
				}
			}
		}
	}

	// 3
	// さっきまで踏んでいたオブジェクトが今も残っているか調べる
	// オブジェクトは collection から削除されている可能性があることに注意する
	for (const target of collection) {
		if (targetItemSetMap.has(target)) {
			const itemSet = targetItemSetMap.get(target);
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
function isTrodden(target, item) {
	if (
		target === item ||
		!RPGObject.collection.includes(target) ||
		!RPGObject.collection.includes(item)
	) {
		return false;
	}
	const colliders = target.colliders || [target.collider];
	const p = new SAT.Vector(item.center.x, item.center.y);
	return colliders.some(poly => SAT.pointInPolygon(p, poly));
}

/**
 * addtrodden または removetrodden イベントを発火させる
 * @param {String} name イベント名
 * @param {RPGObject} target ふまれたオブジェクト
 * @param {RPGObject} item ふんだオブジェクト
 */
function dispatch(name, target, item) {
	const event = new Event(name);
	event.item = item;
	target.dispatchEvent(event);
}

export function unregister() {
	game.off('enterframe', trodden);
}
