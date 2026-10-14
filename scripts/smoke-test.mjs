/* jsdom smoke test for the VibeDock SPA (preview mode).
 * Build the bundle first:
 *   npx esbuild resources/js/app.js --bundle --format=iife --platform=browser --loader:.css=empty --outfile=/tmp/app-smoke.js
 * Then run:
 *   node scripts/smoke-test.mjs
 */
import fs from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const bundle = '/tmp/app-smoke.js';
if (!fs.existsSync(bundle)) {
    console.error('missing ' + bundle + ' — build it with esbuild first');
    process.exit(1);
}

const vc = new VirtualConsole();
const errors = [];
vc.on('error', (...args) => errors.push(args.map(String).join(' ')));
vc.on('jsdomError', (err) => {
    const message = String(err?.message || err);
    if (message.includes('Could not load img')) return; // jsdom cannot fetch local svg files
    errors.push(message);
});

const dom = new JSDOM(`<!doctype html><html lang="en"><head><title>Preview</title></head><body><a class="skip-link" href="#app">Skip</a><div id="app" tabindex="-1"></div><script>window.VibeDockConfig = { apiEnabled: false, currentUser: null };</script></body></html>`, {
    url: 'https://preview.local/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    resources: undefined,
});

const { window } = dom;
const { document } = window;

window.scrollTo = () => {};

let failures = 0;
const check = (label, condition) => {
    if (condition) {
        console.log('  ok  ' + label);
    } else {
        failures += 1;
        console.log('  FAIL ' + label);
    }
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 20));

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const click = (el) => el && el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
const submit = (form) => form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
const type = (el, value) => { el.value = value; el.dispatchEvent(new window.Event('input', { bubbles: true })); el.dispatchEvent(new window.Event('change', { bubbles: true })); };

window.eval(fs.readFileSync(bundle, 'utf8'));
await flush();

console.log('boot');
check('app shell renders', Boolean($('#app')) && $('#app').innerHTML.length > 500);
check('header renders', Boolean($('.site-header')));
check('hero renders', Boolean($('.hero')));
check('seed posts render', $$('.post-card').length >= 5);
check('hero image renders with illustration', Boolean($('.hero-image')) && /hero-maker\.webp$/.test($('.hero-image').getAttribute('src') || ''));
check('icons render (Material Symbols paths)', $$('svg.icon path').length > 10);
check('document title set', /VibeDock/.test(document.title));

console.log('public navigation (signed out)');
click($('[data-action="go-page"][data-page="models"]'));
await flush();
check('models page renders model tiles', $$('.model-tile').length >= 1);
check('models page has access badges', $$('.model-access-badge').length >= 1);
check('title updated for models', /model/i.test(document.title));

click($('[data-action="go-page"][data-page="launches"]'));
await flush();
check('launches page renders launch cards', $$('.launch-preview-card').length >= 1);

click($('[data-action="go-page"][data-page="rankings"]'));
await flush();
check('rankings page renders', Boolean($('.rankings-grid')));

click($('[data-action="go-page"][data-page="community-chat"]'));
await flush();
check('chat prompts sign in when signed out', Boolean($('.auth-dialog')));
const gateClose = $$('[data-action="close-modal"]');
if (gateClose.length) click(gateClose[gateClose.length - 1]);
await flush();

click($('[data-action="go-page"][data-page="guidelines"]') || $$('[data-action="go-page"]')[0]);
await flush();
check('info page renders', Boolean($('.route-main')));

console.log('auth (demo account)');
click($('[data-action="open-auth"]'));
await flush();
check('auth modal opens', Boolean($('.auth-dialog')));
check('auth modal shows demo credentials', /demo@vibedock\.test/.test($('.auth-dialog').textContent));

const loginTab = $('.auth-dialog [data-action="auth-mode"][data-mode="login"]');
if (loginTab) click(loginTab);
await flush();
const loginForm = $('form[data-form="auth"]');
if (loginForm) {
    type(loginForm.querySelector('input[name="email"]'), 'demo@vibedock.test');
    type(loginForm.querySelector('input[name="password"]'), 'VibeDockDemo2026!');
    submit(loginForm);
    await flush();
    await flush();
}
check('demo login accepted', Boolean($('.user-pill, [data-action="logout"]')));

