import enchant from '../enchantjs/enchant';
import { getHack } from '../hackforplay/get-hack';

export default function(code) {
  // 魔道書の実行をフック
  try {
    // eval
    eval(code);
  } catch (error) {
    // Hack.onerror を発火
    const errorEvent = new enchant.Event('error');
    errorEvent.target = getHack();
    errorEvent.error = error;
    getHack().dispatchEvent(errorEvent);
  }
}
