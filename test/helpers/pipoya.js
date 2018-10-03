import fs from 'fs';
import path from 'path';

export const flower = dataURL('../fixtures/flower.png');
export const grass = dataURL('../fixtures/grass.png');
export const rock = dataURL('../fixtures/rock.png');
export const roof = dataURL('../fixtures/roof.png');

function dataURL(fileName) {
	const base64 = fs.readFileSync(path.resolve(__dirname, fileName), 'base64');
	return 'data:image/png;base64,' + base64;
}
