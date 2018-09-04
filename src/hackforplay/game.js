import enchant from '../enchantjs/enchant';
import '../enchantjs/ui.enchant';

// すべてのenchantモジュールをグローバルにエクスポート
enchant('ui');

// コアのインスタンスを生成
const game = new enchant.Core(480, 320);
export default game;
