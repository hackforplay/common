import game from './game';

// リサイズ時にゲームの scale を調節
document.documentElement.style.overflow = 'hidden';
window.addEventListener('resize', function() {
  const fWidth = parseInt(window.innerWidth, 10),
    fHeight = parseInt(window.innerHeight, 10);
  if (fWidth && fHeight) {
    game.scale = Math.min(fWidth / game.width, fHeight / game.height);
  } else {
    game.scale = 1;
  }
});

// 'capture' メッセージを受けてcanvasの画像を返す
window.addEventListener('message', function(event) {
  if (typeof event.data === 'object' && event.data.query === 'capture') {
    const getCanvas = () => {
      try {
        return game.currentScene._layers.Canvas._element;
      } catch (error) {}
    };
    const send = () => {
      const canvas = getCanvas();
      if (!canvas) {
        if (!game.ready) {
          game.on('load', send);
        } else {
          throw new Error('enchantjs-kit.js: canvas element is not found');
        }
      }
      event.source.postMessage(
        {
          query: event.data.responseQuery,
          value: canvas.toDataURL(),
          width: canvas.width,
          height: canvas.height
        },
        event.origin
      );
    };
    send();
  }
});

// TODO: enchant.jsで利用するメンバのヒントを親ウィンドウに投げる
