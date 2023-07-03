require('esbuild')
  .context({
    entryPoints: ['src/register.js'],
    bundle: true,
    loader: { '.png': 'dataurl' },
    outdir: 'dist'
  })
  .then(ctx => {
    return ctx.serve({});
  })
  .then(({ host, port }) => {
    console.log(`Serving at http://${host}:${port}`);
  });
