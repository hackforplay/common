/**
 * Integer random generator
 * @param range Maximam value or Minimam value or An array of candidates
 * @param max Maximam value which includes candidate
 */
export function rand(range: number | number[], max?: number) {
  if (Array.isArray(range)) {
    const index = (Math.random() * range.length) >> 0;
    return range[index]; // one of range
  }
  if (max === undefined) {
    return (Math.random() * (range + 1)) >> 0; // 0~range
  }
  return ((Math.random() * (max - range + 1)) >> 0) + range; // range~max
}

/**
 * Real number random generator
 * @param range Maximam value or Minimam value or An array of candidates
 * @param max Maximam value
 */
export function randf(range: number | number[], max?: number) {
  if (Array.isArray(range)) {
    const index = (Math.random() * range.length) >> 0;
    return range[index]; // one of range
  }
  if (max === undefined) {
    return Math.random() * range; // 0~range
  }
  return Math.random() * (max - range) + range; // range~max
}
