import * as PIXI from 'pixi.js';
import { Charactor } from './core/Charactor';
import * as settings from './core/settings';
let type = 'WebGL';
if (!PIXI.utils.isWebGLSupported()) {
  type = 'canvas';
}

PIXI.utils.sayHello(type);
const app = new PIXI.Application({});
const container = document.getElementById('hackforplay-common-container');
if (!container) {
  throw new Error('#hackforplay-common-container not found');
}
container.appendChild(app.view);

const map = new PIXI.Container();

const cameraBase = new PIXI.BaseRenderTexture({
  width: settings.tileSize * settings.column,
  height: settings.tileSize * settings.row,
  scaleMode: PIXI.SCALE_MODES.NEAREST,
  resolution: 1
});
const camera = new PIXI.RenderTexture(cameraBase);
const cameraSprite = new PIXI.Sprite(camera);

// main--
create({ x: 0, y: 0 });
create({ x: 0, y: 1 });
create({ x: 0, y: 2 });
create({ x: 0, y: 3 });
create({ x: 0, y: 4 });
create({ x: 0, y: 9 });
// --main

app.stage.addChild(cameraSprite);

app.ticker.add(() => {
  app.renderer.render(map, camera, false);
});

// app.stage.addChild(map);

window.addEventListener('resize', resize, { passive: true });
function resize() {
  if (!app.view.parentElement) return;
  const rect = app.view.parentElement.getBoundingClientRect();
  const { width, height } =
    rect.width * settings.ratio > rect.height
      ? { width: rect.height / settings.ratio, height: rect.height } // 横長
      : { width: rect.width, height: rect.width * settings.ratio }; // 縦長
  app.renderer.resize(width, height);
  cameraSprite.width = width;
  cameraSprite.height = height;
  console.log(width, height);
}
resize();

function create({ x = 0, y = 0, m = 0, f = 0 }) {
  const chara = new Charactor();
  chara.costume('apple');
  chara.x = x;
  chara.y = y;
  map.addChild(chara);
}
