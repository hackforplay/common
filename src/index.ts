export class Base {
  hp = 1;
  atk = 1;
  id = '';

  attack() {}
  wait(seconds = 1) {}
}

export interface ICharactor {
  init(this: Base): Promise<void>;
  loop(this: Base): Promise<void>;
}

type Definition = { new (...args: any[]): ICharactor };

let installedAssets = new Map<string, Definition>();

export function Install(id: string) {
  return <T extends Definition>(constructor: T) => {
    installedAssets.set(id, constructor);
    return constructor;
  };
}

let targetThis = '';

export function setThis(id: string) {
  targetThis = id;
  console.log(id);
}

export function init(listener: (this: Base) => Promise<void>) {
  console.log(targetThis, listener);
}

export function loop(listener: (this: Base) => Promise<void>) {
  console.log(targetThis, listener);
}

export function bump(listener: (this: Base, item: Base) => Promise<void>) {
  console.log(targetThis, listener);
}

export function gamestart() {
  console.log(
    Array.prototype.join.apply(installedAssets.keys(), [',']),
    'are installed. Play fun!'
  );
}

export let targetAsset = '';

export function create({ x = 0, y = 0, z = 1, f = 0 }) {
  console.log(targetAsset, 'is created at', x, y, z, 'and towards to', f);
}
