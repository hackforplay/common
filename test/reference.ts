import test from 'ava';
import { promises as fs } from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import * as rpgobject from '../src/hackforplay/synonyms/rpgobject';

const cases = [
  {
    filePath: '../docs/reference/ja/rpgobject.yml',
    key: 'RPGObject',
    name: 'RPGObject',
    type: 'class',
    synonyms: rpgobject.synonyms
  }
];

test('Reference should be same to synonyms', async t => {
  for (const { filePath, key, name, type, synonyms } of cases) {
    const absPath = path.resolve(__dirname, filePath);
    const reference = await fs.readFile(absPath, 'utf8');
    const root = yaml.safeLoad(reference);

    t.true(key in root, `Yaml should has key "${key}" at ${absPath}`);
    const config = root[key];
    t.is(config.type, type, `${key}.type should be ${type} at ${absPath}`);
    t.is(config.name, name, `${key}.name should be ${name} at ${absPath}`);

    const { fields } = config;
    // 全てのシノニムがリファレンスに書かれていることをテストする
    for (const synonym of Object.keys(synonyms)) {
      const key = synonyms[synonym];
      const field = key && fields[key];
      t.truthy(field, `${key} is missing. a.k.a "${synonym}"`);
      t.is(field.name, synonym, `${key} should be "${synonym}"`);
    }
  }
});
