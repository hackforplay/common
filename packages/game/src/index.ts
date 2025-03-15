import enchant from './enchantjs/enchant';
import './enchantjs/fix';
import './hackforplay/core';
import { getHack } from './hackforplay/get-hack';
import register from './hackforplay/register';
import Rule from './hackforplay/rule';

const Hack = getHack();

export { Hack, enchant, register, Rule };

// Export types
export type { Definition } from './definition';
