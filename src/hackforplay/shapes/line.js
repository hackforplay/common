import Vector2 from 'hackforplay/math/vector2';

class Line {
	constructor(start, end) {
		// 始点
		this.start = start;
		// 終点
		this.end = end;
		// 法線
		this.normal = this.end
			.subtract(this.start)
			.normalize()
			.rotate(-Math.PI / 2);
	}

	/**
	 * 長さ
	 */
	get length() {
		return this.end.subtract(this.start).magnitude();
	}

	/**
	 * 2 つの線分が交差しているか判定する
	 * @param {Line} a
	 * @param {Line} b
	 */
	static intersect(a, b) {
		const x1 = a.start.x;
		const y1 = a.start.y;
		const x2 = a.end.x;
		const y2 = a.end.y;
		const x3 = b.start.x;
		const y3 = b.start.y;
		const x4 = b.end.x;
		const y4 = b.end.y;
		const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
		if (denom == 0) return null;
		const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
		const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
		const vec = new Vector2(x1 + ua * (x2 - x1), y1 + ua * (y2 - y1));
		vec.seg1 = ua >= 0 && ua <= 1;
		vec.seg2 = ub >= 0 && ub <= 1;
		return vec;
	}

	/**
	 * 2 つの線分が同一か判定する
	 * @param {Line} a
	 * @param {Line} b
	 */
	static equal(a, b) {
		if (!a || !b) return false;
		return (
			a.start.x === b.start.x &&
			a.start.y === b.start.y &&
			a.end.x === b.end.x &&
			a.end.y === b.end.y
		);
	}
}

export default Line;
