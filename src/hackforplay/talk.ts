import { default as Hack } from './hack';
import TextArea from '../hackforplay/ui/textarea';

let answers: TextArea[] = [];

export interface ITalkInfo {
  talkMessage: string;
  choices: string[];
  resolve: (answer: string) => void;
  resume: () => void;
}

const talkStack: ITalkInfo[] = [];

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

const windowDelete = function() {
  if (!textArea.visible) return;
  Hack.menuGroup.removeChild(textArea);
  textArea.hide();
  for (const answer of answers) {
    Hack.menuGroup.removeChild(answer);
    answer.hide();
  }
  answers = [];
};

const makeAnswer = function(
  choice: string,
  resolve: (text: string) => void,
  resume: () => void
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
    windowDelete();
    resolve(choice);
    if (talkStack.length > 1) {
      showTextArea(talkStack[talkStack.length - 1].talkMessage);
      for (const choice of talkStack[talkStack.length - 1].choices) {
        const answerWindow = makeAnswer(
          choice,
          talkStack[talkStack.length - 1].resolve,
          talkStack[talkStack.length - 1].resume
        );
        answers.push(answerWindow);
      }
    }
    talkStack.shift();
    resume();
  });
  return textWindow;
};

export default function talk(text: string, ...choices: string[]) {
  return new Promise(resolve => {
    const resume = theWorld();
    choices.reverse(); // 下から上に表示するので、選択肢の配列をリバースする
    // 情報をtalkInfo配列に一度格納
    const talkInfo: ITalkInfo = {
      talkMessage: text,
      choices: choices,
      resolve: resolve,
      resume: resume
    };
    talkStack.unshift(talkInfo); // talkStack配列の一番前に追加
    windowDelete(); // 後優先なのですでに表示されているものは一旦消す
    showTextArea(talkStack[0].talkMessage); // 本文のテキストエリア作成
    // 選択肢のボタンを作成
    if (talkStack[0].choices.length === 0) {
      choices.push('とじる'); // 選択肢のテキスト表示
    }
    for (const choice of talkStack[0].choices) {
      const answerWindow = makeAnswer(
        choice,
        talkStack[0].resolve,
        talkStack[0].resume
      );
      answers.push(answerWindow);
    }
  });
}
