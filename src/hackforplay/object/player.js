import enchant from '../../enchantjs/enchant';
import RPGObject from './object';
import Key from '../key';
import BehaviorTypes from '../behavior-types';

class Player extends RPGObject {
	constructor(mod) {
		super(mod);

		this.enteredStack = [];
		this.on('enterframe', this.stayCheck);
		this.on('walkend', this.enterCheck);
		this._layer = RPGMap.Layer.Player;

		this.hp = 3;
		this.atk = 1;

		this.input = {
			up: 'up',
			down: 'down',
			left: 'left',
			right: 'right',
			attack: 'space'
		};

		// 歩き終わったときに自動でモノを拾う (pickUp)
		this.isAutoPickUp = true;
	}

	checkInput(type) {
		const input = Array.isArray(this.input[type])
			? this.input[type]
			: [this.input[type]];
		return input
			.map(function(name) {
				return Key[name].pressed;
			})
			.reduce(function(a, b) {
				return a + b;
			});
	}

	onenterframe() {
		if (!Hack.isPlaying) return;

		if (this.behavior === BehaviorTypes.Idle) {
			if (this.checkInput('attack')) {
				this.attack();
			}
		}

		if (this.behavior === BehaviorTypes.Idle) {
			var hor = this.checkInput('right') - this.checkInput('left');
			var ver = hor ? 0 : this.checkInput('down') - this.checkInput('up');
			if (hor || ver) {
				// Turn
				this.forward = [hor, ver];
				this.walk();
			}
		}
	}

	enterCheck() {
		// Dispatch playerenter Event
		RPGObject.collection
			.filter(function(item) {
				return item.mapX === this.mapX && item.mapY === this.mapY;
			}, this)
			.forEach(function(item) {
				item.dispatchEvent(new Event('playerenter'));
				this.enteredStack.push(item);
			}, this);
	}

	stayCheck() {
		// Dispatch playerstay/playerexit Event
		this.enteredStack.forEach(function(item) {
			if (item.mapX === this.mapX && item.mapY === this.mapY) {
				item.dispatchEvent(new Event('playerstay'));
			} else {
				item.dispatchEvent(new Event('playerexit'));
				var index = this.enteredStack.indexOf(item);
				this.enteredStack.splice(index, 1);
			}
		}, this);
	}
}

export default Player;
