import { closeCode, feeles, openCode, runCode, saveAs } from './feeles';

/**
 * ゲーム・魔道書一体型 UI のための新しい REPL API
 * DOM を直接操作する
 */

const fileName = 'code.js';
let code = ''; // eslint-disable-line

const hook = {
  run: (code: string) => {}
};

const _eval = feeles.eval;
if (_eval) {
  feeles.eval = (code: string) => {
    hook.run(code);
    return _eval(code);
  };
}

export function setCode(value: string) {
  code = value;
  return (
    saveAs && saveAs(new Blob([value], { type: 'text/javascript' }), fileName)
  );
}

export function getCode(): string {
  return code;
}

let isEditorOpened = false;

window.addEventListener(
  'keydown',
  event => {
    if (event.key !== 'c' || isEditorOpened) return;
    isEditorOpened = true;
    hook.run = code => {
      isEditorOpened = false;
      setCode(code); // エディタをステートレスにするかどうか. 今は実行後もコードを保つようにしている
      closeCode && closeCode(); // エディタを閉じる
    };
    openCode && openCode(fileName);
    window.parent.focus();
  },
  {
    passive: true
  }
);

// ゲームにフォーカスが戻ったら、自動的に実行する
window.addEventListener('focus', () => {
  if (isEditorOpened) {
    runCode && runCode(); // コード実行
  }
});
