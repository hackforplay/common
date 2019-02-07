import { default as Hack } from './hack';

export type AudioConfig = {
  // アップロードされたファイルの名前
  fileName: string;
  // 再生時に加えるディレイ [sec]
  delay: number;
};

export const audioConfigs: { [key: string]: AudioConfig } = {
  あわ01: {
    fileName: 'bubble01.mp3',
    delay: 0.1
  },
  きぬずれ01: {
    fileName: 'cloth01.mp3',
    delay: 0.1
  },
  きぬずれ02: {
    fileName: 'cloth02.mp3',
    delay: 0.1
  },
  かいふく01: {
    fileName: 'cure01.mp3',
    delay: 0.1
  },
  かいふく02: {
    fileName: 'cure02.mp3',
    delay: 0.1
  },
  ダメージ01: {
    fileName: 'damage01.mp3',
    delay: 0.1
  },
  ダメージ02: {
    fileName: 'damage02.mp3',
    delay: 0.1
  },
  ダメージ03: {
    fileName: 'damage03.mp3',
    delay: 0.1
  },
  ダメージ04: {
    fileName: 'damage04.mp3',
    delay: 0.1
  },
  ぶきみ01: {
    fileName: 'darkness01.mp3',
    delay: 0.1
  },
  ぶきみ02: {
    fileName: 'darkness02.mp3',
    delay: 0.1
  },
  やられた01: {
    fileName: 'death01.mp3',
    delay: 0.1
  },
  やられた02: {
    fileName: 'death02.mp3',
    delay: 0.1
  },
  はずれ01: {
    fileName: 'error01.mp3',
    delay: 0.1
  },
  ばくはつ01: {
    fileName: 'explosion01.mp3',
    delay: 0.1
  },
  ばくはつ02: {
    fileName: 'explosion02.mp3',
    delay: 0.1
  },
  ばくはつ03: {
    fileName: 'explosion03.mp3',
    delay: 0.1
  },
  ばくはつ04: {
    fileName: 'explosion04.mp3',
    delay: 0.1
  },
  ばくはつ05: {
    fileName: 'explosion05.mp3',
    delay: 0.1
  },
  おちる01: {
    fileName: 'fall01.mp3',
    delay: 0.1
  },
  ほのお01: {
    fileName: 'fire01.mp3',
    delay: 0.1
  },
  ほのお02: {
    fileName: 'fire02.mp3',
    delay: 0.1
  },
  ほのお03: {
    fileName: 'fire03.mp3',
    delay: 0.1
  },
  ゲームオーバー01: {
    fileName: 'gameover01.mp3',
    delay: 0.1
  },
  ゲームオーバー02: {
    fileName: 'gameover02.mp3',
    delay: 0.1
  },
  まほう01: {
    fileName: 'magic01.mp3',
    delay: 0.1
  },
  まほう02: {
    fileName: 'magic02.mp3',
    delay: 0.1
  },
  まほう03: {
    fileName: 'magic03.mp3',
    delay: 0.1
  },
  まほう04: {
    fileName: 'magic04.mp3',
    delay: 0.1
  },
  おかね01: {
    fileName: 'money01.mp3',
    delay: 0.1
  },
  おかね02: {
    fileName: 'money02.mp3',
    delay: 0.1
  },
  おかね03: {
    fileName: 'money03.mp3',
    delay: 0.1
  },
  パワーダウン01: {
    fileName: 'powerdown01.mp3	',
    delay: 0.1
  },
  パワーダウン02: {
    fileName: 'powerdown02.mp3	',
    delay: 0.1
  },
  パワーダウン03: {
    fileName: 'powerdown03.mp3	',
    delay: 0.1
  },
  パワーダウン04: {
    fileName: 'powerdown04.mp3	',
    delay: 0.1
  },
  パワーアップ01: {
    fileName: 'powerup01.mp3',
    delay: 0.1
  },
  パワーアップ02: {
    fileName: 'powerup02.mp3',
    delay: 0.1
  },
  パワーアップ03: {
    fileName: 'powerup03.mp3',
    delay: 0.1
  },
  パワーアップ04: {
    fileName: 'powerup04.mp3',
    delay: 0.1
  },
  パワーアップ05: {
    fileName: 'powerup05.mp3',
    delay: 0.1
  },
  にげる01: {
    fileName: 'revive01.mp3',
    delay: 0.1
  },
  なぞとき01: {
    fileName: 'secret01.mp3',
    delay: 0.1
  },
  ビーム01: {
    fileName: 'shoot01.mp3',
    delay: 0.1
  },
  ビーム02: {
    fileName: 'shoot02.mp3',
    delay: 0.1
  },
  ビーム03: {
    fileName: 'shoot03.mp3',
    delay: 0.1
  },
  ビーム04: {
    fileName: 'shoot04.mp3',
    delay: 0.1
  },
  ビーム05: {
    fileName: 'shoot05.mp3',
    delay: 0.1
  },
  かたな01: {
    fileName: 'slice01.mp3',
    delay: 0.1
  },
  じゅもん01: {
    fileName: 'spell01.mp3',
    delay: 0.1
  },
  せいかい01: {
    fileName: 'succes01.mp3',
    delay: 0.1
  },
  せいかい02: {
    fileName: 'succes02.mp3',
    delay: 0.1
  },
  せいかい03: {
    fileName: 'succes03.mp3',
    delay: 0.1
  },
  せいかい04: {
    fileName: 'succes04.mp3',
    delay: 0.1
  },
  あせ01: {
    fileName: 'sweat01.mp3',
    delay: 0.1
  },
  けんをふる01: {
    fileName: 'swing01.mp3',
    delay: 0.1
  },
  けんをふる02: {
    fileName: 'swing02.mp3',
    delay: 0.1
  },
  けんをふる03: {
    fileName: 'swing03.mp3',
    delay: 0.1
  },
  けんをふる04: {
    fileName: 'swing04.mp3',
    delay: 0.1
  },
  テレポート01: {
    fileName: 'teleport01.mp3',
    delay: 0.1
  },
  テレポート02: {
    fileName: 'teleport02.mp3',
    delay: 0.1
  },
  たおれる01: {
    fileName: 'thud01.mp3',
    delay: 0.1
  },
  むち01: {
    fileName: 'whip01.mp3',
    delay: 0.1
  },
  まじょ01: {
    fileName: 'witch01.mp3',
    delay: 0.1
  }
};

export default function seFileName(audioName: string) {
  const data = audioName;
  var config = audioConfigs[data];
  if (config === undefined) {
    Hack.log(`'${audioName}' という名前の おと は ないみたい`);
  }
  return config.fileName;
}
