/* random
 * Random value between min to max (Detection type)
 * (int, int) ===> int
 * (float, int|float) ====> float
 * (value, value) ====> value ~ value
 * (value) ====> 0 ~ value
 * (Array) ====> value in Array
 * () ====> 0 ~ 1
 */
export default function random(min, max) {
  if (arguments.length === 0) return Math.random();
  if (min instanceof Array) {
    var keys = Object.keys(min);
    return min[keys[random(keys.length)]];
  }
  var _min = arguments.length >= 2 ? Math.min(min, max) : 0;
  var _sub = arguments.length >= 2 ? Math.max(min, max) - _min : min;
  if (min % 1 === 0 && (max === undefined || max % 1 === 0)) {
    return (_min + Math.random() * _sub) >> 0; // integer
  } else {
    return _min + Math.random() * _sub;
  }
}
