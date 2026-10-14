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
    const submit = selector => $(selector).dispatchEvent(new w.Event('submit', {bubbles:true, cancelable:true}));
    return {w, $, click, input, submit, calls, close() {assert.deepEqual(errors, []); w.close();}};
}

{
    const h = harness('/u/bad%encoding', {apiEnabled:false});
    assert.ok(h.$('.site-header'), 'malformed URL must not crash boot');
    h.close();
}
{
    let resolve; let retry = false;
    const h = harness('/models', {}, async url => url === '/api/models' ? retry ? {data:[model]} : await new Promise(r => {resolve=r;}) : {});
    assert.match(h.$('.catalogue-grid').textContent, /Loading/);
    assert.equal(h.$('.models-page > .route-empty'), null);
    resolve({status:503, message:'Catalogue temporarily unavailable'}); await tick();
    assert.match(h.$('.models-page').textContent, /temporarily unavailable/);
    retry = true; h.click('[data-action="reload-models"]'); await tick();
    const search = h.$('[data-model-search]'); search.focus();
    h.input('[data-model-search]', 'Test');
    assert.equal(search, h.$('[data-model-search]'), 'search must not replace focused input');
    assert.equal(h.w.document.activeElement, search);
    h.input('[data-model-search]', 'nothing'); assert.match(h.$('.route-empty').textContent, /Try another search/);
    h.input('[data-model-search]', ''); assert.ok(h.$('.catalogue-card'));
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
    const h = harness('/models', {}, async url => {
        if (url === '/login') return {user:member, csrfToken:'fresh-token'};
        if (url === '/api/models') return {data:[model]};
        if (url.endsWith('/rating')) return {model:{...model, ratingCount:1, averageRating:5, myRating:5}};
        return {};
    });
    await tick(); h.click('[data-action="open-auth"][data-mode="login"]');
    h.input('[name="email"]', 'test@example.com'); h.input('[name="password"]', 'password'); h.submit('[data-form="auth"]'); await tick();
    assert.equal(h.$('meta[name="csrf-token"]').content, 'fresh-token');
    h.click('[data-action="rate-model"][data-score="5"]'); await tick();
    assert.equal(h.calls.find(call=>call.url.endsWith('/rating')).options.headers['X-CSRF-TOKEN'], 'fresh-token');
    assert.equal(h.$('[data-score="5"]').getAttribute('aria-pressed'), 'true');
    assert.equal(h.$('[data-type="model"]'), null, 'member model submission must not return');
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
console.log('PASS: malformed URLs, loading/retry, stable search, deep-link SEO, refreshed CSRF, ranking votes, profile double-save protection');
