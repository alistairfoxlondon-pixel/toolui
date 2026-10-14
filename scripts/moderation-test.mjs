import assert from 'node:assert/strict';
import { checkMessage } from '../resources/js/moderation.js';
for (const text of ['I WILL KILL YOU', 'You are an idiot', 'i will k1ll y0u', 'kill\u200byourself', 'kill yourself', 'kill all muslims', 'তোমাকে মেরে ফেলব', 'Ｉ ＷＩＬＬ ＫＩＬＬ ＹＯＵ']) {
    assert.throws(() => checkMessage(text), /Not sent/, text);
}
assert.throws(() => checkMessage('k\u200bill yourself'), /Not sent/);
for (const text of ['Kill the process, then restart.', 'A bigger trigger for our workflow.', 'I am Muslim.', 'I disagree with your design.', 'The die() function exits PHP.', 'Let’s build a helpful app.', 'স্বাগতম সবাইকে']) {
    assert.doesNotThrow(() => checkMessage(text), text);
}
console.log('PASS: shared moderation rules, case/leet/zero-width/full-width variants, safe coding and identity language');
