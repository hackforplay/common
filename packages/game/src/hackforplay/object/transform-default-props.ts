import RPGObject from './object';

/* へんしんするときに初期化するプロパティ名 */
const propNamesToInit = [
  // 初期値で上書きしたいプロパティ
  'damage',
  'speed',
  'opacity',
  'velocityX',
  'velocityY',
  'accelerationX',
  'accelerationY',
  'mass',
  'skill',
  'fieldOfView',
  'lengthOfView',
  // 未初期化状態に戻したいプロパティ
  '_atk',
  '_penetrate',
  '_collisionFlag',
  '_isKinematic'
] as const;

let transformDefaultProps:
  | undefined
  | Pick<RPGObject, (typeof propNamesToInit)[number]> = undefined;

/** へんしんする時に初期化するプロパティとその値 */
export function getTransformDefaultProps() {
  if (!transformDefaultProps) {
    const defaultObject = new RPGObject();
    transformDefaultProps = pick(defaultObject, propNamesToInit);
    defaultObject.destroy();
  }
  return transformDefaultProps;
}

function pick<T, K extends keyof T>(object: T, keys: readonly K[]) {
  const result: any = {};
  for (const key of keys) {
    result[key] = object[key];
  }
  return result as Pick<T, K>;
}
