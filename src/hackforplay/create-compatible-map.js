export const size = 32;

// 依存の注入
let Surface;
let RPGMap;
let Image;

/**
 * 新しいマップエディタで書き出されたデータをパースして, 今までの RPGMap と互換性のあるオブジェクトを出力する
 * @param {Object} mapJson マップエディタで出力されるマップデータ
 * @param {Object} injection ユニットテストのための機能
 * @param {Function} callback 画像の書き込みが終わったらコールされる
 */
export default function createCompatibleMap(
	mapJson,
	injection = {},
	callback = () => {}
) {
	// 依存の注入
	Surface =
		Surface || injection.Surface || require('../enchantjs/enchant').Surface;
	RPGMap = RPGMap || injection.RPGMap || require('./rpg-map').default;
	Image = Image || injection.Image || window.Image;
	// 大きさを割り出す
	const height = mapJson.tables[0].length;
	const width = mapJson.tables[0][0].length;
	// { [key: number]: Square } にリマップ
	const indexSquareMap = [];
	for (const square of mapJson.squares) {
		indexSquareMap[square.index] = square;
	}
	// スクエアが存在しない場合のエラーメッセージ
	const notFound = (table, x, y) =>
		`${index[y][x]}番のスクエアは存在しません Table[${mapJson.tables.indexOf(
			table
		)}](${x},${y})`;

	// cmap は collider の少なくとも１辺が true だった場合に 1, そうでない時に 0 になる
	const cmap = [];
	for (let y = 0; y < height; y++) {
		cmap[y] = [];
		for (let x = 0; x < width; x++) {
			cmap[y][x] = 0; // デフォルトは 0
			// 全ての階層を手前から奥に向かって調べる
			for (const table of mapJson.tables) {
				const index = table[y][x];
				if (index < 0) continue; // nope!
				const square = indexSquareMap[index];
				if (!square) {
					throw new Error(notFound(index, x, y));
				}
				// 最も手前の結果が優先される
				const collider = getCollider(square.placement);
				if (collider > -1) {
					cmap[y][x] = collider;
					break;
				}
			}
		}
	}

	// 画像を書き出すためのバッファ. 出力は enchant.Surface
	// 複数のタイルを加算描画する場合もあるため, まだ Canvas を生成できない
	const buffer = new RPGMapImageBuffer(indexSquareMap, callback);

	/**
	 * fmap, bmap の描画
	 * 基本的には, 'Above' は fmap, それ以外は bmap に描画する
	 * ただし, 'Inherit' は下のタイルと同じ xmap に描画する
	 */
	const bmap = [];
	const fmap = [];
	for (let y = 0; y < height; y++) {
		fmap[y] = [];
		bmap[y] = [];
		for (let x = 0; x < width; x++) {
			fmap[y][x] = bmap[y][x] - 1; // デフォルト
			// [y][x] のタイルをひとつの配列にする
			const tileIndexes = mapJson.tables.reduce((p, table) => {
				const index = table[y][x];
				if (index < 0) return p; // nope!
				const square = indexSquareMap[index];
				if (!square) {
					throw new Error(notFound(table, x, y));
				}
				return p.concat(index);
			}, []);
			if (tileIndexes.length > 0) {
				// fmap と bmap に分ける
				let minLevelOfFmap = 0;
				for (let level = 0; level < tileIndexes.length; level++) {
					const index = tileIndexes[level];
					const square = indexSquareMap[index];
					const height = getHeight(square.placement);
					if (height === 1) {
						minLevelOfFmap = level + 1;
					} else if (height === 0) {
						break;
					}
				}
				const fmapIndexes = tileIndexes.slice(0, minLevelOfFmap);
				const bmapIndexes = tileIndexes.slice(minLevelOfFmap);
				// 表示順(手前から奥) => 描画順(奥から手前)
				fmapIndexes.reverse();
				bmapIndexes.reverse();
				// バッファに追加
				if (fmapIndexes.length > 0) {
					fmap[y][x] = buffer.add(fmapIndexes);
				}
				if (bmapIndexes.length > 0) {
					bmap[y][x] = buffer.add(bmapIndexes);
				}
			}
		}
	}

	// 閉じる. enchant.Surface を作る
	buffer.end();

	const rpgMap = new RPGMap(size, size, width, height);
	rpgMap.bmap.loadData(bmap);
	rpgMap.fmap.loadData(fmap);
	rpgMap.cmap = cmap;
	rpgMap.image = buffer.surface;
	console.log('buffer', rpgMap.image.toDataURL());

	return rpgMap;
}

