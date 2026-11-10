import * as esbuild from 'esbuild';

const commonConfig = {
  entryPoints: ['src/AviFlow.js'],
  bundle: true,
  sourcemap: true,
};

async function runBuild() {
  console.log('Building AviFlow library with esbuild...');

  // 1. ES Module build (for bundlers / import statements)
  await esbuild.build({
    ...commonConfig,
    outfile: 'dist/aviflow.esm.js',
    format: 'esm',
  });

  // 2. CommonJS build (for Node.js environments)
  await esbuild.build({
    ...commonConfig,
    outfile: 'dist/aviflow.cjs',
    format: 'cjs',
    footer: { js: 'module.exports = module.exports.default;' }
  });

  // 3. IIFE Minified build (for browser <script> tag usage)
  await esbuild.build({
    ...commonConfig,
    outfile: 'dist/aviflow.min.js',
    format: 'iife',
    globalName: 'AviFlow',
    footer: { js: 'AviFlow = AviFlow.default;' },
    minify: true,
  });

  console.log('Build completed! Output written to ./dist/');
}

runBuild().catch((err) => {
  console.error(err);
  process.exit(1);
});