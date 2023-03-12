/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: [
    { out: 'main', in: 'src/index.ts' },
    { out: 'register', in: 'src/register.js' }
  ],
  bundle: true,
  loader: { '.png': 'dataurl' },
  outdir: 'dist'
};

require('esbuild').build(options);

require('esbuild').build({
  ...options,
  entryPoints: [
    { out: 'main.min', in: 'src/index.ts' },
    { out: 'register.min', in: 'src/register.js' }
  ],
  minify: true
});
