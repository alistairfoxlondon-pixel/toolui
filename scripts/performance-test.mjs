import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { brandFontFaces } from './brand-font-plugin.mjs';
import { renderUploadField, validateUpload } from '../resources/js/uploads.js';
import { SKILLS, skillIcon } from '../resources/js/skills.js';

const directory = await mkdtemp(new URL('../.cache/font-test-', import.meta.url).pathname);
try {
    assert.equal(brandFontFaces(directory), '', 'missing licensed fonts must never produce 404 requests');
    await mkdir(join(directory, 'public/fonts/telenor'), {recursive:true});
    const path = join(directory, 'public/fonts/telenor/Telenor-Regular.woff2');
    await writeFile(path, 'test fixture, not a redistributable font');
    const css = brandFontFaces(directory);
    assert.match(css, /font-family: 'Telenor GP'/);
    assert.match(css, /font-weight: 400/); assert.match(css, /font-display: swap/);
    assert.match(css, /Telenor-Regular\.woff2\?v=[0-9a-f]{12}/);
    assert.doesNotMatch(css, /Telenor-Bold/);
    await writeFile(path, 'changed fixture');
    assert.notEqual(css, brandFontFaces(directory), 'replacing font invalidates its cache URL');
} finally { await rm(directory, {recursive:true}); }
for (const skill of SKILLS) {
    assert.match(skillIcon(skill.name), /<svg/);
    assert.equal(skillIcon(skill.name), skillIcon(skill.name), 'memoization preserves exact markup');
}
const png = {name:'photo.png',type:'image/png',size:10000};
assert.equal(validateUpload(png,'avatar',true),'');
assert.match(validateUpload({...png,size:6*1024*1024},'avatar',true),/5 MB/);
assert.match(validateUpload({...png,size:3*1024*1024},'logo',true),/2 MB/);
assert.match(validateUpload({name:'page.html',type:'text/html',size:100},'avatar',true),/Choose a PNG/);
assert.equal(validateUpload({name:'logo.svg',type:'image/svg+xml',size:100},'logo',true),'');
assert.match(validateUpload({name:'logo.svg',type:'image/svg+xml',size:100},'logo',false),/live site/);
assert.match(renderUploadField({name:'avatar',title:'Photo',accept:'image/png',hint:'PNG',icon:''}),/aria-labelledby="upload-avatar-label"/);
const app = await readFile(new URL('../resources/js/app.js',import.meta.url),'utf8');
assert.match(app, /\['feed','launches'\]\.includes\(state.page\) && !state.feedLoaded/, 'rankings must not fetch an unused full feed');
console.log('PASS: font activation/cache invalidation, memoized skill artwork, upload types/limits, ranking request scope');
