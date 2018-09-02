import 'enchantjs/enchant';
import 'enchantjs/ui.enchant';
import 'hackforplay/hack';

/**
 * Image Processing
 * argument Surface property mainColor
 * method of get representative color
 */
Object.defineProperties(enchant.Sprite.prototype, {
	color: {
		configurable: true,
		enumerable: true,
		get: function() {
			return this._color || this.originalColor;
		},
		set: function(color) {
			if (!this.originalTexture) {
				this.originalTexture = this.image;
			}

			if (color === 'original') {
				this.image = this._origin || this.image;
			} else if (this.color) {
				color = Hack.css2rgb(color);
				if (color.join(' ') !== this.color.join(' ')) {
					this.moveColor(this.originalColor, (this._color = color));
				}
			}
		}
	},
	originalColor: {
		configurable: true,
		enumerable: true,
		get: function() {
			if (!this.image) return null;
			if (
				!this._originalColor &&
				'number' === typeof this.image.width // Is load completely?
			) {
				// limited 432*192 size
				if (this.image.width * this.image.height <= 82944) {
					var i = this.image.context ? this.image : this.image.clone();
					var res = i.context.getImageData(0, 0, i.width, i.height);
					this._originalColor = getRepresentativeColor(res.data);
				} else {
					this._originalColor = null;
				}
			}
			return this._originalColor;
		},
		set: function(color) {
			this._originalColor = Hack.css2rgb(color);
		}
	}
});
// 代表色を抽出
function getRepresentativeColor(data) {
	// RGB色空間Viに存在するピクセルの数をカウント
	var space = [],
		palette = [];
	for (var index = data.length - 4; index >= 0; index -= 4) {
		if (data[index + 3] > 0) {
			var rgb = Array.prototype.slice.call(data, index, index + 3).join(' ');
			if (palette.indexOf(rgb) === -1) palette.push(rgb);
			var i = palette.indexOf(rgb);
			space[i] = (space[i] >> 0) + 1;
		}
	}
	var black = palette.indexOf('0 0 0');
	if (black !== -1) space[black] = 0; // 黒は輪郭線として代表色にはさせない
	var max = Math.max.apply(null, space);
	return space.length > 0
		? palette[space.indexOf(max)].split(' ').map(function(s) {
				return s >> 0;
		  })
		: null;
}
/**
 * RGB色空間上で、beforeからafterへ線形変換する
 * @scope Sprite
 * before, after: CSS color or [r, g, b]
 */
enchant.Sprite.prototype.moveColor = function(before, after) {
	// Color convert
	before = Hack.css2rgb(before);
	after = Hack.css2rgb(after);
	// Transfer
	this._origin = this._origin || this.image; // 元画像を参照
	this.image = this._origin.clone(); // 他のSpriteに影響を与えないようコピー
	var imageData = this.image.context.getImageData(
			0,
			0,
			this.image.width,
			this.image.height
		),
		data = imageData.data;
	var filter = [0, 0, 0].map(function(_, c) {
		var scaleL = after[c] / before[c];
		var scaleR = (255 - after[c]) / (255 - before[c]);
		return new Array(256).fill(0).map(function(e, i) {
			return i < before[c] ? i * scaleL : 255 - (255 - i) * scaleR;
		});
	});
	for (var index = data.length - 4; index >= 0; index -= 4) {
		if (data[index + 3] > 0) {
			data[index + 0] = filter[0][data[index + 0]];
			data[index + 1] = filter[1][data[index + 1]];
			data[index + 2] = filter[2][data[index + 2]];
		}
	}
	this.image.context.putImageData(imageData, 0, 0);
};

function rgb256toNum64(r, g, b) {
	if (arguments[0] instanceof Array) {
		return rgb256toNum64.call(
			null,
			arguments[0][0],
			arguments[0][1],
			arguments[0][2]
		);
	}
	var R2 = (r >> 6) & 3; // 2bits of R
	var G2 = (g >> 6) & 3;
	var B2 = (b >> 6) & 3;
	return (R2 << 4) | (G2 << 2) | B2; // RRGGBB 6bit value
}
