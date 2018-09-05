import enchant from '../enchantjs/enchant';
import '../enchantjs/ui.enchant';

// https://github.com/hackforplay/common/issues/10
const _Map = window.Map;
enchant('ui'); // すべてのenchantモジュールをグローバルにエクスポート
window.Map = _Map;

// コアのインスタンスを生成
const game = new enchant.Core(480, 320);
export default game;
