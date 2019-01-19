import register from './timers';

// https://github.com/Feeles/IDE/blob/master/src/Cards/MonitorCard/registerHTML.js#L33
if (!global.feeles) {
  global.feeles = {
    env: {},
    fetchDataURL,
    fetchText,
    throwError,
    connected: new Promise(() => {}),
    exports: () => {},
    fetch: () => {},
    resolve: () => {},
    saveAs: () => {},
    reload: () => {},
    replace: () => {},
    openReadme: () => {},
    closeReadme: () => {},
    openMedia: () => {},
    closeMedia: () => {},
    openCode: () => {},
    closeCode: () => {},
    openEditor: () => {},
    closeEditor: () => {},
    setAlias: () => {},
    runCode: () => {},
    SpeechRecognition: () => {},
    ipcRenderer: () => {},
    setTimeout: () => {},
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    dispatchOnMessage: () => {},
    openWindow: () => {},
    eval: () => {}
  };
  register(global.feeles);

  global.window.feeles = global.feeles;
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

/**
 * Feeles 内のファイルをテキスト形式で取得する
 * @param {String} src ソースファイルのパス
 */
function fetchText(src) {
  throw new Error(src);
  return new Promise((resolve, reject) => {
    const filePath = require('path').resolve(__dirname, '../../src/', src);
    require('fs').readFile(filePath, 'utf8', (err, data) => {
      if (err) reject(err);
      else {
        resolve(data);
      }
    });
  });
}

function throwError(error) {
  console.error(error);
  console.trace();
  throw error;
}
