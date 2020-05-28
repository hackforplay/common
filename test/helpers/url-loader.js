const Module = require('module');
const fs = require('fs');
const path = require('path');

const originalRequire = Module.prototype.require;

Module.prototype.require = function () {
  const id = arguments[0];
  if (typeof id === 'string' && /\.(jpg|png|gif)$/.test(id)) {
    // psuedo url-loader
    const realPath = path.resolve(path.dirname(this.id), id);
    console.log(realPath);
    const base64 = fs.readFileSync(realPath, { encoding: 'base64' });
    const mime = id.endsWith('jpg')
      ? 'image/jpg'
      : id.endsWith('png')
      ? 'image/png'
      : id.endsWith('image/gif')
      ? 'image/gif'
      : undefined;
    return 'data:' + mime + ';base64,' + base64;
  }

  return originalRequire.apply(this, arguments);
};
