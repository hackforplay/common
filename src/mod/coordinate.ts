// マウスで指した場所の座標がつねに表示される
import enchant from '../enchantjs/enchant';
import Camera from '../hackforplay/camera';
import '../hackforplay/core';
import game from '../hackforplay/game';
import { getHack } from '../hackforplay/get-hack';

const Hack = getHack();

const MutableText = (enchant as any).ui.MutableText;

const imageDataUrl =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAAAXNSR0IArs4c6QAAAcRJREFUeAHt2y1OA1EUBeD3hpJ6HAl7QCIwOPbABnBIFoHEsQK2gUEg2QMJDk8K8+hr0p8ES+Yk9KvppObc+U7v1PSV4kWAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAIH/IFCTN3F2306Gw++7WttFrfV4yllaa++t1adxcXD7clPfpszezYoVsMKfj69DaUe7A019PZb6MX4Op6kSZlPf8Dqvf/OHUo6er2exL0Gf5fzhq5XlLMvLq/VsU74vDTKv/tjJJP9OTc4SLGDaZ/5v9u0nU//+bJNLiRWwO8Q+Xysg3L4CFBAWCMfbAAWEBcLxNkABYYFwvA1QQFggHG8DFBAWCMfbAAWEBcLxNkABYYFwvA1QQFggHG8DFBAWCMfbAAWEBcLxNkABYYFwvA1QQFggHG8D9rWA/v/88L1v4pOzxDagH47YCIQvkrPEzgf0kyllPl6u/p8fLGB1QGMx3KZGiG1AP5HST6aMY3lMPAJ6Zs9Ono5JlS6XAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECfy/wA9qGU1T+GdfUAAAAAElFTkSuQmCC';

export default function coordinate() {
  if (Hack.coordinateLabel) {
    // すでに coordinateLabel が存在していた
    throw new Error('Hack.coordinateLabel has already exist');
  }

  // ラベルを初期化
  const label = new MutableText(360, 300);
  // Hack に参照を追加
  Hack.coordinateLabel = label;
  // クリックの邪魔にならないように
  label.touchEnabled = false;

  // 青い枠を初期化
  const sprite = new enchant.Sprite(96, 96);
  sprite.moveTo(360, 300);
  enchant.Surface.load(
    imageDataUrl,
    (event: any) => {
      sprite.image = event.target;
      Hack.menuGroup.addChild(sprite);
    },
    () => {}
  );

  sprite.touchEnabled = false;
  // Hack に参照を追加
  Hack.coordinateSprite = label;

  const setPosition = (clientX: number, clientY: number) => {
    // マウスが重なっている→メインカメラを使う
    const camera = Camera.main;
    if (!camera) return;

    // マウス座標をゲーム内座標に変換
    const [x, y] = camera
      .projection(clientX, clientY)
      .map(pos => Math.floor(pos / 32));

    // "(2, 3)" のように表示
    label.text = `(${x}, ${y})`;
    // マウスの位置より上にラベルをおく
    const labelX = clientX - label.width / 2; // マウスの中心
    label.moveTo(labelX, clientY);
    // 枠を移動
    const [left, top] = camera.gamePositionToScreen(x * 32, y * 32);
    sprite.scaleX = 1 / camera.scale;
    sprite.scaleY = 1 / camera.scale;
    sprite.moveTo(left, top);
    const padding = 32 + 16 * (1 - 1 / camera.scale);
    sprite.moveBy(-padding, -padding);
  };

  // マウスの位置を追跡
  const div: HTMLDivElement = game._element;
  div.addEventListener(
    'mousemove',
    event => {
      const { clientX, clientY } = event;
      const rect = div.getBoundingClientRect();
      const x = (clientX - rect.left) / game.scale;
      const y = (clientY - rect.top) / game.scale;
      if (0 <= x && x <= game.width && 0 <= y && y <= game.height) {
        setPosition(x, y);
      }
    },
    {
      passive: true
    }
  );

  const visibilitySetter = (value: boolean) => () => {
    label.visible = value;
    sprite.visible = value;
  };
  // マウスが離れたら非表示にする
  div.addEventListener('mouseleave', visibilitySetter(false), {
    passive: true
  });
  // マウスが戻ってきたらまた表示する
  div.addEventListener('mouseenter', visibilitySetter(true), {
    passive: true
  });

  // タッチされた位置
  div.addEventListener(
    'touchstart',
    event => {
      const visible = !label.visible; // toggle
      label.visible = visible;
      sprite.visible = visible;
      if (!visible) return;
      const primaryTouch = event.touches.item(0);
      if (!primaryTouch) return;
      const { clientX, clientY } = primaryTouch;
      const rect = div.getBoundingClientRect();
      const x = (clientX - rect.left) / game.scale;
      const y = (clientY - rect.top) / game.scale;
      if (0 <= x && x <= game.width && 0 <= y && y <= game.height) {
        setPosition(x, y);
      }
    },
    {
      passive: true
    }
  );

  Hack.menuGroup.addChild(label);
}
