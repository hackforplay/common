// マウスで指した場所の座標がつねに表示される
import enchant from 'enchantjs/enchant';
import Hack from 'hackforplay/hack';
import 'hackforplay/core';
import '../hackforplay/enchantjs-kit'; // Core の生成を待つ

const game = enchant.Core.instance;
const { MutableText } = enchant.ui;
const imageDataUrl =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAAAXNSR0IArs4c6QAAAcRJREFUeAHt2y1OA1EUBeD3hpJ6HAl7QCIwOPbABnBIFoHEsQK2gUEg2QMJDk8K8+hr0p8ES+Yk9KvppObc+U7v1PSV4kWAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAIH/IFCTN3F2306Gw++7WttFrfV4yllaa++t1adxcXD7clPfpszezYoVsMKfj69DaUe7A019PZb6MX4Op6kSZlPf8Dqvf/OHUo6er2exL0Gf5fzhq5XlLMvLq/VsU74vDTKv/tjJJP9OTc4SLGDaZ/5v9u0nU//+bJNLiRWwO8Q+Xysg3L4CFBAWCMfbAAWEBcLxNkABYYFwvA1QQFggHG8DFBAWCMfbAAWEBcLxNkABYYFwvA1QQFggHG8DFBAWCMfbAAWEBcLxNkABYYFwvA1QQFggHG8D9rWA/v/88L1v4pOzxDagH47YCIQvkrPEzgf0kyllPl6u/p8fLGB1QGMx3KZGiG1AP5HST6aMY3lMPAJ6Zs9Ono5JlS6XAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECfy/wA9qGU1T+GdfUAAAAAElFTkSuQmCC';

game.on('load', () => {
	if (Hack.coordinateLabel) {
		// すでに coordinateLabel が存在していた
		throw new Error('Hack.coordinateLabel has already exist');
	}

	// ラベルを初期化
	const label = new MutableText(360, 300);
	// Hack に参照を追加
	Hack.coordinateLabel = label;
	// クリックの邪魔にならないように
	label.touchEnabled = false;

	// 青い枠を初期化
	const sprite = new enchant.Sprite(96, 96);
	sprite.moveTo(360, 300);
	const surface = enchant.Surface.load(
		imageDataUrl,
		() => {
			sprite.image = surface;
			Hack.menuGroup.addChild(sprite);
		},
		() => {}
	);

	sprite.touchEnabled = false;
	// Hack に参照を追加
	Hack.coordinateSprite = label;

	// マウスの位置を追跡
	game._element.addEventListener('mousemove', event => {
		const { clientX, clientY } = event;
		let x = '';
		let y = '';

		// マウスが重なっている一番手前のカメラを取得
		const camera = Camera.collection
			.filter(camera => camera.contains(clientX, clientY))
			.pop();

		// カメラがあるならマウス座標をゲーム内座標に変換
		if (camera) {
			[x, y] = camera
				.projection(clientX, clientY)
				.map(pos => Math.floor(pos / 32));
		}

		// "(2, 3)" のように表示
		label.text = `(${x}, ${y})`;
		// マウスの位置より上にラベルをおく
		const labelX = clientX - label.width / 2; // マウスの中心
		label.moveTo(labelX, clientY);
		// 枠を移動
		sprite.moveTo((x - 1) * 32, (y - 1) * 32);
	});

	const visibilitySetter = value => () => {
		label.visible = value;
		sprite.visible = value;
	};
	// マウスが離れたら非表示にする
	game._element.addEventListener('mouseleave', visibilitySetter(false));
	// マウスが戻ってきたらまた表示する
	game._element.addEventListener('mouseenter', visibilitySetter(true));

	Hack.menuGroup.addChild(label);
});
