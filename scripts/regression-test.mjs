/* Production-mode UI regressions: deterministic requests, no running PHP needed. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
const bundle = fs.readFileSync(new URL('../.cache/app-smoke.js', import.meta.url), 'utf8');
const tick = () => new Promise(resolve => setTimeout(resolve, 25));
const member = {id: 7, name: 'Test Maker', username: 'testmaker', skills: [], avatarUrl: '/avatars/orbit-ollie.svg', avatarChoice: 'orbit-ollie', website: 'https://example.com'};
const model = {id: 1, name: 'Test model', provider: 'Test provider', description: 'Try coding with it.', ratingCount: 0, averageRating: null};
function harness(path, config = {}, handler = () => ({})) {
    const errors = [];
    const vc = new VirtualConsole(); vc.on('jsdomError', error => errors.push(error.message));
    const dom = new JSDOM('<!doctype html><head><meta name="csrf-token" content="old-token"></head><body><div id="app"></div></body>', {url: `https://test.local${path}`, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc});
    const w = dom.window;
    w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
    w.VibeDockConfig = {apiEnabled: true, currentUser: null, ...config};
    const calls = [];
    w.fetch = async (url, options) => {
        calls.push({url, options});
        const result = await handler(url, options);
        return {ok: !(result.status >= 400), status: result.status || 200, json: async () => result};
    };
    w.eval(bundle);
    const $ = selector => w.document.querySelector(selector);
    const click = selector => { const el = typeof selector === 'string' ? $(selector) : selector; assert.ok(el, `Missing control ${selector}`); el.dispatchEvent(new w.MouseEvent('click', {bubbles:true, cancelable:true})); };
    const input = (selector, value) => {const el = $(selector); el.value = value; el.dispatchEvent(new w.Event('input', {bubbles:true}));};
    const submit = selector => (typeof selector === 'string' ? $(selector) : selector).dispatchEvent(new w.Event('submit', {bubbles:true, cancelable:true}));
    return {w, $, click, input, submit, calls, close() {assert.deepEqual(errors, []); w.close();}};
}

{
    const h = harness('/u/bad%encoding', {apiEnabled:false});
    assert.ok(h.$('.site-header'), 'malformed URL must not crash boot');
    h.close();
}
{
    let retry = false;
    const h = harness('/models', {}, async url => url === '/api/feed' ? retry ? {data:[]} : {status:503, message:'Polls temporarily unavailable'} : {});
    await tick();
    assert.equal(h.w.location.pathname, '/feed');
    assert.equal(h.w.location.search, '?filter=poll');
    assert.equal(h.$('.catalogue-grid'), null);
    assert.ok(h.$('.community-section'));
    assert.equal(h.$('[data-page="polls"]'), null, 'polls are a feed filter, not a standalone destination');
    assert.match(h.$('.feed-status').textContent, /temporarily unavailable/);
    retry = true; h.click('[data-action="reload-feed"]'); await tick();
    assert.match(h.$('.feed-empty').textContent, /Nothing here yet/);
    assert.match(h.w.document.title, /poll/i);
    assert.ok(!h.calls.some(call => call.url.includes('/api/models')));
    h.close();
}
{
    const h = harness('/posts/old-post', {}, async url => url === '/api/posts/old-post' ? {post:{id:'old-post', type:'launch', title:'An older launch', body:'Long body', seoDescription:'My launch search description', projectUrl:'https://example.com'}} : {data:[]});
    await tick();
    assert.equal(h.$('.post-card').dataset.post, 'old-post', 'deep links fetch outside the latest feed');
    assert.equal(h.w.document.title, 'An older launch | VibeDock');
    assert.equal(h.$('meta[name="description"]').content, 'My launch search description');
    assert.equal(h.$('link[rel="canonical"]').href, 'https://test.local/posts/old-post');
    h.close();
}
{
    const h = harness('/create/post', {}, async url => {
        if (url === '/login') return {user:member, csrfToken:'fresh-token'};
        if (url === '/api/posts') return {post:{id:'new',type:'discussion',body:'Hello builders'}};
        return {data:[]};
    });
    await tick(); h.click('.create-page [data-action="open-auth"][data-mode="login"]');
    assert.ok(h.$('[href="/auth/google/redirect"]'));
    assert.ok(h.$('[href="/auth/facebook/redirect"]'));
    h.input('[name="email"]', 'test@example.com'); h.input('[name="password"]', 'password'); h.submit('[data-form="auth"]'); await tick();
    assert.equal(h.$('meta[name="csrf-token"]').content, 'fresh-token');
    h.input('[name="body"]', 'Hello builders'); h.submit('[data-form="compose"]'); await tick();
    assert.equal(h.calls.find(call=>call.url==='/api/posts').options.headers['X-CSRF-TOKEN'], 'fresh-token');
    assert.equal(h.$('[data-type="model"]'), null);
    h.close();
}
{
    let resolveVote;
    const launches = [{id:'a',type:'launch',title:'First',upvotes:3,downvotes:0}, {id:'b',type:'launch',title:'Second',upvotes:3,downvotes:0}];
    const h = harness('/rankings', {currentUser:member}, async url => {
        if (url === '/api/rankings') return {tools:launches, leaderboard:[]};
        if (url.endsWith('/vote')) return await new Promise(resolve => {resolveVote=resolve;});
        return {data:[]};
    });
    await tick();
    h.click('[data-post-id="b"][data-vote="1"]'); h.click('[data-post-id="b"][data-vote="1"]');
    assert.equal(h.calls.filter(call=>call.url.endsWith('/vote')).length, 1, 'double-click must not toggle twice');
    resolveVote({upvotes:4,downvotes:0,launchVote:1}); await tick();
    assert.match(h.$('.ranking-launch-copy').textContent, /Second/, 'vote immediately reorders ranking');
    h.close();
}
{
    const h = harness('/rankings', {}, async url => url === '/api/rankings' ? {status:503,message:'Rankings unavailable'} : {data:[]});
    await tick(); assert.ok(h.$('[data-action="reload-rankings"]'), 'failed ranking load offers retry');
    h.close();
}
{
    let save;
    const h = harness('/settings/profile', {currentUser:member}, async url => url === '/api/profile' ? await new Promise(resolve=>{save=resolve;}) : {});
    h.input('[name="name"]', 'New Name');
    h.submit('[data-form="profile"]'); h.submit('[data-form="profile"]');
    assert.equal(h.calls.filter(call=>call.url==='/api/profile').length, 1, 'both save buttons share a submission guard');
    assert.equal([...h.w.document.querySelectorAll('[data-form="profile"] [type="submit"]')].every(button=>button.disabled), true);
    save({status:422,message:'Please try again'}); await tick();
    assert.equal(h.$('[name="name"]').value, 'New Name', 'failed save keeps draft');
    assert.equal(h.$('[name="website"]').value, member.website, 'reload profile data preserves website');
    assert.equal(h.$('[data-form="profile"] [type="submit"]').disabled, false);
    h.close();
}
{
    let resolveFirst;
    const h = harness('/u/first', {}, async url => {
        if (url === '/api/users/first') return await new Promise(resolve => {resolveFirst=resolve;});
        if (url === '/api/users/second') return {user:{...member,username:'second',name:'Second Maker'},posts:[],relationship:{}};
        return {};
    });
    h.w.history.pushState({}, '', '/u/second'); h.w.dispatchEvent(new h.w.PopStateEvent('popstate'));
    await tick(); assert.match(h.$('.profile-heading-row h1').textContent,/Second Maker/);
    resolveFirst({user:{...member,username:'first',name:'First Maker'},posts:[],relationship:{}});
    await tick(); assert.match(h.$('.profile-heading-row h1').textContent,/Second Maker/, 'stale profile response must not overwrite the current profile');
    h.click('[data-action="go-page"][data-page="home"]');
    h.w.history.pushState({}, '', '/u/second'); h.w.dispatchEvent(new h.w.PopStateEvent('popstate')); await tick();
    assert.ok(h.$('.profile-card'), 'returning to a profile must not get stuck at not-found');
    h.close();
}
console.log('PASS: malformed URLs, loading/retry, catalogue retirement, deep-link SEO, refreshed CSRF, ranking votes, profile double-save protection');

for (const [kind, type] of [['post','discussion'], ['question','question'], ['poll','poll'], ['launch','launch']]) {
    const h = harness(`/create/${kind}`, {apiEnabled:false, currentUser:member});
    assert.equal(h.$('[data-form="compose"]').dataset.type, type);
    assert.equal(h.$('.modal-backdrop'), null);
    assert.equal(h.$('.compose-type-switch'), null);
    if (kind !== 'post') h.input('[name="title"]', `A new ${kind}`);
    h.input('[name="body"]', 'A useful contribution for fellow makers.');
    if (kind === 'poll') {
        const options = h.w.document.querySelectorAll('[name="options[]"]'); options[0].value='Claude'; options[1].value='Gemini';
    }
    if (kind === 'launch') {
        h.input('[name="project_url"]', 'https://example.com');
        h.input('[name="brand_slug"]', 'fresh-brand');
        h.$('[name="brand_authorized"]').checked = true;
        assert.equal(h.$('[data-launch-title]').textContent, 'A new launch');
    }
    h.submit('[data-form="compose"]'); await tick();
    const posts = JSON.parse(h.w.localStorage.getItem('vibedock-preview-posts'));
    assert.equal(posts[0].type, type);
    assert.equal(h.w.location.pathname, kind === 'launch' ? '/launches' : '/feed');
    if (kind === 'launch') {
        assert.equal(posts[0].brand.status, 'pending');
        assert.equal(h.$('.verified-business'), null, 'claiming never self-verifies');
        h.click('[data-action="open-compose"][data-type="launch"]');
        h.input('[name="title"]','Another launch'); h.input('[name="body"]','Another useful contribution');
        h.input('[name="project_url"]','https://example.com'); h.input('[name="brand_slug"]','fresh-brand');
        h.$('[name="brand_authorized"]').checked=true; h.submit('[data-form="compose"]'); await tick();
        assert.match(h.$('[data-form-message]').textContent, /already claimed/);
        assert.equal(h.$('[name="title"]').value,'Another launch');
        assert.equal(JSON.parse(h.w.localStorage.getItem('vibedock-preview-posts')).length,posts.length);
        h.click('[data-action="open-my-profile"]'); await tick();
        assert.match(h.$('.member-badges').textContent,/First step/);
        assert.match(h.$('.member-badges').textContent,/Launched it/);
    }
    h.close();
}
{
    let resolveSave;
    const h = harness('/create/launch', {currentUser:member}, async url => url === '/api/posts' ? await new Promise(resolve=>{resolveSave=resolve;}) : {data:[]});
    h.input('[name="title"]','My draft'); h.input('[name="body"]','Useful project details'); h.input('[name="project_url"]','https://example.com');
    await tick();
    assert.equal(h.$('[name="title"]').value,'My draft','background account request must preserve form');
    h.submit('[data-form="compose"]'); h.submit('[data-form="compose"]');
    assert.equal(h.calls.filter(call=>call.url==='/api/posts').length,1,'duplicate publish is guarded');
    resolveSave({status:422,message:'Please choose another handle.'}); await tick();
    assert.equal(h.$('[name="title"]').value,'My draft');
    assert.match(h.$('[data-form-message]').textContent,/another handle/);
    assert.equal(h.$('[data-form="compose"] [type="submit"]').disabled,false);
    h.close();
}
{
    const h=harness('/admin',{apiEnabled:false,currentUser:{...member,isAdmin:true}});
    const form=h.$('[data-form="demo-badge"]');
    form.elements.user.value=String(member.id); form.elements.badge.value='expert';
    h.submit(form); await tick();
    h.click('[data-action="open-my-profile"]');await tick();
    assert.match(h.$('.member-badges').textContent,/Expert/);
    h.close();
}
for (const mode of ['login','register']) {
    const h=harness(`/${mode}`,{apiEnabled:false});
    assert.equal(h.$('[data-form="auth"]').dataset.mode, mode);
    assert.equal(h.w.document.querySelectorAll('[data-action="demo-social"]').length,2);
    h.click('[data-action="demo-social"]'); assert.match(h.$('.toast').textContent,/configured live server/);
    h.close();
}
{
    const h=harness('/settings/profile',{apiEnabled:false,currentUser:member});
    assert.match(h.$('.settings-avatar').src,/fluent-astronaut-256-[a-f0-9]+\.webp/,'old avatar selections resolve to new art');
    const choices=[...h.w.document.querySelectorAll('.avatar-choice img')];
    assert.equal(choices.length,6, 'only the initial male category has images');
    assert.equal(h.w.document.querySelectorAll('.avatar-choice').length,24);
    assert.equal(h.w.document.querySelectorAll('[data-avatar-image]').length,18, 'other groups have request-free placeholders');
    h.click('[data-action="avatar-group"][data-group="Female"]');
    assert.equal(h.w.document.querySelectorAll('[data-avatar-group="Female"] img').length,6);
    h.click('[data-action="avatar-group"][data-group="Characters"]');
    h.click('[data-action="expand-avatars"]');
    assert.equal(h.w.document.querySelectorAll('.avatar-choice img').length,24);
    for (const img of choices) assert.ok(fs.existsSync(new URL(`../public${new URL(img.src).pathname}`,import.meta.url)));
    h.close();
}
console.log('PASS: dedicated creation, safe claims, draft retention, duplicate publish protection, member badges, social entry points, local avatar assets');

{
    let respond;
    const post={id:'react-test',type:'discussion',body:'A useful update',author:member,reactions:{celebrate:0,helpful:0,support:0,laugh:0,wow:0},myReaction:null};
    const h=harness('/feed',{currentUser:member},async url=>{
        if(url==='/api/feed') return {data:[post]};
        if(url.endsWith('/react')) return await new Promise(resolve=>{respond=resolve;});
        return {data:[]};
    });
    await tick(); h.click('[data-action="comment-toggle"]');h.input('.comment-form input','Keep my unfinished reply');
    const card=h.$('.post-card'); const draft=h.$('.comment-form input');
    h.click('[data-action="toggle-reactions"]');
    assert.equal(h.w.document.querySelectorAll('.reaction-choice').length, 6, 'the compact control opens six icon choices');
    assert.equal(h.w.document.querySelectorAll('.reaction-picker img').length, 0, 'the picker does not render emoji image assets');
    h.click('[data-reaction="laugh"]');
    assert.equal(h.calls.filter(call=>call.url.endsWith('/react')).length,1,'one picker choice sends one mutation');
    assert.equal(h.$('[data-action="toggle-reactions"]').disabled,true);
    respond({reactions:{...post.reactions,laugh:1},myReaction:'laugh'}); await tick();
    assert.equal(h.$('.post-card'),card,'reaction updates must not recreate cards or their images');
    assert.equal(h.$('.comment-form input'),draft);
    assert.equal(draft.value,'Keep my unfinished reply');
    assert.match(h.$('[data-action="toggle-reactions"]').getAttribute('aria-label'),/current Haha/);
    h.click('[data-action="toggle-reactions"]');h.click('[data-reaction="wow"]');respond({status:503,message:'Please try again'});await tick();
    assert.match(h.$('[data-action="toggle-reactions"]').getAttribute('aria-label'),/current Haha/,'failure retains previous choice');
    assert.equal(h.$('[data-action="toggle-reactions"]').disabled,false);
    h.close();
}
{
    const h=harness('/feed',{apiEnabled:false,currentUser:member});await tick();
    const first=h.$('.post-card');const id=first.dataset.post;
    h.click(first.querySelector('[data-action="repost"]'));await tick();
    const copies=()=>[...h.w.document.querySelectorAll(`[data-action="toggle-reactions"][data-post-id="${id}"]`)];
    assert.equal(copies().length,2);
    h.click(copies()[0]);h.click(h.$('[data-reaction="wow"]'));await tick();
    assert.ok(copies().every(button=>button.classList.contains('is-selected')),'original and repost reaction views stay in sync');
    h.click(copies()[1]);h.click(h.$('[data-reaction="wow"]'));await tick();
    assert.ok(copies().every(button=>!button.classList.contains('is-selected')));
    h.close();
}
console.log('PASS: on-demand SVG reaction picker, mutation guards, failure recovery, stable cards/drafts, original/repost synchronization');
