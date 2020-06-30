import { objectsInDefaultMap } from '../hackforplay/cache';
import game from '../hackforplay/game';
import { getHack } from '../hackforplay/get-hack';

game.on('awake', () => {
  const Hack = getHack();
  Hack.world.on('postrender', render);
});

function render(event) {
  if (!game._debug) return; // for debug only

  const { context } = event.canvasRenderer.targetSurface;
  for (const item of objectsInDefaultMap()) {
    const collider = item.collider || item.colliders?.[0];
    if (!collider) {
      continue;
    }
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
