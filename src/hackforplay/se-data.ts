const audioData: { [key: string]: string } = {
  ほのお00: 'fire00.wav',
  ダメージ02: 'hit02.wav'
};

export default function seFileName(audioName: string) {
  var data = audioName;
  var fileName = audioData[data];
  return fileName;
}
