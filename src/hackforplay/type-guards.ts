export const keys = <T extends {}>(o: T): (keyof T)[] =>
  Object.keys(o) as (keyof T)[];
