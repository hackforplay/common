import Hack from './hackforplay/hack';
import Skin from './hackforplay/skin';
import Family from './hackforplay/family';
import RPGObject from './hackforplay/object/object';
import MapObject from './hackforplay/object/map-object';
import Player from './hackforplay/object/player';
import Effect from './hackforplay/object/effect';
import BehaviorTypes from './hackforplay/behavior-types';
import Key from './hackforplay/key';
import game from './hackforplay/game';
import RPGMap from './hackforplay/rpg-map';

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
}
