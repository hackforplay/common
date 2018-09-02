import enchant from '../../enchantjs/enchant';
import RPGObject from './object';
import SAT from '../../lib/sat.min';

class Effect extends RPGObject {
	constructor(velocityX, velocityY, lifetime, randomize) {
		super();
		this.width = 32;
		this.height = 32;
		this.image = enchant.Core.instance.assets['enchantjs/x2/effect0.png'];
		this.isKinematic = false;
		this.velocity(velocityX, velocityY);
		var frame = new Array(lifetime);
		for (var i = frame.length - 1; i >= 0; i--) {
			frame[i] = ((i / lifetime) * 5) >> 0;
		}
		this.frame = frame;
		this.destroy(frame.length);
		if (randomize) {
			this._random = {
				x: velocityX * 10 * Math.random(),
				y: velocityY * 10 * Math.random()
			};
			this.velocityX *= 0.5 + Math.random();
			this.velocityY *= 0.5 + Math.random();
		}
		this.collider = new SAT.Box(new SAT.V(0, 0), 28, 28).toPolygon();
		this.collider.setOffset(new SAT.V(2, 2));
	}

	locate(left, top, effect) {
		super.locate(left, top, effect);
		if (this._random) {
			this.moveBy(this._random.x, this._random.y);
		}
	}
}

export default Effect;
