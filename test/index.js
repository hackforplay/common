import test from 'ava';

test.cb('Import as a module and initialize game', t => {
	const { enchant, Hack, register } = require('../src/');

	register(global);
	t.is(global.game, enchant.Core.instance);

	const gameOnLoad = require('./helpers/game').default;
	const hackOnLoad = require('./helpers/maps').default;

	game.onload = () => {
		// gameOnLoad より先に実行するイベント
		// lifelabel などが gameOnLoad 時に参照できない対策
		game.dispatchEvent(new enchant.Event('awake'));

		gameOnLoad();

		// Hack.player がないとき self.player を代わりに入れる
		if (self.player && !Hack.player) {
			Hack.player = self.player;
		}
		t.pass('game.onload');
		t.end();
	};
	Hack.onload = () => {
		// Hack.maps を事前に作っておく
		Hack.maps = Hack.maps || {};
		hackOnLoad()
		t.pass('Hack.onload');
	};

	// game.onload と Hack.onload がどちらも終了すればパス
	t.plan(3);

	// ゲームスタート
	Hack.start();
});
