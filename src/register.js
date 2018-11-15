import { register, Rule } from '.';

const _global = global || window;
register(_global);
_global.rule = new Rule();
