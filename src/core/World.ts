import * as PIXI from 'pixi.js';
import { Charactor } from './Charactor';
import { DamageSystem } from './DamageSystem';

export class World extends PIXI.Container {
  damageSystem = new DamageSystem(this);
  players: Charactor[] = [];

  run() {
    this.damageSystem.run();
  }
}
