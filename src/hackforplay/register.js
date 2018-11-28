import Hack from './hack';
import Skin from './skin';
import Family from './family';
import RPGObject from './object/object';
import MapObject from './object/map-object';
import Player from './object/player';
import Effect from './object/effect';
import BehaviorTypes from './behavior-types';
import Key from './key';
import game from './game';
import RPGMap from './rpg-map';
import TextArea from './ui/textarea';
import Rule from './rule';
import enchant from '../enchantjs/enchant';
import random from './random';
import * as Dir from './dir';

export default function register(_global) {
  // Export to global
  _global.Hack = _global.Hack || Hack;
  _global.Skin = _global.Skin || Skin;
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
}
