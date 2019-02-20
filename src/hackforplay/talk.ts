import { default as Hack } from './hack';
import TextArea from '../hackforplay/ui/textarea';
import game from '../hackforplay/game';

var answers: any = [];
var choicesNum: number = 0; // 選択肢の数

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

const MakeAnswers = function(i: number) {
  Hack.menuGroup.addChild(answers[i]); // メニューにaddChild
  answers[i].x = 480 - answers[i].w;
  answers[i].y = 320 - textArea.height - answers[i].height * (i + 1);
  answers[i].margin = 2;
  answers[i].padding = 5;
  answers[i].borderRadius = 14;
  answers[i].borderColor = '#fff';
  answers[i].borderWidth = 2;
  answers[i].defaultStyle = {
    color: '#fff',
    size: '16',
    family: 'PixelMplus, sans-serif',
    weight: 'bold',
    align: 'center',
    space: 0,
    ruby: null,
    rubyId: null
  };
  answers[i].clear(); // 前の文章をクリア
  answers[i].show();
};

export default function talk(text: string, ...choices: string[]) {
  if (textArea.visible) windowDelete(); // 表示されてるウィンドウを消す
  choicesNum = choices.length - 1;
  choices.reverse(); // 下から上に表示するので、選択肢の配列をリバースする
  // 本文のテキストエリア作成
  Hack.menuGroup.addChild(textArea);
  textArea.show();
  textArea.clear(); // 前の文章をクリア
  textArea.push(text); // テキストを挿入
  textArea.y = 320 - textArea.height;
  // 選択肢のボタンを作成
  if (choices.length === 0) {
    choicesNum = 0;
    const answer = new TextArea(68, 32);
    answers.push(answer);
    MakeAnswers(choicesNum);
    answers[choicesNum].push('とじる'); // とじる 表示
    answers[choicesNum].on('touchend', function() {
      windowDelete();
      return 'とじる';
    });
  } else {
    for (var i = 0; i <= choicesNum; i++) {
      const answer = new TextArea(180, 32);
      answers.push(answer);
      MakeAnswers(i);
      const choice = choices[i];
      answers[i].push(choice); // 選択肢のテキスト表示
      answers[i].on('touchend', function() {
        windowDelete();
        return choice;
      });
    }
  }
}

export function windowDelete() {
  if (!textArea.visible) return;
  Hack.menuGroup.removeChild(textArea);
  textArea.hide();
  for (var i = 0; i <= choicesNum; i++) {
    Hack.menuGroup.removeChild(answers[i]);
    answers[i].hide();
  }
  answers = [];
}
