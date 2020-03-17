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
    __version: '2',
    classes: {
      RPGObject: makeClass(_rpgobject)
    },
    globals: {
      Hack: makeGlobal(_hack, true),
      ハック: makeGlobal(_hack, false),
      rule: makeGlobal(_rule, true),
      トリガー: makeGlobal(_rule, false),
      create: { type: 'primitive' },
      つくる: { type: 'primitive' },
      Family: makeGlobal(_family, true),
      なかま: makeGlobal(_family, false),
      Direction: makeGlobal(_direction, true),
      むき: makeGlobal(_direction, false)
    },
    this: {
      type: 'instance',
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
 * @param useNativeLang false なら key (シノニム) を、true なら value (元の名前) を使う
 */
export function makeGlobal(synonyms: ISynonyms, useNativeLang: boolean) {
  const def: ObjectValue = {
    type: 'object',
    properties: {}
  };
  Object.keys(synonyms).forEach(key => {
    const property = useNativeLang ? synonyms[key] || key : key;
    def.properties[property] = {
      type: 'primitive'
    };
  });
  return def;
}

/**
 *
 * @param synonyms
 */
export function makeClass(synonyms: ISynonyms) {
  const def: ObjectValue = {
    type: 'object',
    properties: {}
  };
  Object.keys(synonyms).forEach(key => {
    def.properties[key] = {
      type: 'primitive'
    };
  });
  return def;
}
