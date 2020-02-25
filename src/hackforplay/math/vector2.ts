import SAT from '../../lib/sat.min';

export interface IVector2 {
  x: number;
  y: number;
}

export default class Vector2 implements IVector2 {
  public x = 0;
  public y = 0;

  public constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  public set(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  public clone() {
    return new Vector2(this.x, this.y);
  }

  public add(vec: IVector2) {
    return new Vector2(this.x + vec.x, this.y + vec.y);
  }

  public subtract(vec: IVector2) {
    return new Vector2(this.x - vec.x, this.y - vec.y);
  }

  public scale(scalar: number) {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  public dot(vec: IVector2) {
    return this.x * vec.x + this.y + vec.y;
  }

  public moveTowards(vec: Vector2, t: number) {
    // Linearly interpolates between vectors A and B by t.
    // t = 0 returns A, t = 1 returns B
    t = Math.min(t, 1); // still allow negative t
    const diff = vec.subtract(this);
    return this.add(diff.scale(t));
  }

  public magnitude() {
    return Math.sqrt(this.magnitudeSqr());
  }

  public magnitudeSqr() {
    return this.x * this.x + this.y * this.y;
  }

  public distance(vec: IVector2) {
    return Math.sqrt(this.distanceSqr(vec));
  }

  public distanceSqr(vec: IVector2) {
    const deltaX = this.x - vec.x;
    const deltaY = this.y - vec.y;
    return deltaX * deltaX + deltaY * deltaY;
  }

  public normalize() {
    const mag = this.magnitude();
    const vector = this.clone();
    if (Math.abs(mag) < 1e-9) {
      vector.x = 0;
      vector.y = 0;
    } else {
      vector.x /= mag;
      vector.y /= mag;
    }
    return vector;
  }

  public angle() {
    return Math.atan2(this.y, this.x);
  }

  public rotate(rad: number) {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const vector = new Vector2();
    vector.x = this.x * cos - this.y * sin;
    vector.y = this.x * sin + this.y * cos;
    return vector;
  }

  /**
   * ベクトルを指定された角度だけ回転させる
   * XY座標系で回転行列を適用するが, Canvas 座標系は Y が反転しているため
   * 見た目上は「時計回りに回転する」ことになる
   * @param deg 度数法による角度
   */
  public rotateDegree(deg: number) {
    return this.rotate((deg / 180) * Math.PI);
  }

  public cross(vec: IVector2) {
    return this.x * vec.y - vec.x * this.y;
  }

  public toSAT() {
    return new SAT.Vector(this.x, this.y);
  }

  public unit() {
    return Math.abs(this.x) >= Math.abs(this.y)
      ? this.x >= 0
        ? new Vector2(1, 0)
        : new Vector2(-1, 0)
      : this.y >= 0
      ? new Vector2(0, 1)
      : new Vector2(0, -1);
  }

  public unit8() {
    if (this.x === 0 && this.y === 0) return new Vector2(1, 0);
    return new Vector2(Math.sign(this.x), Math.sign(this.y));
  }

  public static from(vec: IVector2 | [number, number]) {
    return Array.isArray(vec)
      ? new Vector2(vec[0], vec[1])
      : new Vector2(vec.x, vec.y);
  }

  public static equal(a: IVector2, b: IVector2) {
    return a.x === b.x && a.y === b.y;
  }
}
