import { log } from '@hackforplay/log';
import enchant from '../enchantjs/enchant';
import BehaviorTypes from './behavior-types';
import Camera from './camera';
import * as Dir from './dir';
import Family from './family';
import game from './game';
import { getHack } from './get-hack';
import Key from './key';
import Effect from './object/effect';
import MapObject from './object/map-object';
import RPGObject from './object/object';
import Player from './object/player';
import random from './random';
import RPGMap from './rpg-map';
import Rule from './rule';
import { logFromUser } from './stdlog';
import TextArea from './ui/textarea';

log('system', '世界は始まりを告げた。ハローワールド！', '@hackforplay/common');

export default function register(_global) {
  // Export to global
  _global.Hack = _global.Hack || getHack();
  _global.Family = _global.Family || Family;
  _global.RPGObject = _global.RPGObject || RPGObject;
  _global.BehaviorTypes = _global.BehaviorTypes || BehaviorTypes;
  _global.MapObject = _global.MapObject || MapObject;
  _global.Player = _global.Player || Player;
  _global.Effect = _global.Effect || Effect;
  _global.Key = _global.Key || Key;
  _global.game = _global.game || game;
  _global.RPGMap = _global.RPGMap || RPGMap;
  _global.TextArea = _global.TextArea || TextArea;
  _global.Rule = _global.Rule || Rule;
  _global.enchant = _global.enchant || enchant;
  _global.random = _global.random || random;
  _global.Dir = _global.Dir || Dir;
  _global.Camera = _global.Camera || Camera;
  _global.log = logFromUser;
}
