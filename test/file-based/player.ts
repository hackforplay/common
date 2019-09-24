/**
 * モジュール的な書き方。今のハックフォープレイの IDE に向いている
 * このコードと main.ts の２つが必要
 */

import { Install, Base } from '../../src/index';

@Install('id@player/1')
class Player extends Base {
  hoge = 1;

  async init() {
    this.hp = 3;
    this.atk = 1;
  }
  async loop() {
    await this.attack();
    await this.loop();
  }
}
