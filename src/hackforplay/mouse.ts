import application from '../application';
import { getHack } from './get-hack';
import { KeyClass } from './key';

const Hack = getHack();

application.stage.interactive = true;

// マウスの入力状態
const mouseInput = new KeyClass();
let mousePressed = false;
application.stage.on('pointerdown', () => {
  mousePressed = true;
});
application.stage.on('pointerup', () => (mousePressed = false));

application.stage.on('enterframe', () => {
  mouseInput.update(mousePressed);
});

Hack.mouseInput = mouseInput;

(() => {
  // マウス座標
  let mouseX: number | null = null;
  let mouseY: number | null = null;
  // 正規化されたマウス座標
  let normalizedMouseX: number | null = null;
  let normalizedMouseY: number | null = null;

  const { view } = application;
  view.addEventListener(
    'mousemove',
    event => {
      const { clientX, clientY } = event;
      const rect = view.getBoundingClientRect();
      const x = (clientX - rect.left) / Hack.scale;
      const y = (clientY - rect.top) / Hack.scale;

      mouseX = x;
      mouseY = y;

      normalizedMouseX = x / application.stage.width;
      normalizedMouseY = y / application.stage.height;
    },
    {
      passive: true
    }
  );

  Object.defineProperties(Hack, {
    mouseX: { get: () => mouseX },
    mouseY: { get: () => mouseY },
    normalizedMouseX: { get: () => normalizedMouseX },
    normalizedMouseY: { get: () => normalizedMouseY }
  });
})();
