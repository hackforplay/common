import { default as enchant } from '../enchantjs/enchant';
import RPGObject from './object/object';
import { decode } from './skin';

interface ThinkImageConfig {
  dataUrl: string;
  width: number;
  height: number;
  dx: 0;
  dy: -8;
  frames: number[];
}

export const configs: { [key: string]: ThinkImageConfig | undefined } = {
  '!': {
    dataUrl: require('../resources/images/exclamation.png').default,
    width: 32,
    height: 32,
    dx: 0,
    dy: -8,
    frames: [0, 3, 1, 3, 2, 50]
  },
  '?': {
    dataUrl: require('../resources/images/question.png').default,
    width: 32,
    height: 32,
    dx: 0,
    dy: -8,
    frames: [0, 3, 1, 3, 2, 4, 3, 50]
  }
};

/**
 * think sprite を新たに生成する。正しくない name が与えられた場合は undefined を返す
 * think (うかべる) は、キャラクターの頭の上に感情や状態を表す記号を表示する機能
 * @param name 感情を表す記号. "!" や "?" など
 * @param node キャラクターのいるシーン
 * @param callback アニメーション終了時にコールされる関数
 */
export function showThinkSprite(
  name: string,
  node: RPGObject,
  callback = () => {}
): () => void {
  const config = configs[name] || configs['?']; // 見つからなかった場合は "?" を出す
  const parentNode = node?.parentNode;
  if (!config || !parentNode || typeof parentNode.addChild !== 'function') {
    return () => {
      callback();
    };
  }

  let canceled = false;

  const frame = decode(...config.frames);
  const sprite = new enchant.Sprite(config.width, config.height);
  sprite.x = node.x + (node.width - sprite.width) / 2 + config.dx; // 中央揃え
  sprite.y = node.y + config.dy; // 上揃え
  sprite.image = enchant.Surface.load(
    config.dataUrl,
    () => {
      if (canceled) return callback();
      sprite.frame = frame;
      let lifetime = frame.length;
      sprite.on('enterframe', function task() {
        if (canceled || lifetime-- <= 0) {
          sprite.removeEventListener('enterframe', task);
          parentNode.removeChild(sprite);
          callback();
        }
      });
      parentNode.addChild(sprite);
    },
    () => {
      callback();
    }
  );

  return () => {
    canceled = true;
  };
}
