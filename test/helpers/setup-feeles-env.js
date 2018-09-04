// https://github.com/Feeles/IDE/blob/master/src/Cards/MonitorCard/registerHTML.js#L33
if (!global.feeles) {
    global.feeles = {
        env: {},
        fetchDataURL,
        throwError,
        connected: new Promise(() => {})
    }
}

/**
 * Feeles 内のファイルを Data URL 形式で取得する
 * @param {String} src ソースファイルのパス
 */
function fetchDataURL(src) {
    return new Promise((resolve, reject) => {
        const filePath = require('path').resolve(__dirname, '../../src/', src);
        const ext = require('path').extname(src);
        const mime = {
            '.png': 'image/png',
            '.gif': 'image/gif'
        }[ext];
        require('fs').readFile(filePath, 'base64', (err, data) => {
            if (err) reject(err);
            else {
                const dataURL = `data:${mime};base64,${data}`;
                resolve(dataURL);
            }
        });
    });
}

function throwError(error) {
    throw error;
}
