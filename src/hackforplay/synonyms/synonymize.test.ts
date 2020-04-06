import test from 'ava';
import { synonymize, synonymizeClass, PropertyMissing } from './synonymize';

test('synonymize', t => {
  let isPropertyMissing = false;

  const obj =
    synonymize(
      {
        key: 'value'
      },
      {
        synonym: {
          type: 'primitive',
          name: 'key'
        }
      },
      name => {
        isPropertyMissing = true;
        t.is(name, 'missingProperty');
      }
    ) as any;

  t.is(obj.key, obj.synonym, 'synonym is defined');
  t.false(isPropertyMissing);

  t.is(obj.missingProperty, undefined, `synonym isn't defined`);
  t.true(isPropertyMissing);
});

test('synonymizeClass', t => {
  let isPropertyMissing = false;

  class Sample {
    get key() {
      return 'value';
    }

    [PropertyMissing](chainedName: string) {
      isPropertyMissing = true;
      t.is(chainedName, 'missingProperty');
    }
  }
  const SampleWithSynonym = synonymizeClass(Sample, {
    synonym: { type: 'primitive', name: 'key' }
  });

  const obj = new SampleWithSynonym() as any;

  t.is(obj.key, obj.synonym, 'synonym is defined');
  t.false(isPropertyMissing);

  t.is(obj.missingProperty, undefined, `synonym isn't defined`);
  t.true(isPropertyMissing);
});
