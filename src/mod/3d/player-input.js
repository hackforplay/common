import '../../hackforplay/core';
import '../../hackforplay/key';
import Player from '../../hackforplay/object/player';
import BehaviorTypes from '../../hackforplay/behavior-types';

import { Vec2 } from 'mod/3d/math';

Player.prototype.onenterframe = function() {
	if (!Hack.isPlaying) return;

	if (this.behavior === BehaviorTypes.Idle) {
		if (this.checkInput('attack')) {
			this.attack();
		}
	}
	if (this.behavior === BehaviorTypes.Idle) {
		var hor = this.checkInput('right') - this.checkInput('left');
		var ver = hor ? 0 : this.checkInput('down') - this.checkInput('up');

		if (!hor && !ver) return;

		// 方向を確認する

		var d = this.cameraDirection;

		var forward = null;

		for (var i = 0; i < 5; ++i) {
			var an = (1 / 4) * i;

			if (Math.abs(an - d) <= 1 / 4 / 2) {
				forward = Vec2.rotate(
					[hor, ver],
					Math.PI - ((Math.PI * 2) / 4) * (i % 4)
				);

				break;
			}
		}

		if (!forward) console.error('player.walk');

		// Turn
		this.forward = forward; //.map(Math.round);
		this.walk(1);
	}
};

Player.prototype.frameOverride = function frameOverride() {
	if (!this.simNode) {
		this.simNode = new RPGObject();
		this.simNode.mod(Hack.assets[this.assetName]);
		this.simNode.visible = false;
	}

	let frame = this.frame;

	// Node の向き

	// 0, 1, 3, 2
	let a1 = Math.floor(frame / 9);
	// 0, 1, 2, 3
	let a2 = [0, 1, 3, 2][a1];

	// カメラの向き

	// 2, 1, 0, 3
	const b1 = Math.floor(this.cameraDirection * 4 + 0.5) % 4;
	// 0, 1, 2, 3
	const b2 = [2, 1, 0, 3][b1];

	// frame 番号

	const c1 = (a2 - b2 + 4) % 4;
	const c2 = [0, 1, 3, 2][c1];

	frame -= Math.floor(frame / 9) * 9;

	frame += c2 * 9;

	this.simNode.frame = frame;

	return this.simNode;
};
