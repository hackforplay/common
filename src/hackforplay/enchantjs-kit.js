import game from './game';

// リサイズ時にゲームの scale を調節
document.documentElement.style.overflow = 'hidden';
window.addEventListener('resize', function() {
  var fWidth = parseInt(window.innerWidth, 10),
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
    var canvas;
    try {
      canvas = game.currentScene._layers.Canvas._element;
    } catch (e) {
      if (!game.ready) {
        game.on('load', send);
      }
      return;
    }
  }
  send();

  function send() {
    return;
    var canvas = game.currentScene._layers.Canvas._element;
    event.source.postMessage(
      {
        query: event.data.responseQuery,
        value: canvas.toDataURL(),
        width: canvas.width,
        height: canvas.height
      },
      event.origin
    );
  }
});

// TODO: enchant.jsで利用するメンバのヒントを親ウィンドウに投げる
