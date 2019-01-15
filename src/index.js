import 'core-js/features/array/from';
import 'core-js/features/weak-map';
import 'core-js/features/weak-set';
import 'core-js/features/object/assign';

import enchant from './enchantjs/enchant';
import './enchantjs/fix';
import './hackforplay/core';
import Hack from './hackforplay/hack';
import register from './hackforplay/register';
import Rule from './hackforplay/rule';

export { Hack, enchant, register, Rule };
