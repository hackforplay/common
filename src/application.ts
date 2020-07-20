import { Application, Container } from 'pixi.js';

const app = new Application({
  width: 480,
  height: 320
});

app.ticker.maxFPS = 30;
app.stage.sortableChildren = true;

// TODO: enchant.js に依存しないようにする
const enchantStageEl = document.querySelector('#enchant-stage')!.parentElement!;
enchantStageEl.insertBefore(app.view, enchantStageEl.firstChild);

export default app;
