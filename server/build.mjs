import { build } from 'esbuild';

await build({
  entryPoints: ['src/lambda.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist/lambda.js',
  // The AWS SDK v3 ships in the Lambda runtime — don't bundle it.
  external: ['@aws-sdk/*'],
  minify: true,
  sourcemap: false,
});

console.log('built dist/lambda.js');
