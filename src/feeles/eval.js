import enchant from '../enchantjs/enchant';
import Hack from '../hackforplay/hack';

export default function(code) {
	// 魔道書の実行をフック
	try {
		// eval
		eval(code);
	} catch (error) {
		// Hack.onerror を発火
		const Event = enchant.Event;
		const errorEvent = new Event('error');
		errorEvent.target = Hack;
		errorEvent.error = error;
		Hack.dispatchEvent(errorEvent);
	}
}
