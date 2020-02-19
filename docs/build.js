const glob = require('glob');
const mkdirp = require('mkdirp');
const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs').promises;

const DIST = path.resolve(__dirname, '../dist/docs');

const input = path.resolve(__dirname, './reference/ja/*.yml');
glob(input, async (err, matches) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  let hasError = false;
  const contents = {
    __lang: 'ja'
  };
  for (const filePath of matches) {
    const fileName = path.basename(filePath, '.yml');
    const content = await fs.readFile(filePath, 'utf8');
    try {
      contents[fileName] = yaml.safeLoad(content);
    } catch (error) {
      console.error(error);
      console.error(`YAML Parse Error in ${filePath}`);
      hasError = true;
    }
  }
  if (hasError) {
    console.error('Build failed. Check above error(s).');
    return;
  }
  const json = JSON.stringify(contents);
  await mkdirp(DIST);
  await fs.writeFile(path.join(DIST, 'ja.json'), json);
});
