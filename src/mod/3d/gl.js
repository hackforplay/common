var $WIDTH = 480 * 1;
var $HEIGHT = 320 * 1;

var canvas = document.createElement('canvas');

canvas.width = $WIDTH;
canvas.height = $HEIGHT;

var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

if (!gl) {
	alert('WebGL の初期化に失敗しました');
}

window.gl = gl;

export default gl;

export { canvas };
