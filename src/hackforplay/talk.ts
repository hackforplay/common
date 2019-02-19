import { default as Hack } from './hack';
import TextArea from '../hackforplay/ui/textarea';
import game from '../hackforplay/game';

var answers: any = [];
var options: number = 0; // 選択肢の数

// テキストエリアを生成
const textArea = new TextArea(480, 200);
textArea.autoResizeVertical = true;
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

const MakeAnswers = function(i: number) {
  Hack.menuGroup.addChild(answers[i]); // メニューにaddChild
  answers[i].x = 480 - answers[i].w;
  answers[i].y = 320 - textArea.height - answers[i].height * (i + 1);
  answers[i].margin = 2;
  answers[i].padding = 5;
  answers[i].defaultStyle = {
    color: '#fff',
    size: '18',
    family: 'PixelMplus, sans-serif',
    weight: 'bold',
    align: 'center',
    space: 0,
    ruby: null,
    rubyId: null
  };
  answers[i].clear(); // 前の文章をクリア
  answers[i].show();
  answers[i].on('touchend', function() {
    buttonTouched(i);
  });
};

game.on('awake', () => {
  Hack.menuGroup.addChild(textArea);
});

export default function talk(text: string, ...choices: string[]) {
  console.log(choices);
  const choicesNum = choices.length - 1;
  /* memo
  別の人に話しかけた時には、一度テキストも選択肢も全部消す処理を書きたい 
  await this.talk('こんにちは', 'はい', 'いいえ')
  await this.talk('はじめまして')
  こうすると、先に表示される「はい」の選択肢だけ残ってしまう
  */
  choices.reverse(); // 下から上に表示するので、選択肢の配列をリバースする
  textArea.show();
  textArea.clear(); // 前の文章をクリア
  textArea.push(text); // テキストを挿入
  textArea.y = 320 - textArea.height;
  // 選択肢のボタンを作成
  if (choices.length === 0) {
    const i = 0;
    const answer = new TextArea(78, 35);
    answers.push(answer);
    MakeAnswers(i);
    answers[i].push('とじる'); // 選択肢のテキスト表示
  } else {
    for (var i = 0; i <= choicesNum; i++) {
      const answer = new TextArea(200, 35);
      answers.push(answer);
      MakeAnswers(i);
      answers[i].push(choices[i]); // 選択肢のテキスト表示
    }
  }
}

export function buttonTouched(i: number) {
  if (!answers[i].visible) return;
  // Hack.menuGroup.removeChild(textArea);
  textArea.hide();
  // Hack.menuGroup.removeChild(answers[i]);
  for (var i = 0; i <= options + 1; i++) {
    answers[i].hide();
  }
  // answers = [];
  Hack.log('a');
}
