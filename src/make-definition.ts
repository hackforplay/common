/**
 * synonyms ファイルを元に dist/ja/definition.json を生成するツール
 * 実行には typescript と ts-node を要する
 */
import { promises as fs } from 'fs';
import * as path from 'path';
import { Definition, ObjectValue } from './definition';
import { synonyms as _direction } from './hackforplay/synonyms/direction';
import { synonyms as _family } from './hackforplay/synonyms/family';
import { synonyms as _hack } from './hackforplay/synonyms/hack';
import { synonyms as _rpgobject } from './hackforplay/synonyms/rpgobject';
import { synonyms as _rule } from './hackforplay/synonyms/rule';
import { ISynonyms } from './hackforplay/synonyms/synonymize';

make()
  .then(() => console.log('generated'))
  .catch(() => console.error('Failed to generate definition.json'));

async function make() {
  const config = {
    dist: path.resolve(__dirname, '../dist/ja'),
    fileName: 'definition.json'
  };

  const definition: Definition = {
    __lang: 'ja',
    __version: '3',
    classes: {
      RPGObject: makeClass(_rpgobject, 'RPGObject')
    },
    globals: {
      Hack: makeGlobal(_hack, 'ハック'),
      rule: makeGlobal(_rule, 'トリガー'),
      create: { type: 'function', name: 'つくる' },
      Family: makeGlobal(_family, 'なかま'),
      Direction: makeGlobal(_direction, 'むき'),
      globals: makeGlobal({}, 'へんすう')
    },
    this: {
      type: 'instance',
      name: 'this',
      class: 'RPGObject'
    }
  };
  const json = JSON.stringify(definition);

  await fs.mkdir(config.dist, { recursive: true });
  await fs.writeFile(path.join(config.dist, config.fileName), json);
}

/**
 *
 * @param synonyms 各プロパティのシノニム
 * @param globalName グローバルで使えるシノニム名
 */
export function makeGlobal(synonyms: ISynonyms, globalName: string) {
  const def: ObjectValue = {
    type: 'object',
    name: globalName,
    properties: {}
  };
  Object.keys(synonyms).forEach(name => {
    const obj = synonyms[name];
    if (!obj) throw new Error('typehint');
    def.properties[obj.name] = {
      ...obj,
      name // キーは英語、値(name)は多言語
    };
  });
  return def;
}

/**
 *
 * @param synonyms
 * @param globalName グローバルで使えるシノニム名
 */
export function makeClass(synonyms: ISynonyms, globalName: string) {
  const def: ObjectValue = {
    type: 'object',
    name: globalName,
    properties: {}
  };
  Object.keys(synonyms).forEach(name => {
    const obj = synonyms[name];
    if (!obj) throw new Error('typehint');
    def.properties[obj.name] = {
      ...obj,
      name // キーは英語、値(name)は多言語
    };
  });
  return def;
}
