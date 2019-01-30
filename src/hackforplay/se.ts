const feeles = (<any>window).feeles;

export default function soundEffect(url: string) {
  const audioCtx = new AudioContext();
  var source = audioCtx.createBufferSource(); // source を作成
  var gainNode = audioCtx.createGain();
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer'; // array buffer を指定

  request.onload = function() {
    var audioData = request.response;
    // array buffer を audio buffer に変換
    audioCtx.decodeAudioData(
      audioData,
      function(buffer) {
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
  };

  request.send();
}
