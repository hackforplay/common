import test from 'ava';
import { synonyms } from './direction';
import { DirectionWithSynonym } from '../direction';

test('Direction enum has synonyms', t => {
  for (const synonym of Object.keys(synonyms)) {
    const key = synonyms[synonym];
    if (!key) return t.fail(`${synonym}: ${key} is not in Direction`);
    const expect = (DirectionWithSynonym as any)[key];
    const actual = (DirectionWithSynonym as any)[synonym];

    t.is(
      actual,
      expect,
      `Direction.${synonym} should be ${expect} but ${actual}`
    );
  }
});
