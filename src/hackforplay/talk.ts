import { default as Hack } from './hack';
import TextArea from '../hackforplay/ui/textarea';

var answers: any = [];
var talks: any = [];

// テキストエリアを生成
const textArea = new TextArea(480, 200);
textArea.autoResizeVertical = true;
textArea.margin = 8;
textArea.padding = 15;
textArea.borderRadius = 14;
textArea.borderColor = 'rgba(0, 0, 0, 0)';
textArea.borderWidth = 0;
textArea.defaultStyle = {
  color: '#fff',
  size: '18',
  family: 'PixelMplus, sans-serif',
  weight: 'bold',
  align: 'center',
  lineSpace: 5,
  space: 0,
  ruby: null,
  rubyId: null
};

const showTextArea = function(text: string) {
  Hack.menuGroup.addChild(textArea);
  textArea.show();
  textArea.clear(); // 前の文章をクリア
  textArea.push(text); // テキストを挿入
  textArea.y = 320 - textArea.height;
};

const theWorld = () => {
  let timeIsStopped = true;
  const stopAndStop = () => {
    if (timeIsStopped) {
      Hack.world.stop();
      requestAnimationFrame(stopAndStop);
    } else {
      Hack.world.resume();
    }
  };
  stopAndStop();
  const resume = () => {
    timeIsStopped = false;
  };
  return resume;
};

const makeAnswer = function(
  choice: string,
  resolve: (text: string) => void,
  starPlatinum: () => void
) {
  const textWindow = new TextArea(180, 32);
  Hack.menuGroup.addChild(textWindow); // メニューにaddChild
  textWindow.x = 480 - textWindow.w;
  textWindow.y =
    320 - textArea.height - textWindow.height * (answers.length + 1);
  textWindow.margin = 2;
  textWindow.padding = 5;
  textWindow.borderRadius = 14;
  textWindow.borderColor = '#fff';
  textWindow.borderWidth = 2;
  textWindow.defaultStyle = {
    color: '#fff',
    size: '16',
    family: 'PixelMplus, sans-serif',
    weight: 'bold',
    align: 'center',
    lineSpace: 0,
    space: 0,
    ruby: null,
    rubyId: null
  };
  textWindow.clear(); // 前の文章をクリア
  textWindow.show();
  textWindow.push(choice); // 選択肢のテキスト表示
  textWindow.on('touchend', function() {
    starPlatinum();
    windowDelete();
    resolve(choice);
  });
  return textWindow;
};

var talkedText = '';
export default function talk(text: string, ...choices: string[]) {
  return new Promise(resolve => {
    const starPlatinum = theWorld();
    if (textArea.visible) {
      talks.push(talkedText);
      talks.push(answers);
      windowDelete(); // 表示されてるウィンドウを消す
    }
    talkedText = text;
    choices.reverse(); // 下から上に表示するので、選択肢の配列をリバースする
    // 本文のテキストエリア作成
    showTextArea(text);
    if (choices.length === 0) {
      choices.push('とじる'); // 選択肢のテキスト表示
    }
    // 選択肢のボタンを作成
    for (const choice of choices) {
      const answer = makeAnswer(choice, resolve, starPlatinum);
      answers.push(answer);
    }
    if (talks.length !== 0) {
      console.log(talks);
      const replied = talks.pop();
      const talked = talks.pop();
    }
  });
}

const windowDelete = function() {
  if (!textArea.visible) return;
  Hack.menuGroup.removeChild(textArea);
  textArea.hide();
  for (var answer of answers) {
    Hack.menuGroup.removeChild(answer);
    answer.hide();
  }
  answers = [];
};
