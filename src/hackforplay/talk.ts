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
}

const talkStack: ITalkInfo[] = [];

// テキストエリアを生成
const textArea = new TextArea(config.text.width, config.text.height);
Object.assign(textArea, config.text);

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
  return () => {
    timeIsStopped = false;
  };
};

export default function talk(text: string, ...choices: string[]) {
  const resume = theWorld();
  return new Promise<string>(resolve => {
    choices.reverse(); // 下から上に表示するので、選択肢の配列をリバースする
    // 情報をtalkInfo配列に一度格納
    const talkInfo: ITalkInfo = {
      talkMessage: text,
      choices,
      resolve
    };
    talkStack.unshift(talkInfo); // talkStack配列の一番前に追加
    // 選択肢のボタンを作成
    if (choices.length === 0) {
      choices.push('とじる'); // 選択肢のテキスト表示
    }
    showNextIfExist();
  }).then(choise => {
    resume();
    talkStack.shift();
    showNextIfExist();
    return choise;
  });
}

// スペースキーでウィンドウを閉じたい
Key.space.release(() => {
  const [current] = talkStack;
  if (!current) return;
  const { choices, resolve } = current;
  if (choices.length === 1 && timeIsStopped === true) {
    resolve(choices[0]);
  }
});

/**
 * もしも次の talk が talkStack にあれば表示する
 * なければメッセージウィンドウを削除する
 */
function showNextIfExist() {
  // 古いボタンを削除
  for (const answer of answers) {
    Hack.popupGroup.removeChild(answer);
  }
  answers = [];
  // 新しい talkInfo を取得, もしあれば表示
  const [current] = talkStack;
  if (current) {
    if (!textArea.parentNode) {
      Hack.popupGroup.addChild(textArea);
      textArea.show();
    }
    textArea.clear(); // 前の文章をクリア
    textArea.push(current.talkMessage); // テキストを挿入
    textArea.y = 320 - textArea.height;
    // ボタンを生成
    for (const choice of current.choices) {
      const button = new TextArea(config.button.width, config.button.height);
      Object.assign(button, config.button);
      Hack.popupGroup.addChild(button); // メニューにaddChild
      button.y = 320 - textArea.height - button.height * (answers.length + 1);
      button.clear(); // 前の文章をクリア
      button.show();
      button.push(choice); // 選択肢のテキスト表示
      button.on('touchend', function() {
        current.resolve(choice);
      });
      answers.push(button);
    }
  } else {
    Hack.popupGroup.removeChild(textArea);
  }
}