class RPGMapImageBuffer {
	/**
	 * 逐次的にバッファを追加できる enchant.Surface のラッパーを生成する
	 * @param {Object} indexSquareMap
	 * @param {Function} callback 画像の書き込みが終わったらコールされる
	 */
	constructor(indexSquareMap, callback) {
		this.indexSquareMap = indexSquareMap;
		this.callback = callback;
		this.surface = null;
		this.bufferCount = 0; // ここから加算していく
		// this.surface が作られるのを待つ
		this.waitSurface = new Promise(resolve => {
			// this.end() をコールされた時点で this.surface を生成する
			this.end = () => {
				this.surface = new Surface(size, this.height);
				resolve(); // ここから一気に Image のロードと書き込みが始まる
				this.waitSurface.then(() => {
					callback(); // 書き込みが終了したので, 正常終了
				}, callback);
			};
		});
		this.cacheCount = {}; // { [key: string]: number }
		this.cacheImage = []; // Image[]
	}

	get height() {
		return this.bufferCount * 32;
	}

	/**
	 * 複数の画像をバッファに加算描画する
	 * @param {Number[]} indexes バッファに追加したいタイルのindexを手前から順に指定する
	 * @returns {Number} バッファ内の位置(frame)
	 */
	add(indexes) {
		const cacheKey = indexes.join(' ');
		if (cacheKey in this.cacheCount) {
			return this.cacheCount[cacheKey]; // すでにバッファされている
		}
		// 現在の bufferCount を保持してインクリメントする
		const count = this.bufferCount;
		this.bufferCount += 1;
		const images = indexes.map(index => this.loadImage(index));
		this.waitSurface = this.waitSurface.then(() => {
			// Image をソースとして Surface に書き込む
			for (const i of images) {
				const offset = count * size;
				const ctx = this.surface.context;
				ctx.drawImage(i, 0, 0, size, size, 0, offset, size, size);
			}
		});
		// 同じバッファを作らないためにキャッシュに追加
		this.cacheCount[cacheKey] = count;
		return count;
	}

	/**
	 * 新たに画像をロードする
	 * @param {Number} index タイルのindex
	 * @returns {Image}
	 */
	loadImage(index) {
		if (this.cacheImage[index]) {
			return this.cacheImage[index]; // すでにロードされた画像
		}
		const img = new Image();
		// src から画像をロードし, waitinglist に Promise を追加する
		const promise = new Promise((resolve, reject) => {
			img.onload = () => resolve();
			img.onerror = e => reject(e);
			const src = this.indexSquareMap[index].tile.image.src;
			img.src = src;
		});
		this.waitSurface = this.waitSurface.then(() => promise);
		// 同じ画像を何度もロードしないようにキャッシュに追加
		this.cacheImage[index] = img;
		return img;
	}
}

/**
 * 当たり判定
 * @param {Object} placement
 * @return 壁: 1, 通路: 0, 継承: -1
 */
function getCollider(placement) {
	switch (placement.type) {
		case 'Wall':
		case 'Barrier':
			return 1;
		case 'Ground':
		case 'Road':
			return 0;

		case 'Rug':
		case 'Float':
		case 'Sky':
		default:
			return -1;
	}
}

/**
 * fmap か bmap か
 * @param {Object} placement
 * @return 1: fmap, 0: bmap, -1: inherit
 */
function getHeight(placement) {
	switch (placement.type) {
		case 'Ground':
		case 'Wall':
			return 0;
		case 'Road':
		case 'Rug':
		case 'Barrier':
			return -1;
		case 'Float':
		case 'Sky':
		default:
			return 1;
	}
}
