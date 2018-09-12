const _global = new Function('return this')();

/**
 * IDE に対してメッセージを送信する
 * @param {String} query メッセージのクエリ文字列
 * @param {Object} value 送信するメッセージオブジェクト
 * @param {Function} reply リプライが欲しい場合のコールバック (Optional)
 * @param {Boolean} continuous リプライが２回以上必要な場合のフラグ (Optional)
 * @returns {Promise}
 */
export default function requestPostMessage(query, value, reply, continuous) {
  if (!_global.feeles) throw new Error(`feeles is not defined`);
  if (!feeles.connected) throw new Error(`feeles.connected is not defined`);
  const message = {
    id: getUniqueId(),
    query,
    value
  };
  return feeles.connected.then(function(_ref) {
    return new Promise(function(resolve, reject) {
      if (reply) {
        _ref.port.addEventListener('message', function task(event) {
          if (event.data.id !== message.id) return;
          if (!continuous) {
            _ref.port.removeEventListener('message', task);
          }
          event.resolve = resolve;
          event.reject = reject;
          reply(event);
        });
      } else {
        resolve();
      }
      _ref.port.postMessage(message);
    });
  });
}

let _count = 0;
function getUniqueId() {
  return `COMMON_UNIQ_ID-${++_count}`;
}
