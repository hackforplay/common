import enchant from './enchant';

export default class RPGMap {
	constructor(tileWidth, tileHeight, mapWidth, mapHeight) {
		this.bmap = new enchant.Map(tileWidth, tileHeight);
		this.fmap = new enchant.Map(tileWidth, tileHeight);
		this.cmap = [];

		const w = tileWidth * mapWidth;
		const h = tileHeight * mapHeight;

		this._surface = new enchant.Surface(w, h);
	}
	hitTest(x, y) {
		return this.bmap.hitTest(x, y);
	}
	get width() {
		return this.bmap.width;
	}
	get height() {
		return this.bmap.height;
	}
	get tileWidth() {
		return this.bmap.tileWidth;
	}
	get tileHeight() {
		return this.bmap.tileHeight;
	}
	get cmap() {
		return this.bmap.collisionData;
	}
	set cmap(value) {
		this.bmap.collisionData = value;
	}
	get image() {
		return this.bmap.image;
	}
	set image(value) {
		this.bmap.image = this.fmap.image = value;
	}
}
