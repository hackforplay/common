import test from 'ava';
import { synonyms } from './family';
import FamilyWithSynonym from '../family';

test('Family enum has synonyms', t => {
  for (const synonym of Object.keys(synonyms)) {
    const key = synonyms[synonym];
    if (!key) throw new Error('Typehint');
    const expect = (FamilyWithSynonym as any)[key];
    const actual = (FamilyWithSynonym as any)[synonym];

    t.truthy(actual, `Family.${synonym} should be truthy`);
    t.is(actual, expect, `Family.${synonym} should be ${expect} but ${actual}`);
  }
});
