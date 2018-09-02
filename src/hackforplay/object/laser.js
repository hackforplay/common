import Vector2 from 'hackforplay/math/vector2';
import Line from 'hackforplay/shapes/line';
import { Surface, Event } from 'enchantjs/enchant';
import RPGObject from './object';
import { drawLine } from 'hackforplay/utils/canvas2d-utils';
import { reflect } from 'hackforplay/utils/math-utils';
import SAT from 'lib/sat.min';

/**
 * レーザー
 */
class Laser extends RPGObject {
	constructor({ origin, direction, length, speed, thickness, color, damage }) {
		super();

		const w = Hack.map.width;
		const h = Hack.map.height;
		this.image = new Surface(w, h);
		this.context = this.image.context;

		this.length = length;
		this.speed = speed;
		this.thickness = thickness;
		this.position = 0;
		this.points = [];

		Object.defineProperty(this, 'color', { value: color });

		this.points = [
			{
				point: origin,
				direction: direction.normalize(),
				position: 0,
				targetLines: []
			}
		];

		// デバッグモード
		this.debug = false;

		this.on('enterframe', this.update);
		this.on('prerender', this.render);

		this.moveTo(0, 0);
		this.width = w;
		this.height = h;

		this.damage = damage;
		this.mod(Hack.createDamageMod(this.damage));
	}

	update() {
		const context = this.context;
		const reflectionLines = Hack.map.reflectionLines;

		this.position += this.speed;

		// 最後に衝突した点
		const lastReflectionPoint = this.points[this.points.length - 1];

		// 既に計算済みの位置なら無視
		if (this.position <= lastReflectionPoint.position) return;

		const newLine = new Line(
			lastReflectionPoint.point,
			lastReflectionPoint.point.add(
				lastReflectionPoint.direction
					.normalize()
					.scale(this.position - lastReflectionPoint.position)
			)
		);

		let currentLength = this.position - lastReflectionPoint.position;

		(function check(newLine) {
			const start = newLine.start;
			const points = [];
			const lastReflectionPoint = this.points[this.points.length - 1];

			// 同じラインで反射が重複しないようにする
			const checkLines = reflectionLines.filter(line => {
				return !lastReflectionPoint.targetLines.some(targetLine =>
					Line.equal(line, targetLine)
				);
			});

			// 反射ラインと衝突チェックを行う（ただし最後に衝突したラインは除く）
			for (const line of checkLines) {
				const result = Line.intersect(line, newLine);
				if (!result) continue;
				if (result.seg1 && result.seg2) {
					result.line = line;
					points.push(result);
				}
			}

			// 衝突しなかった
			if (!points.length) return;

			for (const point of points) {
				point._distance = start.distance(point);
			}

			points.sort((a, b) => a._distance - b._distance);

			// 一番近い衝突点
			const collidedPoint = points[0];

			// 無限ループ対策
			if (Vector2.equal(collidedPoint, lastReflectionPoint.point)) {
				lastReflectionPoint.targetLines.push(collidedPoint.line);
				lastReflectionPoint.direction = lastReflectionPoint.direction.rotate(
					Math.PI / 2
				);
				check.call(this, newLine);
				return;
			}

			// 反射ベクトル
			let reflectDirection = reflect(
				newLine.end.subtract(newLine.start),
				collidedPoint.line.normal
			);

			// 残りの長さ
			currentLength -= collidedPoint._distance;

			// 反射
			if (currentLength <= this.speed) {
				let isCancel = false;
				const reflectionCount = this.points.length;
				const newLineDirection = newLine.end
					.subtract(newLine.start)
					.normalize();
				if (reflectionCount) {
					this.dispatchEvent(
						new Event('reflect', {
							count: reflectionCount,
							reflectDirection: reflectDirection,
							lineDirection: newLineDirection,
							cancel: () => (isCancel = true),
							setReflectDirection: newReflectDirection => {
								reflectDirection = newReflectDirection;
							}
						})
					);
				}
				const lastReflectionPoint = this.points[this.points.length - 1];

				// 反射点を追加する
				this.points.push({
					point: collidedPoint,
					direction: reflectDirection.normalize(),
					targetLines: [collidedPoint.line],
					// 最後にぶつかった点との距離
					position:
						lastReflectionPoint.position +
						collidedPoint.subtract(lastReflectionPoint.point).magnitude()
				});

				// 反射しなかったことにする
				if (isCancel) {
					this.points[this.points.length - 1].direction = newLineDirection;
				}
			}

			if (currentLength <= 0) return;

			// 反射後の線分で再計算
			check.call(
				this,
				new Line(
					collidedPoint,
					collidedPoint.add(reflectDirection.scale(currentLength))
				)
			);
		}.call(this, newLine));

		this.updateCollider();
	}

