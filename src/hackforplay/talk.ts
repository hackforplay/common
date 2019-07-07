import TextArea from '../hackforplay/ui/textarea';
import { default as Hack } from './hack';
import Key from './key';

export interface IConfig {
  text: Partial<TextArea>;
  button: Partial<TextArea>;
}

export const config: IConfig = {
  text: {
    width: 480,
    height: 200,
    autoResizeVertical: true,
    margin: 8,
    padding: 15,
    borderRadius: 14,
    borderColor: 'rgba(0, 0, 0, 0)',
    borderWidth: 0,
    defaultStyle: {
      color: '#fff',
      size: '18',
      family: 'PixelMplus, sans-serif',
      weight: 'bold',
      align: 'center',
      lineSpace: 5,
      space: 0,
      ruby: null,
      rubyId: null
    }
  },
  button: {
    width: 180,
    height: 32,
    x: 300,
    margin: 2,
    padding: 5,
    borderRadius: 14,
    borderColor: '#fff',
    borderWidth: 2,
    defaultStyle: {
      color: '#fff',
      size: '16',
      family: 'PixelMplus, sans-serif',
      weight: 'bold',
      align: 'center',
      lineSpace: 0,
      space: 0,
      ruby: null,
      rubyId: null
    }
  }
};

let answers: TextArea[] = [];

export interface ITalkInfo {
  talkMessage: string;
  choices: string[];
  resolve: (answer: string) => void;
  resume: () => void;
}

const talkStack: ITalkInfo[] = [];

// テキストエリアを生成
const textArea = new TextArea(config.text.width, config.text.height);
Object.assign(textArea, config.text);

const showTextArea = function(text: string) {
  Hack.popupGroup.addChild(textArea);
  textArea.show();
  textArea.clear(); // 前の文章をクリア
  textArea.push(text); // テキストを挿入
  textArea.y = 320 - textArea.height;
};

// 外から参照したいので出してみる
let timeIsStopped = false;

const theWorld = () => {
  timeIsStopped = true;
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
  Hack.popupGroup.removeChild(textArea);
  for (const answer of answers) {
    Hack.popupGroup.removeChild(answer);
  }
  answers = [];
};

const makeAnswer = function(
  choice: string,
  resolve: (text: string) => void,
  resume: () => void
) {
  const textWindow = new TextArea(config.button.width, config.button.height);
  Object.assign(textWindow, config.button);
  Hack.popupGroup.addChild(textWindow); // メニューにaddChild
  textWindow.y =
    320 - textArea.height - textWindow.height * (answers.length + 1);
  textWindow.clear(); // 前の文章をクリア
  textWindow.show();
  textWindow.push(choice); // 選択肢のテキスト表示
  textWindow.on('touchend', function() {
    resolve(choice);
    windowDelete();
    resume();
    talkStack.shift();
    if (talkStack.length >= 1) {
      showTextArea(talkStack[0].talkMessage);
      for (const choice of talkStack[0].choices) {
        const answerWindow = makeAnswer(
          choice,
          talkStack[0].resolve,
          talkStack[0].resume
        );
        answers.push(answerWindow);
      }
    }
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
      choices,
      resolve,
      resume
    };
    talkStack.unshift(talkInfo); // talkStack配列の一番前に追加
    windowDelete(); // 後優先なのですでに表示されているものは一旦消す
    showTextArea(text); // 本文のテキストエリア作成
    // 選択肢のボタンを作成
    if (choices.length === 0) {
      choices.push('とじる'); // 選択肢のテキスト表示
    }
    for (const choice of choices) {
      const answerWindow = makeAnswer(choice, resolve, resume);
      answers.push(answerWindow);
    }

    // スペースキーでウィンドウを閉じたい
    Key.space.release(() => {
      if (choices.length === 1 && timeIsStopped === true) {
        resolve(choices[0]);
        console.log(`window delete ${choices[0]},${timeIsStopped}`);
        windowDelete();
        resume();
        talkStack.shift();
        if (talkStack.length >= 1) {
          showTextArea(talkStack[0].talkMessage);
          for (const choice of talkStack[0].choices) {
            const answerWindow = makeAnswer(
              choice,
              talkStack[0].resolve,
              talkStack[0].resume
            );
            answers.push(answerWindow);
          }
        }
      }
    });
  });
}
