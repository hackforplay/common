import test from 'ava';
import { RPGObjectWithSynonym } from '../object/object';
import { synonyms } from './rpgobject';

test('RPGObject instance has synonyms', t => {
  const instance: any = new RPGObjectWithSynonym();
  for (const synonym of Object.keys(synonyms)) {
    const key = synonyms[synonym];
    if (key) {
      t.deepEqual(
        instance[synonym],
        instance[key],
        `${synonym} should be same to ${key} at RPGObject`
      );
      t.truthy(key in instance, `${synonym} should define but undefined`);
    }
  }
});
