import { default as Hack } from './hack';
import { getConfig } from './se-data';

const feeles = (window as any).feeles;
const data: { [key: string]: AudioBuffer | null | undefined } = {};
const audioCtx = new AudioContext();

export default async function soundEffect(jpName: string) {
  const audioConfig = getConfig(jpName);
  const audioSource = data[jpName];
  if (audioSource === null) {
    return;
  }
  if (audioSource === undefined) {
    const source = audioCtx.createBufferSource(); // source を作成
    const gainNode = audioCtx.createGain();

    const url = `${Hack.seBaseUrl}${audioConfig.fileName}`;
    const audioData: ArrayBuffer = await feeles.fetchArrayBuffer(url);

    // array buffer を audio buffer に変換
    audioCtx.decodeAudioData(
      audioData,
      function(buffer) {
        data[jpName] = buffer;
        source.buffer = buffer; // buffer をセット
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.gain.value = 0.3;
      },

      function(e) {
        feeles.throwError(e);
      }
    );
    source.start();
  } else {
    // ロード済
    const source = audioCtx.createBufferSource(); // source を作成
    const gainNode = audioCtx.createGain();
    source.buffer = audioSource;
    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = 0.3;
    if (audioConfig.delay > 0) {
      setTimeout(() => source.start(), audioConfig.delay * 1000);
    } else {
      source.start();
    }
  }
}
