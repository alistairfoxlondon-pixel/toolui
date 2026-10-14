/* Run with npm test: exercises the standalone community UI without PHP. */
import fs from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const bundle = new URL('../.cache/app-smoke.js', import.meta.url);
if (!fs.existsSync(bundle)) {
    console.error('Missing smoke-test bundle — run npm test.');
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
window.HTMLElement.prototype.scrollIntoView = () => {};

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
check('landing is separate from feed', $$('.post-card').length === 0);
check('hero image renders with illustration', Boolean($('.hero-image')) && /makers-together\.webp$/.test($('.hero-image').getAttribute('src') || ''));
check('four visual feature cards render', $$('.feature-card').length === 4);
check('hero image has responsive source and priority', $('.hero-image').hasAttribute('srcset') && $('.hero-image').getAttribute('fetchpriority') === 'high');
check('hero welcomes signed-out members', /Join the community/.test($('.hero-actions').textContent));
check('landing contains two illustration scenes and badge artwork', $$('.scene-image img').length === 2 && $$('.display-badge').length === 3);
check('landing explains the maker journey', Boolean($('.landing-journey')));
check('hero stays under 30 words', $('.hero').textContent.trim().split(/\s+/).length <= 30);
check('utility icons render (Material Symbols paths)', $$('svg.icon path').length > 10);
check('document title set', /VibeDock/.test(document.title));

console.log('search accessibility');
check('closed search has no dangling ARIA reference', !$('[data-search]').hasAttribute('aria-controls'));
type($('[data-search]'), 'first draft');
await new Promise((resolve) => setTimeout(resolve, 250));
check('search finds a post', Boolean($('.search-result[data-action="open-post"]')));
check('open search references a real region', $('[data-search]').getAttribute('aria-controls') === $('.search-results').id);
type($('[data-search]'), '');
await new Promise((resolve) => setTimeout(resolve, 250));
check('clearing search removes ARIA reference', !$('[data-search]').hasAttribute('aria-controls'));

console.log('compact controls');
click($('[data-action="toggle-search"]'));
check('mobile search opens and receives focus', $('.nav-search').classList.contains('is-open') && document.activeElement === $('[data-search]'));
document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
check('Escape closes mobile search and returns focus', !$('.nav-search').classList.contains('is-open') && document.activeElement === $('[data-action="toggle-search"]'));
click($('[data-action="go-page"][data-page="feed"]'));
await flush();
check('feed has community posts', $$('.post-card').length >= 5);
const mobileFilter = $('[data-feed-filter]');
mobileFilter.value = 'poll';
mobileFilter.dispatchEvent(new window.Event('change', { bubbles: true }));
check('mobile filter changes feed', Boolean($('.poll-panel')) && $('.feed-tab[data-filter="poll"]').getAttribute('aria-selected') === 'true');
click($('.feed-tab[data-filter="all"]'));

console.log('public navigation (signed out)');
click($('.feed-tab[data-filter="discussion"]'));
await flush();
check('mobile filter stays in sync', $('[data-feed-filter]').value === 'discussion');
check('discussion tab announces selection', $('.feed-tab[data-filter="discussion"]').getAttribute('aria-selected') === 'true');
check('discussion tab filters the feed', $$('.post-card').length > 0 && Boolean($('.feed-tab[data-filter="discussion"].is-active')));
click($('.feed-tab[data-filter="all"]'));
await flush();
click($('[data-action="go-page"][data-page="polls"]'));
await flush();
check('polls page shows community votes', Boolean($('.poll-panel')));
check('catalogue navigation removed', !$('[data-page="models"]'));
check('title updated for polls', /poll/i.test(document.title));

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
check('signed-in hero offers posting', /Share a build/.test($('.hero-actions').textContent));
click($('[data-action="go-page"][data-page="feed"]'));
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
const reactionBar = $('.post-reactions');
check('every post exposes six image reactions', $$('.post-card').every(card=>card.querySelectorAll('.post-reactions button').length===6));
check('reaction choices are not hidden in a popup', !$('.reaction-picker'));
click(reactionBar.querySelector('[data-reaction="celebrate"]'));
await flush();
check('visible reaction selects', Boolean($('.reaction-action[data-reaction="celebrate"].is-selected')));
click($('.reaction-action[data-reaction="laugh"]'));
await flush();
check('Haha replaces previous reaction', Boolean($('.reaction-action[data-reaction="laugh"].is-selected')) && !$('.reaction-action[data-reaction="celebrate"].is-selected'));
click($('.reaction-action[data-reaction="laugh"]'));
await flush();
check('click again removes reaction', !$('.reaction-action[data-reaction="laugh"].is-selected'));



console.log('stable feed updates');
const stableCard = $('.post-card');
click(stableCard.querySelector('[data-action="comment-toggle"]'));
const draft = $('.comment-form input');
type(draft, 'Keep my unfinished feedback');
const otherCard = $$('.post-card').find(card => !card.contains(draft));
const unchanged = $('.comment-form').closest('.post-card');
click(otherCard.querySelector('[data-action="like"]'));
await flush();
check('unrelated vote keeps existing card nodes', unchanged === $('.comment-form').closest('.post-card'));
check('unfinished comment survives updates', $('.comment-form input').value === 'Keep my unfinished feedback');
click(unchanged.querySelector('[data-action="like"]'));
await flush();
check('same-post vote keeps comment draft', $('.comment-form input').value === 'Keep my unfinished feedback');

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

console.log('message safety');
const beforeUnsafe = $$('.community-chat-message').length;
const unsafeForm = $('form[data-form="community-chat"]');
type(unsafeForm.querySelector('textarea'), 'I will kill you');
submit(unsafeForm);
await flush();
check('unsafe chat message is blocked before posting', $$('.community-chat-message').length === beforeUnsafe && /Not sent/.test($('.chat-error').textContent));
check('blocked chat draft is preserved', $('textarea[name="body"]').value === 'I will kill you');
type($('textarea[name="body"]'), '');
click($('[data-action="report-message"]'));
await flush();
const reportForm = $('form[data-form="message-report"]');
check('received message opens report form', Boolean(reportForm));
type(reportForm.querySelector('[name="reason"]'), 'harassment');
submit(reportForm);
await flush();
check('preview report is saved honestly', /demo/.test($('.toast').textContent) && Boolean($('[data-action="report-message"][disabled]')));
click($('[data-action="block-member"]'));
await flush();
click($('[data-action="confirm-block"]'));
await flush();
check('blocked author disappears from community messages', !/Maya Chen/.test($('.community-chat-transcript').textContent));
click($('[data-action="blocked-members"]'));
await flush();
check('blocked-member management renders', Boolean($('[data-action="unblock-member"]')));
click($('[data-action="unblock-member"]'));
await flush();
click($('.messaging-dialog [data-action="close-modal"]'));
await flush();
check('unblocking restores preview messages', /Maya Chen/.test($('.community-chat-transcript').textContent));

console.log('private messaging');
click($('[data-action="go-page"][data-page="messages"]'));
await flush();
click($('[data-action="new-message"]'));
await flush();
check('new-message picker has real preview members', $$('.member-result[data-action="open-message-thread"]').length >= 1);
click($('.member-result[data-action="open-message-thread"]'));
await flush();
const privateForm = $('form[data-form="message"]');
check('non-friend private thread is enabled', Boolean(privateForm) && !privateForm.querySelector('textarea').disabled);
type(privateForm.querySelector('textarea'), 'Hello from the private inbox.');
submit(privateForm);
await flush();
check('private message sends and persists', /Hello from the private inbox/.test($('#thread-messages').textContent) && /Hello from the private inbox/.test(window.localStorage.getItem('vibedock-preview-demomaker-threads')));
const privateUnsafe = $('form[data-form="message"]');
type(privateUnsafe.querySelector('textarea'), 'kill yourself');
submit(privateUnsafe);
await flush();
check('unsafe private message is blocked', /Not sent/.test($('.chat-error').textContent) && !/kill yourself/.test($('#thread-messages').textContent));
click($('.thread-block'));
await flush();
click($('[data-action="confirm-block"]'));
await flush();
check('blocked private thread disables composer', $('form[data-form="message"] textarea').disabled);
click($('.thread-block'));
await flush();
check('unblocking re-enables private composer', !$('form[data-form="message"] textarea').disabled);

console.log('dedicated launch page');
click($('[data-action="go-page"][data-page="home"]'));
await flush();
click($('[data-action="open-compose"][data-type="launch"]'));
await flush();
check('launch opens its own page', window.location.pathname === '/create/launch' && Boolean($('.launch-studio')));
check('no mixed-type popup', !$('.compose-dialog') && !$('.compose-type-switch'));
check('launch has project URL', Boolean($('input[name="project_url"]')));
check('launch has SEO description', Boolean($('[name="seo_description"]')));
check('launch has brand claim and consent', Boolean($('[name="brand_slug"]')) && Boolean($('[name="brand_authorized"]')));
type($('[name="title"]'), 'A new launch');
check('launch preview updates live', $('[data-launch-title]').textContent === 'A new launch');

console.log('profile + pickers');
click($('[data-action="open-my-profile"]'));
await flush();
await flush();
check('profile page renders with cover', Boolean($('.profile-cover')));
check('cover has a gradient class', Boolean($('.profile-cover[class*="cover-"]:not(.profile-cover-anything)')));
const editButton = $('[data-action="edit-profile"]');
if (editButton) click(editButton);
await flush();
check('profile editor is a dedicated page', Boolean($('.profile-edit-page')) && window.location.pathname === '/settings/profile' && !$('.modal-backdrop'));
check('80 illustrated skills available', $$('.skill-option .skill-illustration').length === 80);
check('skill choices have unique names', new Set($$('.skill-option').map(el=>el.dataset.skill)).size === 80);
check('skills start compact without a scrollbox', $$('.skill-option:not([hidden])').length < 25);
click($('[data-action="expand-skills"]'));
check('all skills can be expanded', $$('.skill-option:not([hidden])').length === 80);
click($('[data-action="expand-skills"]'));
check('avatar cast starts compact', $$('[data-avatar-group]:not([hidden]) .avatar-choice:not([hidden])').length < 10);
click($('[data-action="expand-avatars"]'));
check('all 12 licensed 3D characters can be expanded', $$('[data-avatar-group]:not([hidden]) .avatar-choice:not([hidden])').length === 12);
click($('.skill-option[data-skill="React"]'));
check('skill selection updates profile field', /React/.test($('input[name="skills"]').value) && $('.skill-option[data-skill="React"]').getAttribute('aria-pressed') === 'true');
type($('[data-skill-search]'), 'Python');
check('skill search filters choices', $$('.skill-option:not([hidden])').length === 1);
type($('[data-skill-search]'), 'no-such-skill');
check('skill search has helpful empty state', !$('.skill-empty').hidden);
type($('[data-skill-search]'), '');
check('cover picker lists 8 choices', $$('.cover-choice').length === 8);
check('cover swatch classes emitted', $$('.cover-swatch-sunset, .cover-swatch-grape, .cover-swatch-ocean').length >= 3);
check('avatar picker has 24 choices in separate groups', $$('.avatar-choice').length === 24 && $$('[data-avatar-group]').length === 3);
click($('[data-action="avatar-group"][data-group="Female"]'));
check('female group contains six portraits', $$('[data-avatar-group="Female"] img').length === 6 && $('[data-avatar-group="Male"]').hidden);
click($('[data-action="avatar-group"][data-group="Male"]'));
check('male group contains six portraits', $$('[data-avatar-group="Male"] img').length === 6 && $('[data-avatar-group="Female"]').hidden);
check('avatar picker offers random', /random/i.test($('.profile-edit-page').textContent));
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
check('profile save returns to profile', !$('.profile-edit-page') && Boolean($('.profile-cover')));
check('profile renders illustrated selected skills', $$('.profile-skill .skill-illustration').length >= 1);

console.log('messages + admin preview');
click($('[data-action="go-page"][data-page="messages"]'));
await flush();
check('messages page renders', Boolean($('.messages-layout, .message-list, .messages-page')));

console.log('page errors');
check('no runtime errors', errors.length === 0);
if (errors.length) console.log(errors.slice(0, 6));

console.log(failures === 0 ? '\nSMOKE TEST PASSED' : `\nSMOKE TEST FAILED (${failures} failures)`);
process.exit(failures === 0 ? 0 : 1);
