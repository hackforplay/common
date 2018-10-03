import test from 'ava';
import fs from 'fs';
import path from 'path';
import createCompatibleMap from '../common/hackforplay/create-compatible-map';
import enchant from './helpers/enchant';
import createMapJson from './helpers/create-map-json';
import { Image } from 'canvas-prebuilt';
import RPGMap from './helpers/mock-rpg-map';

// テストのための依存注入
const injection = {
	RPGMap,
	Surface: enchant.Surface,
	Image
};

const tmpDir = path.join(__dirname, 'tmp');

test.before.cb('make tmp directory', t => {
	fs.stat(tmpDir, err => {
		if (err && err.code === 'ENOENT') {
			fs.mkdir(tmpDir, t.end);
		} else {
			t.end();
		}
	});
});

test('create new instance from enchant.Game', t => {
	enchant();
	const core = new enchant.Game(480, 320);
	t.is(core.width, 480);
	t.is(core.height, 320);
});

let result;

test.cb('Hack.createCompatibleMap', t => {
	const exampleMap = createMapJson();

	result = createCompatibleMap(exampleMap, injection, t.end);

	t.true(result instanceof RPGMap);
	if (!(result instanceof RPGMap)) return;
	t.truthy(result.image._element, 'Canvas が作られていません');
	t.true(result.image.width * result.image.height > 0, 'バッファが空です');
	t.is(result.bmap.width, 15 * 32);
	t.is(result.bmap.height, 10 * 32);
	t.is(result.fmap.width, 15 * 32);
	t.is(result.fmap.height, 10 * 32);
	t.true(Array.isArray(result.bmap._data[0]));
	t.true(Array.isArray(result.bmap._data[0][0]));
	t.is(typeof result.bmap._data[0][0][0], 'number');
	t.true(Array.isArray(result.fmap._data[0]));
	t.true(Array.isArray(result.fmap._data[0][0]));
	t.is(typeof result.fmap._data[0][0][0], 'number');
});

test.after.cb('save buffer image of RPGMap::image', t => {
	const dataURL = result.image._element.toDataURL(); // default png
	const [, base64] = dataURL.split(',');
	fs.writeFile(path.join(tmpDir, 'image.png'), base64, 'base64', t.end);
});

test.after.cb('save rendered image of RPGMap::bmap', t => {
	result.bmap.redraw(0, 0, 10 * 32, 6 * 32);
	const dataURL = result.bmap._surface._element.toDataURL();
	const [, base64] = dataURL.split(',');
	fs.writeFile(path.join(tmpDir, 'bmap.png'), base64, 'base64', t.end);
});

test.after.cb('save rendered image of RPGMap::fmap', t => {
	result.fmap.redraw(0, 0, 10 * 32, 6 * 32);
	const dataURL = result.fmap._surface._element.toDataURL();
	const [, base64] = dataURL.split(',');
	fs.writeFile(path.join(tmpDir, 'fmap.png'), base64, 'base64', t.end);
});
