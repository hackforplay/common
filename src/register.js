import { register, Rule, Hack } from '.';
import './tmp-skins';

const _global = global || window;
register(_global);
const rule = (_global.rule = new Rule());

// rule.startTimer を Hack.startTimer にコピーする
Hack.startTimer = () => {
  rule.startTimer();
};
Hack.stopTimer = () => {
  rule.stopTimer();
};
