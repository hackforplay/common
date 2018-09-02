import Vector2 from 'hackforplay/math/vector2';

class Range extends Array {
	constructor(...args) {
		super(...args);
	}
	get min() {
		return this[0];
	}
	get max() {
		return this[this.length - 1];
	}
	get range() {
		return [this.min, this.max];
	}
}

export function step(n) {
	return new Range(...Array.from({ length: n }).map((_, i) => i));
}

export function range(start, count) {
	return step(count).map(value => start + value);
}

export function between(value, min, max) {
	return value >= min && value <= max;
}

export function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

/**
 * 反射ベクトルを算出する
 * @param {Vector2} v
 * @param {Vector2} n
 */
export function reflect(v, n) {
	v = [v.x, v.y];
	n = [n.x, n.y];
	var d = v[0] * n[0] + v[1] * n[1];
	return new Vector2(v[0] - 2.0 * d * n[0], v[1] - 2.0 * d * n[1]).normalize();
}
