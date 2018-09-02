import { Sprite } from 'enchantjs/enchant';

game.preload('mod/3d/ui.png');

game.on('awake', () => {
	// 操作説明用の画像を表示する
	const sprite = new Sprite(300, 320);
	sprite.image = game.assets['mod/3d/ui.png'];
	sprite.x = 455;
	Hack.menuGroup.addChild(sprite);

	const button = new Button('', '', 70, 5);
	Hack.domGroup.addChild(button);

	sprite.onenterframe = () => {
		button.x = sprite.x + 8;
		button.y = 122.5;
		if (button._domManager) {
			button._domManager.element.style.opacity = 0.0;
		}
	};

	let count = 0;
	button.ontouchstart = function() {
		const x = ++count % 2 ? 180 : 455;
		sprite.tl.moveTo(x, 0, 30, 'QUAD_EASEINOUT');
	};

	// 3D の操作説明を削除する
	Hack.remove3DUI = () => {
		sprite.remove();
		button.remove();
	};
});
