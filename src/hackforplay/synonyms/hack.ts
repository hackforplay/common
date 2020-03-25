import { ISynonyms } from './synonymize';

export const synonyms: ISynonyms = {
  ゲームクリア: { type: 'function', name: 'gameclear' },
  ゲームオーバー: { type: 'function', name: 'gameover' },
  じかん: { type: 'primitive', name: 'time' },
  じかんをとめる: { type: 'function', name: 'stopTimer' },
  じかんをうごかす: { type: 'function', name: 'startTimer' },
  がめんにだす: { type: 'function', name: 'showLabel' },
  がめんからけす: { type: 'function', name: 'hideLabel' }
};
