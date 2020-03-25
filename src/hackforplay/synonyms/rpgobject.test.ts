import test from 'ava';
import { RPGObjectWithSynonym } from '../object/object';
import { synonyms } from './rpgobject';

test('RPGObject instance has synonyms', t => {
  const instance: any = new RPGObjectWithSynonym();
  for (const synonym of Object.keys(synonyms)) {
    const obj = synonyms[synonym];
    if (obj) {
      t.deepEqual(
        instance[synonym],
        instance[obj.name],
        `${synonym} should be same to ${obj.name} at RPGObject`
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
