import { register, Rule } from '.';
import './tmp-skins';

const _global = global || window;
register(_global);
_global.rule = new Rule();
