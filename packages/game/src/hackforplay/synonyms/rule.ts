import { ISynonyms } from './synonymize';

export const synonyms: ISynonyms = {
  つくる: { type: 'function', name: 'create' },
  ゲームがはじまったとき: { type: 'function', name: 'gameStarted' },
  つくられたとき: { type: 'function', name: 'created' },
  つねに: { type: 'function', name: 'updated' },
  こうげきするとき: { type: 'function', name: 'attacked' },
  たおされたとき: { type: 'function', name: 'defeated' },
  すすめなかったとき: { type: 'function', name: 'canNotWalk' },
  おかねがかわったとき: { type: 'function', name: 'moneyChanged' },
  じかんがすすんだとき: { type: 'function', name: 'timePassed' },
  タップされたとき: { type: 'function', name: 'tapped' },
  マップがかわったとき: { type: 'function', name: 'mapChanged' },
  あるいたとき: { type: 'function', name: 'walked' },
  ふまれたとき: { type: 'function', name: 'trodden' },
  どかれたとき: { type: 'function', name: 'removeTrodden' },
  ぶつかったとき: { type: 'function', name: 'collided' },
  こうげきされたとき: { type: 'function', name: 'beAttacked' },
  メッセージされたとき: { type: 'function', name: 'messaged' },
  しょうかんされたとき: { type: 'function', name: 'summoned' },
  みつけたとき: { type: 'function', name: 'found' },
  へんすうがかわったとき: { type: 'function', name: 'globalsChanged' }
};
