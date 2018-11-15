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

export default function register(global) {
  // Export to global
  global.Hack = global.Hack || Hack;
  global.Skin = global.Skin || Skin;
  global.Family = global.Family || Family;
  global.RPGObject = global.RPGObject || RPGObject;
  global.BehaviorTypes = global.BehaviorTypes || BehaviorTypes;
  global.MapObject = global.MapObject || MapObject;
  global.Player = global.Player || Player;
  global.Effect = global.Effect || Effect;
  global.Key = global.Key || Key;
  global.game = global.game || game;
  global.RPGMap = global.RPGMap || RPGMap;
  global.TextArea = global.TextArea || TextArea;
  global.Rule = global.Rule || Rule;
}
