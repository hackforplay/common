import { Application, Container } from 'pixi.js';
import { getHack } from './hackforplay/get-hack';

const Hack = getHack();

const app = new Application({
  width: 480,
  height: 320
});

app.ticker.maxFPS = 30;
app.stage.sortableChildren = true;

// TODO: enchant.js に依存しないようにする
const enchantStageEl = document.querySelector('#enchant-stage')!.parentElement!;
enchantStageEl.insertBefore(app.view, enchantStageEl.firstChild);

// リサイズ時にゲームの比率を調節
function resize() {
  const scale = Math.min(
    window.innerWidth / app.screen.width,
    window.innerHeight / app.screen.height
  );
  Hack.scale = scale;
  app.view.style.width = app.screen.width * scale + 'px';
  app.view.style.height = app.screen.height * scale + 'px';
}
window.addEventListener('resize', resize);
resize();

function updateFrame(displayObject: PIXI.DisplayObject) {
  displayObject.emit('enterframe');
  // TODO: `displayObject instanceof RPGObject` を検討する
  if ('age' in displayObject) (displayObject as any).age++;

  if (displayObject instanceof Container) {
    for (const child of displayObject.children) {
      updateFrame(child);
    }
  }
}

app.ticker.add(() => updateFrame(app.stage));

export default app;
