import * as PIXI from 'pixi.js';
import { Dir } from './core/UnitVector';
import { World } from './core/World';

let type = 'WebGL';
if (!PIXI.utils.isWebGLSupported()) {
  type = 'canvas';
}

PIXI.utils.sayHello(type);

const world = World.getDefault();

// main--
const player = world.assetSystem.createAsset('player');

player(({ costume }) => {
  costume('apple');
});

player(({ create }) => {
  create({ x: 0, y: 0 });
  create({ x: 0, y: 1 });
  create({ x: 0, y: 2 });
  create({ x: 0, y: 3 });
  create({ x: 0, y: 4 });
  create({ x: 0, y: 9 });
});

player(({ created }) => {
  created(function() {
    this.x += 1;
    this.p = 1;
    this.hp = 1;
  });
});

// --main

world.start();

window.addEventListener('keydown', event => {
  const player = world.players[1];
  if (event.key === 'ArrowLeft') {
    player.x -= 1;
    player.d = Dir.Left;
  }
  if (event.key === 'ArrowRight') {
    player.x += 1;
    player.d = Dir.Right;
  }
  if (event.key === 'ArrowUp') {
    player.y -= 1;
    player.d = Dir.Up;
  }
  if (event.key === 'ArrowDown') {
    player.y += 1;
    player.d = Dir.Down;
  }
  if (event.key === ' ') {
    player.attack();
  }
});
