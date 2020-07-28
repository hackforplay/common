import { Rectangle } from 'pixi.js';

export function computeFrame(
  frame: number,
  tileWidth: number,
  tileHeight: number,
  textureWidth: number,
  textureHeight: number
) {
  if (Number.isNaN(frame)) return Rectangle.EMPTY;

  const row = tileWidth / textureWidth;
  const frameLeft = (frame % row) * textureWidth;
  const frameTop = ((frame / row) * tileHeight) % textureHeight;

  return new Rectangle(frameLeft, frameTop, tileWidth, tileHeight);
}
