import 'hackforplay/core';

import gameFunc from './game';
import maps from './maps';
import update from './update';
import vote from './hackforplay/vote';

let gameOnLoad, hackOnLoad;

if (gameFunc._bundled) {
	// (後方互換性) hackforplay.xyz 移植バージョン
	gameOnLoad = gameFunc.gameOnLoad;
	hackOnLoad = gameFunc.hackOnLoad;
} else {
	// ふつうはこちら
	gameOnLoad = gameFunc;
	hackOnLoad = maps;
}

// ゲームをつくる
game.onload = async () => {
	// gameOnLoad より先に実行するイベント
	// lifelabel などが gameOnLoad 時に参照できない対策
	game.dispatchEvent(new enchant.Event('awake'));

	gameOnLoad();

	// Hack.player がないとき self.player を代わりに入れる
	if (self.player && !Hack.player) {
		Hack.player = self.player;
	}

	// update 関数を開始
	game.on('enterframe', update);

	// ゲームクリアの投票（まだクリアしてない人だけ）
	if ((await vote('GAME')) !== 'CLEAR') {
		vote('GAME', 'START'); // ゲーム「スタート」

		Hack.on('gameclear', () => {
			vote('GAME', 'CLEAR'); // ゲーム「クリア」
		});
	}
};

// マップをつくる
Hack.onload = () => {
	// Hack.maps を事前に作っておく
	Hack.maps = Hack.maps || {};
	hackOnLoad();
};

// ゲームスタート
Hack.start();
