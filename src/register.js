import { register, Rule } from '.';

const _global = window || global;
register(_global);
_global.rule = new Rule();
