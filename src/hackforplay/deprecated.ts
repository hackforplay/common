import { default as Family } from './family';
import { getHack } from './get-hack';
import RPGObject from './object/object';
import * as synonyms from './synonyms';

const Hack = getHack();

const checked = new WeakSet();

export default function deprecated() {
  let message = '';
  for (const item of [...RPGObject.collection]) {
    if (checked.has(item)) continue;
    message += checkEvents(item);
    message += checkFamily(item);
    checked.add(item);
  }
  if (isListening(Hack, 'scorechange')) {
    message += `Hack.onscorechange was removed.\n`;
  }
  return message;
}

const deprecatedEvents = ['playerenter', 'playerstay', 'playerexit'];
const deprecatedEventsJp = [
  synonyms.events.playerenter,
  synonyms.events.playerstay,
  synonyms.events.playerexit
];

/**
 * 下記のイベントが利用されていたら, コンソールにエラーを出す
 * playerenter, playerstay, playerexit
 */
function checkEvents(item: RPGObject) {
  // for Japanese (synonym)
  for (const type of deprecatedEventsJp) {
    if (isListening(item, type)) {
      return `Deprecated: '${type}' は廃止予定です. 代わりに 'ふまれた' か 'どかれた' を使ってください\n`;
    }
  }
  // for English (origin)
  for (const type of deprecatedEvents) {
    if (isListening(item, type)) {
      return `Deprecated: '${type}' is deprecated. Please use 'addtrodden' or 'removetrodden' instead.\n`;
    }
  }
  return '';
}

/**
 * Family.エネミー は廃止して Family.モンスターを代わりに使う
 */
function checkFamily(item: RPGObject) {
  if (item.family === Family.エネミー) {
    return 'Family.エネミー ではなく Family.モンスター を使ってください\n';
  }
  return '';
}

function isListening(item: RPGObject, typeName: string) {
  return 'on' + typeName in item || typeName in item._listeners;
}
