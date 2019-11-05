export enum Dir {
  Up = 0,
  Right = 1,
  Down = 2,
  Left = 3
}

export class UnitVector {
  readonly x: number;
  readonly y: number;

  static Down = new UnitVector(0, 1);
  static Left = new UnitVector(-1, 0);
  static Up = new UnitVector(0, -1);
  static Right = new UnitVector(1, 0);

  static fromDir(dir: Dir) {
    return units[dir];
  }

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get dir() {
    if (this.y > 0) return Dir.Down;
    if (this.x < 0) return Dir.Left;
    if (this.y < 0) return Dir.Up;
    return Dir.Right;
  }
}

const units: [UnitVector, UnitVector, UnitVector, UnitVector] = [
  UnitVector.Up,
  UnitVector.Right,
  UnitVector.Down,
  UnitVector.Left
];
