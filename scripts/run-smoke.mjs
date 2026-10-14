import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
await mkdir(new URL('.cache/', root), { recursive: true });
await build({
    absWorkingDir: fileURLToPath(root),
    entryPoints: ['resources/js/app.js'],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    loader: { '.css': 'empty' },
    outfile: '.cache/app-smoke.js',
});
await build({ absWorkingDir: fileURLToPath(root), entryPoints: ['scripts/moderation-test.mjs'], bundle: true, format: 'esm', platform: 'node', outfile: '.cache/moderation-test.mjs' });
await import('../.cache/moderation-test.mjs');
await import('./performance-test.mjs');
await import('./regression-test.mjs');
await import('./smoke-test.mjs');
