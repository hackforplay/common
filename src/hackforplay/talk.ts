import { default as Hack } from './hack';
import TextArea from '../hackforplay/ui/textarea';
import game from '../hackforplay/game';

// canvas のテキストエリアを生成
const textArea = new TextArea(480, 200);
const current = textArea.currentY;
textArea.autoResizeVertical = true;
textArea.x = (480 - textArea.w) / 2;
textArea.y = 320 - textArea.height;
textArea.margin = 14;
textArea.defaultStyle = {
  color: '#fff',
  size: '18',
  family: 'PixelMplus, sans-serif',
  weight: 'bold',
  align: 'left',
  space: 0,
  ruby: null,
  rubyId: null
};

game.on('awake', () => {
  Hack.menuGroup.addChild(textArea);
});

export default function talk(text: string, answers1: string, answers2: string) {
  textArea.show();
  textArea.clear(); // 前の文章をクリア
  textArea.push(text); // テキストを挿入
  textArea.y = 320 - textArea.height;
}
