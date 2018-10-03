import test from 'ava';
import { Image } from 'canvas-prebuilt';
import * as pipoya from './helpers/pipoya';

test(`load pipoya.* dataURLs as an Image from canvas-prebuilt`, async t => {
	const keys = Object.keys(pipoya);

	for (const key of keys) {
		const dataURL = pipoya[key];
		await new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = resolve;
			img.onerror = reject;
			img.src = dataURL;
		});
	}
});
