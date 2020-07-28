import '../application';
import enchant from '../enchantjs/enchant';

// https://github.com/hackforplay/common/issues/10
const _Map = window.Map;
window.Map = _Map;

// コアのインスタンスを生成
const game = new enchant.Core(480, 320);
game._element.style.display = 'none';
export default game;
