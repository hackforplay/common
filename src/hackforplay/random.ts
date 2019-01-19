/* random
 * Random value between min to max (Detection type)
 * (int, int) ===> int
 * (float, int|float) ====> float
 * (value, value) ====> value ~ value
 * (value) ====> 0 ~ value
 * (Array) ====> value in Array
 */

export default function random(collectionOrMin: any[] | number, max?: number) {
  if (Array.isArray(collectionOrMin)) {
    return randomCollection(collectionOrMin);
  }
  return randomRange(collectionOrMin, max);
}

export function randomCollection<T>(collection: T[]): T | undefined {
  const index = (Math.random() * collection.length) >> 0;
  return collection[index]; // random in array
}

export function randomRange(min: number, max?: number): number {
  if (max === undefined) return randomRange(0, min);
  if (min === max) return min;
  if (max < min) return randomRange(max, min);
  const sub = max - min;
  if (min % 1 === 0 && max % 1 === 0) {
    return (min + Math.random() * sub) >> 0; // random in integers
  } else {
    return min + Math.random() * sub; // random in floats
  }
}
