import { Core } from '../enchantjs/enchant';
import Hack from '../hackforplay/hack';
import RPGObject from '../hackforplay/object/object';

const game = Core.instance;

game.on('awake', () => {
	Hack.world.on('postrender', render);
});

function render(event) {
	if (!game._debug) return; // for debug only

	const { context } = event.canvasRenderer.targetSurface;
	for (const item of RPGObject.collection) {
		const colliders = item.colliders || [item.collider];
		for (const collider of colliders) {
			// if (width) context.lineWidth = width;
			context.beginPath();
			const [start, ...points] = collider.calcPoints;
			const { x, y } = collider.pos;
			context.moveTo(start.x + x, start.y + y);
			for (const point of points) {
				context.lineTo(point.x + x, point.y + y);
			}
			context.fillStyle = item.isDamageObject
				? 'rgba(255, 0, 0, 0.5)'
				: 'rgba(255, 255, 255, 0.5)';
			context.fill();
		}
	}
}
