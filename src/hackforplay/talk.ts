import { default as Hack } from './hack';
import TextArea from '../hackforplay/ui/textarea';
import game from '../hackforplay/game';
import { hide } from '../mod/logFunc';

// テキストエリアを生成
const textArea = new TextArea(480, 200);
textArea.autoResizeVertical = true;
textArea.x = 0;
textArea.y = 320 - textArea.height;
textArea.margin = 8;
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

// 選択肢のテキストボタン
const answerButton = new TextArea(87, 38);
answerButton.autoResizeVertical = true;
answerButton.x = 0;
answerButton.y = 0;
answerButton.margin = 8;
answerButton.padding = 8;
answerButton.defaultStyle = {
  color: '#fff',
  size: '18',
  family: 'PixelMplus, sans-serif',
  weight: 'bold',
  align: 'right',
  space: 0,
  ruby: null,
  rubyId: null
};

game.on('awake', () => {
  Hack.menuGroup.addChild(textArea);
  Hack.menuGroup.addChild(answerButton);
});

export default function talk(text: string, ...choices: string[]) {
  textArea.show();
  textArea.clear(); // 前の文章をクリア
  textArea.push(text); // テキストを挿入
  textArea.y = 320 - textArea.height;
  if (choices.length === 0) {
    // 選択肢がないときはとじるボタンを出す
    answerButton.show();
    answerButton.clear(); // 前の文章をクリア
    answerButton.push('とじる'); // とじる と表示
    answerButton.x = 480 - answerButton.w;
    answerButton.y = 320 - textArea.height - answerButton.height;
  }
}

export function handleOkButtonPush() {
  console.log('touched');
  if (!answerButton.visible) return;
  textArea.hide();
  answerButton.hide();
}

answerButton.on('touchend', handleOkButtonPush);
