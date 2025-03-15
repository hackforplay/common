import test from 'ava';
import RuleWithSynonym from '../rule';
import { synonyms } from './rule';

test('Rule instance has synonyms', t => {
  const instance: any = new RuleWithSynonym();
  for (const synonym of Object.keys(synonyms)) {
    const obj = synonyms[synonym];
    if (obj) {
      t.deepEqual(
        instance[synonym],
        instance[obj.name],
        `${synonym} should be same to ${obj.name} at Rule`
      );
      t.truthy(obj.name in instance, `${synonym} should define but undefined`);
      t.is(
        obj.type === 'function',
        typeof instance[synonym] === 'function',
        `synonym types should be same`
      );
    }
  }
});
