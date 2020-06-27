import { log } from '@hackforplay/log';
import enchant from '../enchantjs/enchant';
import BehaviorTypes from './behavior-types';
import Camera from './camera';
import * as Dir from './dir';
import { DirectionWithSynonym } from './direction';
import Family from './family';
import game from './game';
import { getHack } from './get-hack';
import { useGlobals } from './globals';
import Key from './key';
import { langExports } from './lang';
import Effect from './object/effect';
import RPGObject from './object/object';
import Player from './object/player';
import random from './random';
import RPGMap from './rpg-map';
import Rule from './rule';
import { logFromUser } from './stdlog';
import { synonyms } from './synonyms/hack';
import { synonymize } from './synonyms/synonymize';
import { configs } from './think';
import TextArea from './ui/textarea';

log('system', '世界は始まりを告げた。ハローワールド！', '@hackforplay/common');

export default function register(_global) {
  // Export to global
  const hack = _global.Hack || getHack();
  _global.Hack = synonymize(hack, synonyms, chainedName => {
    const message = `ハック に「${chainedName}」はないみたい`;
    log('error', message, '@hackforplay/common');
  });
  const rule = new Rule();
  _global.rule = _global.rule || rule;
  _global.トリガー = _global.トリガー || rule;
  _global.create = rule.create.bind(rule);
  _global.つくる = _global.create;
  // rule.startTimer を Hack.startTimer にコピーする
  hack.startTimer = () => {
    rule.startTimer();
  };
  hack.stopTimer = () => {
    rule.stopTimer();
  };
  _global.ハック = _global.Hack;
  _global.Family = _global.Family || Family;
  _global.なかま = Family;
  _global.RPGObject = _global.RPGObject || RPGObject;
  _global.BehaviorTypes = _global.BehaviorTypes || BehaviorTypes;
  _global.Player = _global.Player || Player;
  _global.Effect = _global.Effect || Effect;
  _global.Key = _global.Key || Key;
  _global.game = _global.game || game;
  _global.RPGMap = _global.RPGMap || RPGMap;
  _global.TextArea = _global.TextArea || TextArea;
  _global.Rule = _global.Rule || Rule;
  _global.enchant = _global.enchant || enchant;
  _global.random = _global.random || random;
  _global.らんすう = _global.random;
  _global.Dir = _global.Dir || Dir;
  _global.Camera = _global.Camera || Camera;
  _global.log = logFromUser;
  _global.Direction = _global.Direction || DirectionWithSynonym;
  _global.むき = DirectionWithSynonym;
  _global.globals = useGlobals('globals');
  _global.へんすう = useGlobals('へんすう');
  Object.assign(_global, langExports);

  // ここからはデバッグ用
  _global.__thinkConfigs = configs;
}
