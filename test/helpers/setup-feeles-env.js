// https://github.com/Feeles/IDE/blob/master/src/Cards/MonitorCard/registerHTML.js#L33
if (!global.feeles) {
    global.feeles = {
        env: {},
        fetchDataURL
    }
}

/**
 * Feeles 内のファイルを Data URL 形式で取得する
 * @param {String} src ソースファイルのパス
 */
function fetchDataURL(src) {
    return new Promise((resolve, reject) => {
        const filePath = require('path').resolve(__dirname, '../../src/', src);
        require('fs').readFile(filePath, 'base64', (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
}
