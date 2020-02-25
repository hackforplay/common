import test from 'ava';
import RuleWithSynonym from '../rule';
import { synonyms } from './rule';

test('Rule instance has synonyms', t => {
  const instance: any = new RuleWithSynonym();
  for (const synonym of Object.keys(synonyms)) {
    const key = synonyms[synonym];
    if (key) {
      t.deepEqual(
        instance[synonym],
        instance[key],
        `${synonym} should be same to ${key} at Rule`
      );
      t.truthy(key in instance, `${synonym} should define but undefined`);
    }
  }
});
