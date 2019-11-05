import * as PIXI from 'pixi.js';
import * as settings from './settings';
import { skinLoader } from './skin-loader';

export const preloader = new PIXI.Loader(settings.baseUrl).use(skinLoader);
