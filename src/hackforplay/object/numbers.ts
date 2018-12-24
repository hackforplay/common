export interface INumbers {
  hp: number;
  atk: number;
  speed: number;
  opacity: number;
  damage: number;
  penetrate: number;
  score: number;
}

// reflection の機能がないので,
const reflectINumbers: INumbers = {
  hp: 0,
  atk: 0,
  speed: 0,
  opacity: 0,
  damage: 0,
  penetrate: 0,
  score: 0
};

export const keys = <(keyof INumbers)[]>Object.keys(reflectINumbers);

const keysOfINumbers: { [key: string]: keyof INumbers } = {
  hp: 'hp',
  たいりょく: 'hp',
  atk: 'atk',
  こうげきりょく: 'atk',
  speed: 'speed',
  あるくはやさ: 'speed',
  opacity: 'opacity',
  みえやすさ: 'opacity',
  damage: 'damage',
  ふれたときのダメージ: 'damage',
  penetrate: 'penetrate',
  かんつうする回数: 'penetrate',
  score: 'score',
  スコア: 'score'
};

export function key(type: string): keyof INumbers | undefined {
  return keysOfINumbers[type];
}

export type Operator = (previous: number, amount: number) => number;

export const equal: Operator = (p, amount) => amount;
export const add: Operator = (p, amount) => p + amount;
export const sub: Operator = (p, amount) => p - amount;
export const multiple: Operator = (p, amount) => p * amount;
export const divide: Operator = (p, amount) => p / amount;
export const max: Operator = (p, amount) => (p > amount ? p : amount);
export const min: Operator = (p, amount) => (p < amount ? p : amount);
export const mod: Operator = (p, amount) => p % amount;

const twoNumberOperators: { [key: string]: Operator } = {
  '=': equal,
  イコール: equal,
  '+': add,
  ふやす: add,
  '-': sub,
  へらす: sub,
  '*': multiple,
  かける: multiple,
  '/': divide,
  わる: divide,
  max: max,
  以上にする: max,
  min: min,
  以下にする: min,
  '%': mod
};

export function operator(operator: string): Operator | undefined {
  return twoNumberOperators[operator];
}
