import MutableText from './mutable-text';

export default class ScoreLabel extends MutableText {
  private _current = 0;

  public score = 0;
  public easing = 2.5;
  public label = 'SCORE:';
  public text = this.label;

  public constructor() {
    super();
    this.on('enterframe', () => {
      if (this.easing === 0) {
        this.text = this.label + (this._current = this.score);
      } else {
        const dist = this.score - this._current;
        if (0 < dist) {
          this._current += Math.ceil(dist / this.easing);
        } else if (dist < 0) {
          this._current += Math.floor(dist / this.easing);
        }
        this.text = this.label + this._current;
      }
    });
  }
}
