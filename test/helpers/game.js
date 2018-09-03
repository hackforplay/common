async function gameFunc() {
	Hack.changeMap('map1'); // map1 をロード

	self.player = new Player(('▼ スキン', Skin.ナイト)); // プレイヤーをつくる
	player.name = 'プレイヤー';
	player.family = ('▼ ファミリー', Family.プレイヤー);
	player.locate(3, 5); // はじめの位置
	player.hp = 3; // 体力
	player.atk = 1; // こうげき力

	/*+ モンスター アイテム せっち システム */

	/*+ スキル */
}

// game._debug = ('▼ フラグ', false);

export default gameFunc;