console.log('feed interactions');
click($('[data-action="go-page"][data-page="home"]'));
await flush();
const allTab = $$('.feed-tab').find((tab) => /^All/.test(tab.textContent.trim()));
if (allTab) click(allTab);
await flush();

const voteButton = $('.poll-option:not(.show-results):not([disabled])');
if (voteButton) {
    click(voteButton);
    await flush();
}
check('poll vote shows results', Boolean($('.poll-option.show-results')));

const likeButton = $('.post-action[data-action="like"]');
if (likeButton) click(likeButton);
await flush();
check('like handled without error', errors.length === 0);

console.log('community chat (signed in)');
click($('[data-action="go-page"][data-page="community-chat"]'));
await flush();
check('chat transcript renders messages', $$('.community-chat-message').length >= 1);
const chatForm = $('form[data-form="community-chat"]');
if (chatForm) {
    type(chatForm.querySelector('textarea[name="body"]'), 'Smoke test message');
    submit(chatForm);
    await flush();
}
check('chat message sends in preview', /Smoke test message/.test($('.community-chat-transcript').textContent));

console.log('compose modal');
click($('[data-action="go-page"][data-page="home"]'));
await flush();
click($('.composer-prompt[data-action="open-compose"]') || $('[data-action="open-compose"]'));
await flush();
check('compose modal opens', Boolean($('.compose-dialog')));
const typeSwitches = $$('.compose-type-switch button, .compose-type-option');
check('compose has 5 types', typeSwitches.length === 5);
const modelSwitch = typeSwitches.find((b) => /model/i.test(b.textContent));
if (modelSwitch) click(modelSwitch);
await flush();
check('model compose shows access + provider fields', Boolean($('.compose-form [name="model_access"]')));
const launchSwitch = typeSwitches.find((b) => /launch/i.test(b.textContent));
if (launchSwitch) click(launchSwitch);
await flush();
check('launch compose has project url field', Boolean($('input[name="project_url"]')));
const closeButtons = $$('[data-action="close-modal"]');
if (closeButtons.length) click(closeButtons[closeButtons.length - 1]);
await flush();
check('compose modal closes', !$('.compose-dialog'));

console.log('profile + pickers');
click($('[data-action="open-my-profile"]'));
await flush();
await flush();
check('profile page renders with cover', Boolean($('.profile-cover')));
check('cover has a gradient class', Boolean($('.profile-cover[class*="cover-"]:not(.profile-cover-anything)')));
const editButton = $('[data-action="edit-profile"]');
if (editButton) click(editButton);
await flush();
check('profile edit dialog opens', Boolean($('.profile-edit-dialog')));
check('cover picker lists 8 choices', $$('.cover-choice').length === 8);
check('cover swatch classes emitted', $$('.cover-swatch-sunset, .cover-swatch-grape, .cover-swatch-ocean').length >= 3);
check('avatar picker lists 15+ choices', $$('.avatar-choice').length >= 15);
check('avatar picker offers random', /random/i.test($('.profile-edit-dialog').textContent));
const coverChoice = $$('.cover-choice')[2];
if (coverChoice) {
    click(coverChoice);
    await flush();
}
check('cover choice selects', Boolean($('.cover-choice.is-selected')));
const saveForm = $('form[data-form="profile"]');
if (saveForm) {
    submit(saveForm);
    await flush();
}
check('profile save closes dialog', !$('.profile-edit-dialog'));

console.log('messages + admin preview');
click($('[data-action="go-page"][data-page="messages"]'));
await flush();
check('messages page renders', Boolean($('.messages-layout, .message-list, .messages-page')));

console.log('page errors');
check('no runtime errors', errors.length === 0);
if (errors.length) console.log(errors.slice(0, 6));

console.log(failures === 0 ? '\nSMOKE TEST PASSED' : `\nSMOKE TEST FAILED (${failures} failures)`);
process.exit(failures === 0 ? 0 : 1);
