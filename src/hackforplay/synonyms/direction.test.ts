import test from 'ava';
import { synonyms } from './direction';
import { DirectionWithSynonym } from '../direction';

test('Direction enum has synonyms', t => {
  for (const synonym of Object.keys(synonyms)) {
    const obj = synonyms[synonym];
    if (!obj) throw new Error('Typehint');
    const expect = (DirectionWithSynonym as any)[obj.name];
    const actual = (DirectionWithSynonym as any)[synonym];

    t.truthy(actual, `Direction.${synonym} should be truthy`);
    t.is(
      actual,
      expect,
      `Direction.${synonym} should be ${expect} but ${actual}`
    );
  }
});
