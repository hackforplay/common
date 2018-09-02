const BehaviorTypes = {
	None: null, // 無状態 (デフォルトではEventは発火されません)[deprecated]
	Idle: 'idle', // 立ち状態
	Walk: 'walk', // 歩き状態
	Attack: 'attack', // 攻撃状態
	Damaged: undefined, // 被撃状態[deprecated]
	Dead: 'dead' // 死亡状態
};

export default BehaviorTypes;
