import * as PIXI from 'pixi.js';
import { Charactor } from './Charactor';

export class World extends PIXI.Container {
  players: Charactor[] = [];
}
