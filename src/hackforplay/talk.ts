import { default as enchant } from '../enchantjs/enchant';
import TextArea from '../hackforplay/ui/textarea';
import { getHack } from './get-hack';
import Key from './key';
import { langExports } from './lang';

export interface IConfig {
  text: Partial<TextArea>;
  button: Partial<TextArea>;
  cursor: {
    size: number;
    offsetX: number;
    borderColor: string;
    fillColor: string;
  };
}

const Hack = getHack();

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
    width: 186,
    height: 48,
    x: 290,
    margin: 4,
    padding: 10.5,
    borderRadius: 20,
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
  },
  cursor: {
    size: 20,
    offsetX: -8,
    borderColor: 'rgb(255, 255, 255)',
    fillColor: 'rgb(255, 255, 255)'
  }
};

export interface ITalkInfo {
  talkMessage: string;
  choices: string[];
  cursor: number;
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
    // 情報をtalkInfo配列に一度格納
    const talkInfo: ITalkInfo = {
      talkMessage: text,
      choices,
      cursor: 0,
      resolve
    };
    talkStack.unshift(talkInfo); // talkStack配列の一番前に追加
    // 選択肢のボタンを作成
    if (choices.length === 0) {
      choices.push(langExports.lang === 'ja' ? 'とじる' : 'Close'); // 選択肢のテキスト表示
    }
    showNextIfExist();
  }).then(choise => {
    resume();
    talkStack.shift();
    showNextIfExist();
    return choise;
  });
}

let answers: TextArea[] = [];
const cursor = makeCursor();

// スペースキーでウィンドウを閉じたい
Key.space.release(() => {
  const [current] = talkStack;
  if (!current) return;
  const { choices, resolve, cursor } = current;
  resolve(choices[cursor]);
});

// カーソルキー上で移動
Key.up.release(() => {
  const [current] = talkStack;
  if (!current) return;
  if (current.cursor > 0) {
    current.cursor--;
    cursor.y -= config.button.height;
  }
});

// カーソルキー下で移動
Key.down.release(() => {
  const [current] = talkStack;
  if (!current) return;
  if (current.cursor < current.choices.length - 1) {
    current.cursor++;
    cursor.y += config.button.height;
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
    for (const [index, choice] of current.choices.entries()) {
      const button = new TextArea(config.button.width, config.button.height);
      Object.assign(button, config.button);
      Hack.popupGroup.addChild(button); // メニューにaddChild
      button.y =
        320 -
        textArea.height -
        button.height * (current.choices.length - index);
      if (index === current.cursor) {
        cursor.y = button.y + button.height / 2 - cursor.height / 2;
      }
      button.clear(); // 前の文章をクリア
      button.show();
      button.push(choice); // 選択肢のテキスト表示
      button.on('touchend', function () {
        current.resolve(choice);
      });
      answers.push(button);
    }
    Hack.popupGroup.addChild(cursor); // カーソルを常に手前に表示
    cursor.x = 480 - (config.button.width || 0) + config.cursor.offsetX;
  } else {
    Hack.popupGroup.removeChild(textArea);
    Hack.popupGroup.removeChild(cursor);
  }
}

function makeCursor() {
  const l = config.cursor.size >> 0;
  const triangle = new enchant.Surface(l, l);
  const ctx: CanvasRenderingContext2D = triangle.context;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo((l * Math.sqrt(3)) / 2, l / 2);
  ctx.lineTo(0, l);
  ctx.closePath();
  ctx.fillStyle = config.cursor.fillColor;
  ctx.strokeStyle = config.cursor.borderColor;
  ctx.fill();
  ctx.stroke();
  const cursor = new enchant.Sprite(l, l);
  cursor.image = triangle;
  return cursor;
}