	updateCollider() {
		const points = this.getRenderPoints();

		this.colliders = [];

		for (let i = 0; i < points.length - 1; ++i) {
			const p1 = points[i];
			const p2 = points[i + 1];

			const dir1 = p2
				.subtract(p1)
				.normalize()
				.rotate(Math.PI / 2);
			const dir2 = p2
				.subtract(p1)
				.normalize()
				.rotate(-Math.PI / 2);

			const t = this.thickness / 2;

			this.colliders.push(
				new SAT.Polygon(new SAT.Vector(), [
					p1.add(dir1.scale(t)).toSAT(),
					p1.add(dir2.scale(t)).toSAT(),
					p2.add(dir2.scale(t)).toSAT(),
					p2.add(dir1.scale(t)).toSAT()
				])
			);
		}
	}

	getRenderPoints() {
		const points = [];

		const startPosition = Math.max(this.position - this.length, 0);
		const endPosition = Math.max(this.position, 0);

		if (startPosition === endPosition) {
			// 描画しない
		} else if (this.points.length === 1) {
			// まだ反射してない場合は原点から計算する
			points.push(
				this.points[0].point.add(
					this.points[0].direction.normalize().scale(startPosition)
				)
			);
			points.push(
				this.points[0].point.add(
					this.points[0].direction.normalize().scale(endPosition)
				)
			);
		} else {
			// 反射点を繋ぐ
			if (startPosition === 0) {
				points.push(this.points[0].point);
			}
			let isEnd = false;
			let isStart = false;
			for (let i = 0; i < this.points.length - 1; ++i) {
				const p1 = this.points[i];
				const p2 = this.points[i + 1];
				if (p1.position <= startPosition && p2.position > startPosition) {
					points.push(
						p1.point.add(
							p1.direction.normalize().scale(startPosition - p1.position)
						)
					);
					isStart = true;
				}
				if (p1.position <= endPosition && p2.position > endPosition) {
					points.push(
						p1.point.add(
							p1.direction.normalize().scale(endPosition - p1.position)
						)
					);
					isEnd = true;
					break;
				}
				if (isStart) points.push(p2.point);
			}
			const lastReflectionPoint = this.points[this.points.length - 1];
			if (!isStart) {
				points.push(
					lastReflectionPoint.point.add(
						lastReflectionPoint.direction.scale(
							startPosition - lastReflectionPoint.position
						)
					)
				);
			}
			if (!isEnd) {
				points.push(
					lastReflectionPoint.point.add(
						lastReflectionPoint.direction.scale(
							endPosition - lastReflectionPoint.position
						)
					)
				);
			}
		}
		return points;
	}

	render() {
		const context = this.context;

		context.clearRect(0, 0, this.width, this.height);

		// 反射線を描画する
		if (this.debug) {
			for (const line of Hack.map.reflectionLines) {
				drawLine(context, line, 1, '#000');
				const center = line.start.add(line.end.subtract(line.start).scale(0.5));
				drawLine(context, new Line(center, center.add(line.normal.scale(10))));
			}
		}

		if (!this.points.length) return;

		const points = this.getRenderPoints();

		// レーザーを描画する
		if (points.length >= 2) {
			// 全ての点が描画範囲外ならレーザーを削除
			const box = new SAT.Box(
				new SAT.V(0, 0),
				this.width,
				this.height
			).toPolygon();
			const isDestory = points.every(
				({ x, y }) => !SAT.pointInPolygon(new SAT.V(x, y), box)
			);
			if (isDestory) return this.setTimeout(this.destroy, 1);

			context.beginPath();
			context.moveTo(points[0].x, points[0].y);
			for (const point of points.slice(1)) {
				context.lineTo(point.x, point.y);
			}

			this.stroke(context);
		}
	}

	/**
	 *
	 * @param {CanvasRenderingContext2D} context
	 */
	stroke(context) {
		context.lineCap = 'round';

		context.strokeStyle = this.color;
		context.lineWidth = this.thickness;
		context.stroke();
	}
}

export default Laser;
