import { Cubic, Linear, TweenLite } from 'gsap';
import { Sprite, Texture } from 'pixi.js';
import { enchant } from '..';
import app from '../application';
import { reload } from './feeles';
import game from './game';
import { getHack } from './get-hack';
import SurfaceSprite from './surface-sprite';

const Hack = getHack();
Hack.overlay = overlay;

// overlay
function overlay(...args: any[]) {
  const { width, height } = app.view;

  const sprite = new SurfaceSprite(width, height);
  Hack.overlayGroup.addChild(sprite);

  for (let i = 0; i < args.length; i++) {
    const fill = args[i];
    switch (true) {
      case fill instanceof enchant.Surface:
        sprite.context.drawImage(fill, 0, 0, width, height);
        break;
      case game.assets[fill] instanceof enchant.Surface:
        sprite.context.drawImage(
          game.assets[fill]._element,
          0,
          0,
          width,
          height
        );
        break;
      default:
        sprite.context.fillStyle = fill;
        sprite.context.fillRect(0, 0, game.width, game.height);
        break;
    }
  }

  return sprite;
}

Hack.on('gameclear', async () => {
  const lay = overlay('rgba(0,0,0,0.4)', 'resources/hackforplay/clear.png');
  lay.alpha = 0;
  lay.position.set(-app.stage.x, -app.stage.y);

  await TweenLite.to(lay, 1, { alpha: 1, ease: Linear.easeInOut });

  const retrySprite = new Sprite(
    Texture.from(
      game.assets['resources/hackforplay/new_button_retry.png']._element
    )
  );
  retrySprite.position.set(314 - app.stage.x, 320 - app.stage.y);
  retrySprite.interactive = true;
  retrySprite.on('pointertap', () => {
    // [RETRY] がクリックされたとき
    reload?.();
  });
  Hack.overlayGroup.addChild(retrySprite);

  TweenLite.to(retrySprite, 1.333, {
    x: 314 - app.stage.x,
    y: 0 - app.stage.y,
    ease: Cubic.easeOut
  });
});

Hack.on('gameover', async () => {
  const lay = overlay('rgba(0,0,0,0.4)', 'resources/hackforplay/gameover.png');
  lay.alpha = 0;
  lay.position.set(-app.stage.x, -app.stage.y);

  await TweenLite.to(lay, 1, { alpha: 1, ease: Linear.easeInOut });

  const retrySprite = new Sprite(
    Texture.from(
      game.assets['resources/hackforplay/new_button_retry.png']._element
    )
  );
  retrySprite.position.set(157 - app.stage.x, 320 - app.stage.y);
  retrySprite.interactive = true;
  retrySprite.on('pointertap', () => {
    // [RETRY] がクリックされたとき
    reload?.();
  });
  Hack.overlayGroup.addChild(retrySprite);

  TweenLite.to(retrySprite, 0.666, {
    x: 157 - app.stage.x,
    y: 240 - app.stage.y,
    ease: Cubic.easeOut
  });
});
