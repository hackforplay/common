import Line from 'hackforplay/shapes/line';

/**
 * @param {CanvasRenderingContext2D} context Context
 * @param {number} x       X
 * @param {number} y       Y
 * @param {number} w       Width
 * @param {number} h       Height
 * @param {number} radius  Radius
 */
export function roundRect(context, x, y, w, h, radius) {
	context.beginPath();
	context.arc(x + radius, y + radius, radius, -Math.PI, -0.5 * Math.PI, false);
	context.arc(x + w - radius, y + radius, radius, -0.5 * Math.PI, 0, false);
	context.arc(x + w - radius, y + h - radius, radius, 0, 0.5 * Math.PI, false);
	context.arc(
		x + radius,
		y + h - radius,
		radius,
		0.5 * Math.PI,
		Math.PI,
		false
	);
	context.closePath();
	return context;
}

/**
 * 線分を描画する
 * @param {CanvasRenderingContext2D} context
 * @param {Line} line
 * @param {number} width
 * @param {string} color
 */
export function drawLine(context, line, width, color) {
	if (width) context.lineWidth = width;
	if (color) context.strokeStyle = color;
	context.beginPath();
	context.moveTo(line.start.x, line.start.y);
	context.lineTo(line.end.x, line.end.y);
	context.stroke();
}

/**
 * 9 分割画像を描画する
 * @param {CanvasRenderingContext2D} context
 * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|ImageBitmap} image
 * @param {number} l LeftWidth
 * @param {number} t TopHeight
 * @param {number} r RightWidth
 * @param {number} b BottomHeight
 * @param {number} w Width
 * @param {number} h Height
 */
export function drawNineSliceImage(context, image, l, t, r, b, w, h) {
	context.save();

	let scaleX = 1;
	let scaleY = 1;

	if (w < l + r) {
		const pw = w;
		w = l + r;
		scaleX = pw / w;
	}

	if (h < t + b) {
		const ph = h;
		h = t + b;
		scaleY = ph / h;
	}

	// 画像の最小サイズより小さく描画するならスケールを調整する
	context.scale(scaleX, scaleY);

	const iw = image.width;
	const ih = image.height;

	/*
	+---+---+---+
	| 1 | 2 | 3 |
	+---+---+---+
	| 4 | 5 | 6 |
	+---+---+---+
	| 7 | 8 | 9 |
	+---+---+---+
	*/

	// 1
	context.drawImage(image, 0, 0, l, t, 0, 0, l, t);
	// 2
	context.drawImage(image, l, 0, iw - l - r, t, l, 0, w - l - r, t);
	// 3
	context.drawImage(image, iw - r, 0, r, t, w - r, 0, r, t);
	// 4
	context.drawImage(image, 0, t, l, ih - t - b, 0, t, l, h - t - b);
	// 5
	context.drawImage(
		image,
		l,
		t,
		iw - r - l,
		ih - t - b,
		l,
		t,
		w - l - r,
		h - t - b
	);
	// 6
	context.drawImage(image, iw - r, t, r, ih - t - b, w - r, t, r, h - t - b);
	// 7
	context.drawImage(image, 0, ih - b, l, b, 0, h - b, l, b);
	// 8
	context.drawImage(image, l, ih - b, iw - l - b, b, l, h - b, w - l - r, b);
	// 9
	context.drawImage(image, iw - r, ih - b, l, b, w - r, h - b, r, b);

	context.restore();
}
