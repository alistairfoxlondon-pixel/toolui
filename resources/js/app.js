import '../css/fonts.css';
import '../css/app.css';
import '../css/community-features.css';
import '../css/product-pages.css';
import '../css/refinements.css';
import { ICON_PATHS, ICON_PATHS_FILLED } from './icon-paths.js';
import { checkMessage } from './moderation.js';
import { avatarAsset, avatarPath, avatarResolutionAttributes } from './avatars.js';
import REACTIONS from '../data/reactions.json';
import REACTION_ASSETS from '../data/reaction-assets.json';
import CHARACTER_AVATARS from '../data/character-avatars.json';
import { renderUploadField, syncUpload, validateUpload } from './uploads.js';
import { updateMetadata } from './metadata.js';
import { reconcileCards, routeParts as parseRoute } from './dom.js';
import { SKILLS, skillIcon } from './skills.js';
import { ILLUSTRATED_ICONS } from './illustrated-icons.js';

const root = document.querySelector('#app');
const config = window.VibeDockConfig || { apiEnabled: false, currentUser: null };
const apiEnabled = config.apiEnabled === true;
const STORAGE = {
    user: 'vibedock-preview-user',
    posts: 'vibedock-preview-posts',
};

/* ------------------------------------------------------------------ */
/* Icons — Google Material Symbols Rounded, inlined as SVG paths.      */
/* ------------------------------------------------------------------ */

const iconCache = new Map();
function icon(name, size = 22, className = '', filled = false) {
    const key = `${name}:${size}:${className}:${filled}`;
    if (!iconCache.has(key)) {
        if (iconCache.size >= 512) iconCache.clear();
        iconCache.set(key, renderIcon(name, size, className, filled));
    }
    return iconCache.get(key);
}

function renderIcon(name, size, className, filled) {
    if (ILLUSTRATED_ICONS[name]) return `<svg class="icon illustrated-icon ${filled ? 'is-filled' : ''} ${className}" width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ILLUSTRATED_ICONS[name]}</svg>`;
    const path = (filled ? ICON_PATHS_FILLED[name] : null) || ICON_PATHS[name] || ICON_PATHS.explore;
    return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="${path}"/></svg>`;
}

/* ------------------------------------------------------------------ */
/* Libraries                                                           */
/* ------------------------------------------------------------------ */

const AVATAR_CHOICES = CHARACTER_AVATARS;


const COVER_CHOICES = [
    { key: 'aurora', label: 'Aurora' },
    { key: 'blossom', label: 'Blossom' },
    { key: 'sunset', label: 'Sunset' },
    { key: 'ocean', label: 'Ocean' },
    { key: 'forest', label: 'Forest' },
    { key: 'grape', label: 'Grape' },
    { key: 'peach', label: 'Peach' },
    { key: 'slate', label: 'Slate' },
];

/* ------------------------------------------------------------------ */
/* Seed content (standalone preview only)                              */
/* ------------------------------------------------------------------ */

const seedPosts = [
    {
        id: 'seed-1',
        type: 'discussion',
        title: 'I finally shared my first draft',
        body: 'Posted the rough version instead of polishing forever. The feedback that afternoon was worth it.',
        authorName: 'Maya Chen',
        author: { id: 'demo-mayachen', name: 'Maya Chen', username: 'mayachen', avatarUrl: '/avatars/fluent-fox.png' },
        role: 'Product designer',
        tone: 'tone-coral',
        createdAt: '38 min ago',
        category: 'Build in public',
        tags: ['Build in public'],
        likes: 24,
        liked: false,
        commentsCount: 8,
        comments: [],
    },
    {
        id: 'seed-2',
        type: 'launch',
        title: 'Goodside, a slower kind of city guide',
        body: 'A small guide to independent places in your neighborhood.',
        authorName: 'Ravi Patel',
        author: { id: 'demo-ravipatel', name: 'Ravi Patel', username: 'ravipatel', avatarUrl: '/avatars/fluent-robot.png' },
        role: 'Weekend maker',
        tone: 'tone-mint',
        createdAt: '2 hours ago',
        category: 'First launch',
        launchCategory: 'ai_app',
        tags: ['First launch'],
        likes: 37,
        upvotes: 18,
        downvotes: 2,
        launchVote: null,
        logoUrl: null,
        liked: false,
        commentsCount: 11,
        projectUrl: 'https://example.com',
        comments: [],
    },
    {
        id: 'seed-3',
        type: 'question',
        title: 'How do you keep an AI-generated codebase maintainable?',
        body: 'I’m trying smaller prompts and tests before each change. What works for you?',
        authorName: 'Priya Rahman',
        author: { id: 'demo-priyar', name: 'Priya Rahman', username: 'priyar', avatarUrl: '/avatars/fluent-owl.png' },
        role: 'AI engineer',
        tone: 'tone-lilac',
        createdAt: '3 hours ago',
        category: 'AI models',
        tags: ['AI models', 'Free tools'],
        modelProvider: 'Open community',
        modelAccess: 'free',
        projectUrl: 'https://example.com',
        likes: 42,
        liked: false,
        commentsCount: 9,
        comments: [],
    },
    {
        id: 'seed-4',
        type: 'poll',
        title: 'What takes the most energy when you start?',
        body: '',
        authorName: 'Noah Williams',
        author: { id: 'demo-noahbuilds', name: 'Noah Williams', username: 'noahbuilds', avatarUrl: '/avatars/fluent-astronaut.png' },
        role: 'Creative technologist',
        tone: 'tone-sky',
        createdAt: '4 hours ago',
        category: 'Quick poll',
        tags: ['Process'],
        options: ['First version out', 'Choosing what to build', 'Finding first users'],
        votes: [3, 5, 1],
        votedOption: null,
        likes: 6,
        liked: false,
        commentsCount: 14,
        comments: [],
    },
    {
        id: 'seed-5',
        type: 'discussion',
        title: 'One small build, one useful lesson',
        body: 'A smaller scope and a real deadline helped me finish. What helped you ship this week?',
        authorName: 'Ken Alvarez',
        author: { id: 'demo-kena', name: 'Ken Alvarez', username: 'kenalvarez', avatarUrl: '/avatars/fluent-ninja.png' },
        role: 'Full stack dev',
        tone: 'tone-indigo',
        createdAt: '6 hours ago',
        category: 'AI models',
        tags: ['AI models'],
        modelProvider: 'CodePilot',
        modelAccess: 'freemium',
        projectUrl: 'https://example.com',
        likes: 19,
        liked: false,
        commentsCount: 4,
        comments: [],
    },
];

/* ------------------------------------------------------------------ */
/* State and helpers                                                   */
/* ------------------------------------------------------------------ */

function readStorage(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Storage may be unavailable; the preview stays usable.
    }
}

function normalizePost(post) {
    const category = post.category || '';
    return {
        ...post,
        id: String(post.id),
        title: post.title || '',
        body: post.body || '',
        authorName: post.authorName || post.author?.name || 'Community member',
        author: post.author || { id: null, name: post.authorName || 'Community member', username: post.username || '', avatarUrl: post.avatarUrl || null },
        role: post.role || post.author?.profession || 'Member',
        createdAt: post.createdAt || post.created_at || 'just now',
        category,
        tags: Array.isArray(post.tags) ? post.tags : (category ? [category] : []),
        projectUrl: post.projectUrl || post.project_url || '',
        launchCategory: post.launchCategory || post.launch_category || '',
        modelProvider: post.modelProvider || post.model_provider || '',
        modelAccess: post.modelAccess || post.model_access || '',
        logoUrl: post.logoUrl || post.logo_url || null,
        imageUrl: post.imageUrl || post.image_url || null,
        upvotes: Number(post.upvotes ?? post.upvotes_count ?? 0),
        downvotes: Number(post.downvotes ?? post.downvotes_count ?? 0),
        launchVote: post.launchVote ?? post.launch_vote ?? null,
        likes: Number(post.likes ?? post.likes_count ?? 0),
        liked: Boolean(post.liked),
        reactions: {...Object.fromEntries(REACTIONS.map(item=>[item.key,0])), ...(post.reactions || {})},
        myReaction: post.myReaction || null,
        repostsCount: Number(post.repostsCount ?? post.reposts_count ?? 0),
        sourcePost: post.sourcePost ? normalizePost({ ...post.sourcePost, sourcePost: null }) : null,
        commentsCount: Number(post.commentsCount ?? post.comments_count ?? 0),
        comments: Array.isArray(post.comments) ? post.comments : [],
        options: Array.isArray(post.options) ? post.options : [],
        votes: Array.isArray(post.votes) ? post.votes.map(Number) : [],
        votedOption: post.votedOption ?? post.voted_option ?? null,
    };
}

const storedUser = apiEnabled ? null : readStorage(STORAGE.user);
const storedPosts = apiEnabled ? null : readStorage(STORAGE.posts);
const routeParts = parseRoute(window.location.pathname);
const routePages = {
    feed: 'feed', posts: 'feed', brands: 'feed', settings: 'profile-edit',
    launches: 'launches', models: 'polls', polls: 'polls', badges: 'badges', help: 'help', rankings: 'rankings', 'community-chat': 'community-chat',
    messages: 'messages', about: 'about', guidelines: 'guidelines', privacy: 'privacy',
    terms: 'terms', admin: 'admin', u: 'profile',
};
const creationPages = ['create-post', 'create-question', 'create-poll', 'create-launch'];
function pageForRoute(parts) { return parts[0] === 'create' && creationPages.includes(`create-${parts[1]}`) ? `create-${parts[1]}` : routePages[parts[0]] || 'home'; }
const pathPage = pageForRoute(routeParts);
if (routeParts[0] === 'models') window.history.replaceState({}, '', '/polls');

const state = {
    currentUser: config.currentUser || storedUser || null,
    page: config.initialPage || pathPage,
    profileUsername: config.profileUsername || (pathPage === 'profile' ? routeParts[1] : null),
    initialPostId: config.initialPostId || (routeParts[0] === 'posts' ? routeParts[1] : routeParts[0] === 'brands' ? (storedPosts || []).find(post=>post.brand?.slug===routeParts[1])?.id : null),
    profileData: null,
    profileLoading: false, profileLoadingFor: null, profileRequest: 0,
    profileError: '',
    profileLoadedFor: null,
    blockedUsers: [], safetyLoadedFor: null, reportedMessages: [],
    memberResults: [], memberSearchSeq: 0, memberSearchTimer: null,
    messagingBlocked: false, threadError: '', chatError: '', messageError: '',
    chatDraft: '', messageDrafts: {}, messageReport: null, safetyUser: null,
    messagesPollTimer: null, threadRequest: 0,
    conversations: [],
    conversationsLoaded: false,
    selectedMessageUser: null,
    groupMessages: apiEnabled ? [] : readStorage('vibedock-preview-chat', [{ id: 1, body: 'Welcome to the community chat.', sentByMe: false, createdAt: 'today', user: { id: 'demo-mayachen', name: 'Maya Chen', username: 'mayachen', avatarUrl: '/avatars/fluent-unicorn.png' } }]),
    groupChatLoaded: false,
    groupChatLoading: false,
    groupChatTimer: null,
    rankings: null,
    rankingsLoaded: false, rankingsLoading: false, rankingsError: '',
    pendingLaunchVotes: new Set(),
    pendingReactions: new Set(),
    pendingLikes: new Set(),
    messagePeer: null,
    messages: [],
    messagesLoading: false,
    friendRequests: [],
    friendRequestsLoaded: false,
    posts: (apiEnabled ? [] : (storedPosts || seedPosts)).filter(post => post.type !== 'model').map(normalizePost),
    feedLoaded: !apiEnabled, feedLoading: false, feedError: '',
    postRequests: new Set(), postLoading: new Set(),
    savedIds: (readStorage('vibedock-preview-saved', []) || []).map(String),
    menuPostId: null,
    filter: 'all',
    search: '',
    searchResults: { users: [], posts: [] },
    searchResultsLoading: false,
    searchRequestId: 0,
    searchTimer: null,
    tag: '',
    sort: 'newest',
    modal: config.initialAuthMode || ['login', 'register'].includes(routeParts[0]) ? 'auth' : null,
    authMode: config.initialAuthMode || (routeParts[0] === 'login' ? 'login' : 'register'),
    flashMessage: config.flashMessage || '',
    reportPostId: null,
    mobileMenu: false,
    commentingId: null,
};

function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[character]);
}

function safeUrl(value) {
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
        return '';
    }
}

function safeImageUrl(value) {
    const asset = avatarAsset(value);
    if (asset) return asset.small;
    const url = safeUrl(value);
    if (url) return url;
    if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) {
        return new URL(value, window.location.origin).href;
    }
    return typeof value === 'string' && /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value) ? value : '';
}

function initials(name = 'Member') {
    return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'M';
}

function toneFor(name = '') {
    const tones = ['tone-indigo', 'tone-coral', 'tone-mint', 'tone-sky', 'tone-lilac'];
    const value = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return tones[value % tones.length];
}

function avatar(name, tone = toneFor(name), extraClass = '', imageUrl = null) {
    const safeImage = imageUrl ? safeImageUrl(imageUrl) : avatarPath(AVATAR_CHOICES[[...name].reduce((n,c) => n+c.charCodeAt(0),0) % AVATAR_CHOICES.length].key);
    const pixels = extraClass.includes('hero') ? 112 : extraClass.includes('small') || extraClass.includes('mini') ? 32 : 40;
    const eager = extraClass.includes('small') || extraClass.includes('hero');
    return `<span class="avatar ${tone} ${extraClass}" aria-hidden="true">${safeImage ? `<img src="${escapeHtml(safeImage)}" alt="" ${avatarResolutionAttributes(safeImage, pixels)} loading="${eager ? 'eager' : 'lazy'}" decoding="async" width="${pixels}" height="${pixels}">` : escapeHtml(initials(name))}</span>`;
}

function prettyType(type) {
    return ({ discussion: 'Discussion', question: 'Question', poll: 'Poll', launch: 'Launch', model: 'AI model', repost: 'Repost' })[type] || 'Post';
}

function typeIcon(type) {
    return ({ discussion: 'forum', question: 'chat_bubble', poll: 'bar_chart', launch: 'rocket_launch', model: 'smart_toy', repost: 'repeat' })[type] || 'explore';
}

function brandMark() {
    return `<span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 38 38" fill="none"><rect x="1" y="1" width="36" height="36" rx="11" fill="currentColor"/><path d="m10 12 8.2 15L27 12" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><path d="m28.4 6.6.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z" fill="#C9F582"/></svg></span>`;
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

function renderSearchResults() {
    const query = state.search.trim();
    if (!query) return '';
    if (query.length < 2) return '';
    if (state.searchResultsLoading) return '';
    const users = state.searchResults.users || [];
    const posts = state.searchResults.posts || [];
    if (!users.length && !posts.length) return '';
    return `<div class="search-results" id="community-search-results" role="region" aria-label="Search results">${users.length ? `<span class="search-results-label">People</span>${users.map((user) => `<button class="search-result" data-action="open-profile" data-username="${escapeHtml(user.username)}">${avatar(user.name, toneFor(user.name), 'avatar-search', user.avatarUrl)}<span><strong>${escapeHtml(user.name)}</strong><small>@${escapeHtml(user.username)}</small></span>${icon('open_in_new', 17)}</button>`).join('')}` : ''}${posts.length ? `<span class="search-results-label">Posts</span>${posts.map((post) => `<button class="search-result" data-action="open-post" data-post-id="${escapeHtml(post.id)}"><span class="search-result-type">${icon(typeIcon(post.type), 18)}</span><span><strong>${escapeHtml(post.title)}</strong><small>${escapeHtml(post.authorName || 'Member')}</small></span>${icon('open_in_new', 17)}</button>`).join('')}` : ''}</div>`;
}

function updateSearchResults() {
    const box = document.querySelector('.nav-search');
    if (!box) return;
    box.querySelector('.search-results')?.remove();
    const html = renderSearchResults();
    box.insertAdjacentHTML('beforeend', html);
    const input = box.querySelector('[data-search]');
    if (html) input?.setAttribute('aria-controls', 'community-search-results');
    else input?.removeAttribute('aria-controls');
}

function localSearchResults(query) {
    const lowered = query.toLowerCase();
    const users = [];
    const seen = new Set();
    state.posts.forEach((post) => {
        const user = post.author;
        if (!user?.username || seen.has(user.username) || !`${user.name} ${user.username}`.toLowerCase().includes(lowered)) return;
        seen.add(user.username);
        users.push({ ...user, name: user.name || post.authorName });
    });
    if (state.currentUser?.username && `${state.currentUser.name} ${state.currentUser.username}`.toLowerCase().includes(lowered) && !seen.has(state.currentUser.username)) {
        users.unshift({ ...state.currentUser });
    }
    const posts = state.posts.filter((post) => `${post.title} ${post.body} ${post.category} ${post.authorName}`.toLowerCase().includes(lowered)).slice(0, 6).map((post) => ({ id: post.id, title: post.title || post.body.slice(0, 75), type: post.type, authorName: post.authorName }));
    return { users: users.slice(0, 6), posts };
}

async function searchCommunity(query) {
    const requestId = ++state.searchRequestId;
    const term = query.trim();
    if (term.length < 2) {
        state.searchResults = { users: [], posts: [] };
        state.searchResultsLoading = false;
        updateSearchResults();
        return;
    }
    state.searchResultsLoading = true;
    updateSearchResults();
    try {
        state.searchResults = apiEnabled
            ? await apiRequest(`/api/search?q=${encodeURIComponent(term)}`)
            : localSearchResults(term);
    } catch {
        state.searchResults = { users: [], posts: [] };
    } finally {
        if (requestId === state.searchRequestId) {
            state.searchResultsLoading = false;
            updateSearchResults();
        }
    }
}

function scheduleSearch(query) {
    window.clearTimeout(state.searchTimer);
    state.searchTimer = window.setTimeout(() => void searchCommunity(query), 180);
}

function closeSearchDropdown() {
    document.querySelector('#community-search-results')?.remove();
    document.querySelector('[data-search]')?.removeAttribute('aria-controls');
}

/* ------------------------------------------------------------------ */
/* Header and hero                                                     */
/* ------------------------------------------------------------------ */

function renderHeader() {
    const searchResultsHTML = renderSearchResults();
    const userArea = state.currentUser
        ? `<div class="signed-in-actions"><button class="user-pill" data-action="open-my-profile" aria-label="Your profile">${avatar(state.currentUser.name, toneFor(state.currentUser.name), 'avatar-small', state.currentUser.avatarUrl)}<span class="user-pill-name">@${escapeHtml(state.currentUser.username || state.currentUser.name.split(' ')[0])}</span></button>${state.currentUser.isAdmin ? `<a class="admin-shortcut" href="/admin">${icon('admin_panel_settings', 18)}<span>Admin</span></a>` : ''}<button class="header-icon-link" data-action="logout" aria-label="Sign out">${icon('logout', 21)}</button></div>`
        : `<div class="signed-out-actions"><button class="text-button" data-action="open-auth" data-mode="login">Sign in</button><button class="btn btn-primary btn-small" data-action="open-auth" data-mode="register">Join free</button></div>`;

    const pages = [
        ['home', 'home', 'Home'],
        ['feed', 'forum', 'Feed'],
        ['polls', 'bar_chart', 'Polls'],
        ['launches', 'rocket_launch', 'Launches'],
        ['rankings', 'monitoring', 'Rankings'],
        ['community-chat', 'group', 'Chat'],
        ['messages', 'mail', 'Messages'],
    ];

    return `<header class="site-header">
        <div class="nav-shell">
            <a class="brand" href="/" aria-label="VibeDock home" data-action="go-page" data-page="home">${brandMark()}<span class="brand-word">vibe<span>dock</span></span></a>
            <nav class="desktop-nav" aria-label="Main navigation">${pages.map(([page, glyph, label]) => `<button class="nav-link ${state.page === page ? 'is-active' : ''}" data-action="go-page" data-page="${page}">${label}</button>`).join('')}</nav>
            <div class="nav-search ${state.mobileSearch ? 'is-open' : ''}" id="nav-search">
                ${icon('search', 20)}
                <input type="search" aria-label="Search community" placeholder="Search the dock…" value="${escapeHtml(state.search)}" data-search autocomplete="off" ${searchResultsHTML ? 'aria-controls="community-search-results"' : ''}>
                ${searchResultsHTML}
            </div>
            <div class="nav-actions"><button class="mobile-search-toggle icon-button" data-action="toggle-search" aria-label="${state.mobileSearch ? 'Close search' : 'Search community'}" aria-controls="nav-search" aria-expanded="${Boolean(state.mobileSearch)}">${icon(state.mobileSearch ? 'close' : 'search', 22)}</button>${userArea}<button class="mobile-menu-toggle icon-button" aria-label="Toggle navigation" aria-expanded="${state.mobileMenu}" data-action="toggle-menu">${icon(state.mobileMenu ? 'close' : 'menu', 22)}</button></div>
        </div>
        ${state.mobileMenu ? `<nav class="mobile-nav" aria-label="Mobile navigation">${pages.map(([page, glyph, label]) => `<button data-action="go-page" data-page="${page}">${icon(glyph, 21, '', state.page === page)} ${label}</button>`).join('')}${state.currentUser ? `<button data-action="open-my-profile">${icon('person', 21)} Profile</button><button data-action="go-page" data-page="messages">${icon('chat_bubble', 21)} Messages</button><button data-action="logout">${icon('logout', 21)} Sign out</button>` : `<button data-action="open-auth" data-mode="login">${icon('person', 21)} Sign in</button>`}</nav>` : ''}
    </header>`;
}

function illustration(name, className = '') {
    return `<img class="dock-illustration ${className}" src="/illustrations/${name}.svg" alt="" width="128" height="112" loading="lazy" decoding="async">`;
}

function renderHero() {
    return `<section class="hero" aria-labelledby="hero-title">
        <div class="hero-shell">
            <div class="hero-copy">

                <h1 id="hero-title">Big ideas.<br>Better <span>together.</span></h1>
                <p>Vibe-code something worth sharing.</p>
                <div class="hero-actions">
                    <button class="btn btn-primary" ${state.currentUser ? 'data-action="open-compose" data-type="launch"' : 'data-action="open-auth" data-mode="register"'}>${state.currentUser ? 'Share a build' : 'Join the community'} ${icon('arrow_forward', 19)}</button>
                    <button class="hero-secondary" data-action="go-page" data-page="launches">Explore builds ${icon('arrow_forward', 18)}</button>
                </div>
            </div>
            <div class="hero-visual">
                <img class="hero-image" src="/images/makers-together.webp" srcset="/images/makers-together-small.webp 440w, /images/makers-together.webp 880w" sizes="(max-width: 600px) 240px, (max-width: 860px) 320px, 440px" alt="Two makers sharing ideas and building together at a laptop" width="880" height="830" fetchpriority="high" decoding="async">
            </div>
        </div>
    </section>
    `;
}

function renderLanding() {
    return `<main class="landing-page">${renderHero()}
        <div class="landing-paths" aria-label="Your next step"><a href="/launches" data-action="go-page" data-page="launches">${icon('rocket_launch',20)} Ship your idea</a><span></span><a href="/polls" data-action="go-page" data-page="polls">${icon('bar_chart',20)} Ask the community</a><span></span><a href="/feed" data-action="go-page" data-page="feed">${icon('forum',20)} Build with people</a></div><section class="landing-intro"><span class="section-kicker">A little less solo. A lot more possibility.</span><h2>Make something.<br>Make it <span>together.</span></h2></section>
        <section class="feature-grid" aria-label="What you can do on VibeDock">
            <article class="feature-card feature-launch"><div class="feature-copy"><span class="feature-number">01 / LAUNCH</span><h3>Your side project. <br>Its first supporters.</h3><p>Launch your build. Find its first fans. Claim a home for your brand.</p><a class="feature-link" href="/launches" data-action="go-page" data-page="launches">Explore launches ${icon('arrow_forward', 18)}</a></div><div class="feature-art scene-image"><img src="/illustrations/launch-studio.svg" alt="An app taking shape in a maker’s launch studio" width="640" height="460" loading="lazy" decoding="async"></div></article>
            <article class="feature-card feature-people"><div class="feature-copy"><span class="feature-number">02 / CONNECT</span><h3>Good people. <br>Better conversations.</h3><p>Find a fresh perspective in chat or a private conversation.</p><a class="feature-link" href="/community-chat" data-action="go-page" data-page="community-chat">Meet the community ${icon('arrow_forward', 18)}</a></div><div class="feature-art character-scene"><img src="${avatarPath('fluent-astronaut', 'large')}" alt="3D astronaut avatar" width="140" height="140" loading="lazy"><img src="${avatarPath('fluent-owl', 'large')}" alt="3D owl avatar" width="120" height="120" loading="lazy"><img src="${avatarPath('fluent-cat-face', 'large')}" alt="3D cat avatar" width="100" height="100" loading="lazy">${illustration('conversation')}</div></article>
            <article class="feature-card feature-badges"><div class="feature-copy"><span class="feature-number">03 / BELONG</span><h3>A little activity.<br>A lot to show.</h3><p>Share, help, and launch. Earn badges along the way.</p><a class="feature-link" href="/badges" data-action="go-page" data-page="badges">Meet your milestones ${icon('arrow_forward',18)}</a></div><div class="feature-art badge-scene"><span class="display-badge">${icon('rocket_launch',48)}</span><span class="display-badge">${icon('favorite',36)}</span><span class="display-badge">${icon('auto_awesome',36)}</span><small>Made of small wins.</small></div></article>
            <article class="feature-card feature-feedback"><div class="feature-copy"><span class="feature-number">04 / LEARN</span><h3>Less guesswork. <br>More “aha”.</h3><p>Show your progress. Ask the tricky question. Run a poll and let real opinions shape your next move.</p><a class="feature-link" href="/feed" data-action="go-page" data-page="feed">Join the conversation ${icon('arrow_forward', 18)}</a></div><div class="feature-art scene-image"><img src="/illustrations/feedback-board.svg" alt="An illustrated community poll and conversation bubble" width="440" height="340" loading="lazy" decoding="async"></div></article>
        </section>
        <section class="landing-journey" aria-labelledby="journey-title"><div class="journey-heading"><span class="section-kicker">FROM “WHAT IF” TO “IT’S LIVE”</span><h2 id="journey-title">An idea is only<br>the beginning.</h2><a class="feature-link" href="/rankings" data-action="go-page" data-page="rankings">See what’s rising ${icon('arrow_forward',18)}</a></div><ol><li><span>01</span><div><h3>Find your starting point</h3><p>Ask a question or run a poll. Find out what works for other makers.</p></div></li><li><span>02</span><div><h3>Make it a conversation</h3><p>Share progress. Meet people who get what you’re making.</p></div></li><li><span>03</span><div><h3>Give your build a home</h3><p>Launch your project, claim your brand, and gather feedback.</p></div></li></ol></section>
        <section class="maker-strip"><div><span class="section-kicker">Different skills. Shared curiosity.</span><h2>There’s room for your kind of clever.</h2></div><div class="landing-skills">${['React','Python','UI design','AI agents','No-code','Mobile apps'].map(skill => `<span>${skillIcon(skill)}<small>${escapeHtml(skill)}</small></span>`).join('')}</div></section>
        <section class="landing-cta">${illustration('build')}<div><h2>Your next idea starts here.</h2><p>Bring your curiosity. We’ll bring the company.</p></div><button class="btn btn-primary" ${state.currentUser ? 'data-action="go-page" data-page="feed"' : 'data-action="open-auth" data-mode="register"'}>${state.currentUser ? 'Explore the feed' : 'Join for free'} ${icon('arrow_forward', 18)}</button></section>
    </main>`;
}

/* ------------------------------------------------------------------ */
/* Feed column                                                         */
/* ------------------------------------------------------------------ */

const popularTopics = ['AI models', 'Build in public', 'Promptcraft', 'Dev tools', 'Free tools'];

function renderLeftRail() {
    const menu = [
        ['all', 'explore', 'For you'],
        ['discussion', 'forum', 'Discussions'],
        ['question', 'chat_bubble', 'Questions'],
        ['launch', 'rocket_launch', 'Launches'],
        ['poll', 'bar_chart', 'Polls'],
        ['saved', 'bookmark', 'Saved'],
    ];
    return `<aside class="left-rail" aria-label="Community filters">
        ${state.currentUser ? `<button class="rail-user-card" data-action="open-my-profile">${avatar(state.currentUser.name, toneFor(state.currentUser.name), 'avatar-small', state.currentUser.avatarUrl)}<span><strong>${escapeHtml(state.currentUser.name)}</strong><small>@${escapeHtml(state.currentUser.username || 'member')}</small></span>${icon('open_in_new', 17)}</button>` : ''}
        <div class="rail-card rail-menu-card">
            <div class="rail-heading">Your community</div>
            <nav class="rail-menu">${menu.map(([filter, glyph, label]) => `<button class="rail-link ${state.filter === filter ? 'is-active' : ''}" data-action="filter" data-filter="${filter}"><span class="rail-icon">${icon(glyph, 20, '', state.filter === filter)}</span><span>${label}</span></button>`).join('')}</nav>
        </div>
        <div class="rail-card topics-card">
            <div class="rail-heading">Explore topics</div>
            <div class="topic-list">${popularTopics.map((topic) => `<button class="topic-link" data-action="tag" data-tag="${escapeHtml(topic)}"><span class="topic-hash">#</span><span>${escapeHtml(topic)}</span></button>`).join('')}</div>
        </div>
    </aside>`;
}

function renderComposer() {
    return `<div class="composer-card">
        <div class="composer-main">${avatar(state.currentUser?.name || 'You', state.currentUser ? toneFor(state.currentUser.name) : 'tone-neutral', 'avatar-composer', state.currentUser?.avatarUrl)}<button class="composer-prompt" data-action="open-compose" data-type="discussion">Share what you're making…</button><button class="composer-open icon-button" aria-label="Start a post" data-action="open-compose" data-type="discussion">${icon('add', 20)}</button></div>
        <div class="composer-divider"></div>
        <div class="composer-shortcuts">
            <button data-action="open-compose" data-type="discussion">${icon('forum', 19)}<span>Post</span></button>
            <button data-action="open-compose" data-type="question">${icon('chat_bubble', 19)}<span>Question</span></button>
            <button data-action="open-compose" data-type="poll">${icon('bar_chart', 19)}<span>Poll</span></button>
            <button data-action="open-compose" data-type="launch">${icon('rocket_launch', 19)}<span>Launch</span></button>
        </div>
    </div>`;
}

function renderTagButtons(post) {
    const tags = (post.tags?.length ? post.tags : (post.category ? [post.category] : [])).slice(0, 3);
    if (!tags.length) return '';
    return `<div class="post-tags">${tags.map((tag) => `<button class="post-tag" data-action="tag" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`).join('')}</div>`;
}

function renderLaunchPreview(post) {
    const safe = safeUrl(post.projectUrl);
    const logo = post.logoUrl ? safeImageUrl(post.logoUrl) : '';
    const domain = safe ? new URL(safe).hostname.replace(/^www\./, '') : 'Community project';
    const labels = { ai_tool: 'AI tool', ai_app: 'AI app', app: 'App', website: 'Website', other: 'Other' };
    const category = labels[post.launchCategory] || 'Launch';
    const upvotes = Number(post.upvotes || 0);
    const downvotes = Number(post.downvotes || 0);
    return `<div class="launch-preview-card">
        <div class="launch-brand-tile">${logo ? `<img src="${escapeHtml(logo)}" alt="" loading="lazy">` : icon('rocket_launch', 26)}</div>
        <div class="launch-preview-info"><span class="launch-overline">${escapeHtml(category)}</span><strong>${escapeHtml(domain)}</strong>${post.brand ? `<a class="brand-handle" href="/brands/${encodeURIComponent(post.brand.slug)}" ${!apiEnabled ? `data-action="open-post" data-post-id="${escapeHtml(post.id)}"` : ''}>@${escapeHtml(post.brand.slug)}</a>${post.brand.status === 'verified' ? `<span class="verified-business" title="Brand ownership reviewed by an administrator">${icon('verified',16)} Verified business</span>` : `<small class="brand-review-status">${post.brand.status === 'rejected' ? 'Not verified' : 'Verification pending'}</small>`}` : ''}</div>
        ${safe ? `<a class="launch-open" href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer" aria-label="Visit ${escapeHtml(post.title)}">${icon('open_in_new', 19)}</a>` : ''}
        <div class="launch-vote-controls" role="group" aria-label="Vote on ${escapeHtml(post.title)}">
            <button class="launch-vote-button ${post.launchVote === 1 ? 'is-selected' : ''}" data-action="launch-vote" data-post-id="${escapeHtml(post.id)}" data-vote="1" aria-label="Upvote" aria-pressed="${post.launchVote === 1}">${icon('arrow_upward', 18)}<span>${upvotes}</span></button>
            <button class="launch-vote-button ${post.launchVote === -1 ? 'is-selected' : ''}" data-action="launch-vote" data-post-id="${escapeHtml(post.id)}" data-vote="-1" aria-label="Downvote" aria-pressed="${post.launchVote === -1}">${icon('arrow_downward', 18)}<span>${downvotes}</span></button>
        </div>
    </div>`;
}

function renderPoll(post) {
    const options = post.options || [];
    const votes = options.map((_, index) => Number(post.votes?.[index] || 0));
    const total = votes.reduce((sum, value) => sum + value, 0);
    const hasVoted = post.votedOption !== null && post.votedOption !== undefined;
    return `<div class="poll-panel">
        <div class="poll-options">${options.map((option, index) => {
            const percent = total ? Math.round((votes[index] / total) * 100) : 0;
            return `<button class="poll-option ${hasVoted && Number(post.votedOption) === index ? 'is-selected' : ''} ${hasVoted ? 'show-results' : ''}" data-action="vote" data-post-id="${escapeHtml(post.id)}" data-option-index="${index}" ${hasVoted ? 'disabled' : ''} style="--poll-progress:${percent}%">
                <span class="poll-option-label">${escapeHtml(option)}</span>${hasVoted ? `<span class="poll-percent">${percent}%</span>` : `<span class="poll-radio"></span>`}
            </button>`;
        }).join('')}</div>
        <div class="poll-footnote">${total ? `${total} ${total === 1 ? 'vote' : 'votes'}` : 'No votes yet'}</div>
    </div>`;
}

function renderCommentPreview(post) {
    if (!post.latestComment) return '';
    return `<div class="latest-comment">${avatar(post.latestComment.authorName, toneFor(post.latestComment.authorName), 'avatar-mini')}<p><strong>${escapeHtml(post.latestComment.authorName)}</strong> ${escapeHtml(post.latestComment.body)}</p></div>`;
}

function renderCommentForm(post) {
    return `<form class="comment-form" data-form="comment" data-post-id="${escapeHtml(post.id)}">${avatar(state.currentUser?.name || 'You', toneFor(state.currentUser?.name || 'You'), 'avatar-mini', state.currentUser?.avatarUrl)}<label class="visually-hidden" for="comment-${escapeHtml(post.id)}">Write a reply</label><input id="comment-${escapeHtml(post.id)}" name="body" maxlength="2000" placeholder="Write a reply…" required><button type="submit" aria-label="Post reply">${icon('send', 17)}</button></form>`;
}

function reactionImage(key) {
    return `<img class="reaction-art" src="${REACTION_ASSETS[key]}" width="24" height="24" alt="" loading="lazy" decoding="async" aria-hidden="true">`;
}
function renderReactions(post) {
    const counts = post.reactions || {};
    return `<div class="post-reactions" role="group" aria-label="React to this post"><button class="post-action reaction-action love-reaction ${post.liked ? 'is-liked' : ''}" data-action="like" data-post-id="${escapeHtml(post.id)}" aria-pressed="${Boolean(post.liked)}" aria-label="Love" title="${post.liked ? 'Remove love' : 'Love this post'}">${reactionImage('love')}<span class="reaction-label">Love</span><span class="reaction-count">${Number(post.likes || 0) || ''}</span></button>${REACTIONS.map(({key,label}) => `<button class="post-action reaction-action ${post.myReaction === key ? 'is-selected' : ''}" data-action="react" data-reaction="${key}" data-post-id="${escapeHtml(post.id)}" aria-pressed="${post.myReaction === key}" aria-label="${label}" title="${post.myReaction === key ? 'Remove' : 'React with'} ${label.toLowerCase()}">${reactionImage(key)}<span class="reaction-label">${label}</span><span class="reaction-count">${Number(counts[key] || 0) || ''}</span></button>`).join('')}</div>`;
}

function renderPost(post) {
    const type = post.type || 'discussion';
    const contentPost = type === 'repost' && post.sourcePost ? post.sourcePost : post;
    const actionPost = contentPost;
    const contentType = contentPost.type || type;
    const authorName = post.authorName || 'Community member';
    const authorUsername = post.author?.username || '';
    const safeProfilePath = authorUsername ? `/u/${encodeURIComponent(authorUsername)}` : '#';
    const comments = Number(actionPost.commentsCount || 0);
    const imageUrl = contentPost.imageUrl ? safeImageUrl(contentPost.imageUrl) : '';
    const menuOpen = state.menuPostId === post.id;
    const canReport = state.currentUser && String(actionPost.author?.id) !== String(state.currentUser.id);
    const actionMenu = `<div class="post-more-wrap"><button class="post-more icon-button" aria-label="More options" aria-expanded="${menuOpen}" data-action="post-menu" data-post-id="${escapeHtml(post.id)}">${icon('more_horiz', 21)}</button>${menuOpen ? `<div class="post-menu" role="menu"><button role="menuitem" data-action="save-post" data-post-id="${escapeHtml(post.id)}">${icon('bookmark', 17, '', state.savedIds.includes(post.id))} ${state.savedIds.includes(post.id) ? 'Unsave' : 'Save'}</button><button role="menuitem" data-action="share" data-post-id="${escapeHtml(post.id)}">${icon('share', 17)} Copy link</button>${canReport ? `<button role="menuitem" data-action="report-post" data-post-id="${escapeHtml(actionPost.id)}">${icon('flag', 17)} Report</button>` : ''}</div>` : ''}</div>`;
    const authorLink = authorUsername
        ? `<a class="post-avatar-link" aria-label="View ${escapeHtml(authorName)}’s profile" href="${safeProfilePath}" data-action="open-profile" data-username="${escapeHtml(authorUsername)}">${avatar(authorName, post.tone || toneFor(authorName), 'avatar-post', post.author?.avatarUrl)}</a>`
        : avatar(authorName, post.tone || toneFor(authorName), 'avatar-post', post.author?.avatarUrl);
    const sourceAuthor = contentPost.author?.username
        ? `<a href="/u/${encodeURIComponent(contentPost.author.username)}" data-action="open-profile" data-username="${escapeHtml(contentPost.author.username)}">${escapeHtml(contentPost.authorName || contentPost.author?.name || 'Community member')}</a>`
        : `<strong>${escapeHtml(contentPost.authorName || 'Community member')}</strong>`;
    const originalContent = type === 'repost'
        ? `<div class="repost-source-label">Original by ${sourceAuthor}</div>`
        : '';

    return `<article class="post-card" data-post="${escapeHtml(post.id)}">
        ${type === 'repost' ? `<div class="repost-label">${icon('repeat', 16)} ${escapeHtml(authorName)} shared</div>` : ''}
        <div class="post-header">
            ${authorLink}
            <div class="post-author"><div class="author-line"><a class="author-name" href="${safeProfilePath}" data-action="${authorUsername ? 'open-profile' : 'noop'}" data-username="${escapeHtml(authorUsername)}">${escapeHtml(authorName)}</a>${actionPost.isFeatured ? `<span class="author-badge">${icon('workspace_premium', 13)} Pick</span>` : ''}</div><div class="author-meta">${escapeHtml(post.role || 'Member')} <span>·</span> ${escapeHtml(post.createdAt || 'just now')}</div></div>
            <span class="post-type type-${escapeHtml(type)}">${icon(typeIcon(type), 16)}<span class="post-type-label">${escapeHtml(prettyType(type))}</span></span>
            ${actionMenu}
        </div>
        <div class="post-content">
            ${type === 'repost' && post.body ? `<p class="repost-note">${escapeHtml(post.body)}</p>` : ''}
            ${originalContent}
            ${contentPost.title ? `<h3>${escapeHtml(contentPost.title)}</h3>` : ''}
            ${contentPost.body ? `<p>${escapeHtml(contentPost.body)}</p>` : ''}
            ${contentType === 'launch' ? renderLaunchPreview(contentPost) : ''}

            ${contentType === 'poll' ? renderPoll(actionPost) : ''}
            ${imageUrl ? `<img class="post-image" src="${escapeHtml(imageUrl)}" alt="Image shared by ${escapeHtml(contentPost.authorName || 'a member')}" loading="lazy">` : ''}
            ${renderTagButtons(contentPost)}
        </div>
        ${renderCommentPreview(actionPost)}
        <div class="post-footer">
            ${renderReactions(actionPost)}
            <div class="post-actions">
                <button class="post-action" data-action="comment-toggle" data-post-id="${escapeHtml(actionPost.id)}" aria-expanded="${state.commentingId === actionPost.id}" aria-label="Comment">${icon('comment', 20)}<span class="post-utility-label">Reply</span><span>${comments || ''}</span></button>
                <button class="post-action" data-action="repost" data-post-id="${escapeHtml(actionPost.id)}" aria-label="Repost" title="Repost">${icon('repeat', 20)}<span class="post-utility-label">Repost</span><span>${Number(actionPost.repostsCount || 0) || ''}</span></button>
                <button class="post-action share-action" data-action="share" data-post-id="${escapeHtml(post.id)}" aria-label="Share" title="Share">${icon('share', 19)}<span class="post-utility-label">Share</span></button>
            </div>
        </div>
        ${state.commentingId === actionPost.id ? renderCommentForm(actionPost) : ''}
    </article>`;
}

function filteredPosts() {
    let posts = state.posts.filter((post) => !post.isHidden);
    if (state.initialPostId) return posts.filter((post) => post.id === String(state.initialPostId));
    if (state.filter === 'saved') posts = posts.filter((post) => state.savedIds.includes(post.id));
    else if (state.filter !== 'all') posts = posts.filter((post) => post.type === state.filter);
    if (state.tag) posts = posts.filter((post) => (post.tags || []).some((tag) => tag.toLowerCase() === state.tag.toLowerCase()) || post.category?.toLowerCase() === state.tag.toLowerCase());
    const query = state.search.trim().toLowerCase();
    if (query) posts = posts.filter((post) => [post.title, post.body, post.authorName, post.author?.username, post.category, ...(post.tags || [])].filter(Boolean).join(' ').toLowerCase().includes(query));
    if (state.sort === 'popular') posts.sort((a, b) => Number(b.likes || 0) - Number(a.likes || 0));
    return posts;
}

function renderFeed() {
    const list = document.querySelector('.feed-list');
    const empty = document.querySelector('.feed-empty');
    const clearTag = document.querySelector('.active-tag-filter');
    if (!list) return;
    const posts = filteredPosts();
    const mobileFilter = document.querySelector('[data-feed-filter]');
    if (mobileFilter) mobileFilter.value = state.filter;
    reconcileCards(list, posts, renderPost);
    if (empty) empty.hidden = posts.length > 0 || state.feedLoading || !state.feedLoaded || state.postLoading.has(String(state.initialPostId)) || Boolean(state.feedError);
    if (clearTag) {
        clearTag.hidden = !state.tag;
        clearTag.innerHTML = state.tag ? `<span>#${escapeHtml(state.tag)}</span><button data-action="clear-filter" aria-label="Clear topic filter">${icon('close', 14)}</button>` : '';
    }
    document.querySelectorAll('[data-filter]').forEach((button) => {
        const selected = button.dataset.filter === state.filter;
        button.classList.toggle('is-active', selected);
        if (button.getAttribute('role') === 'tab') button.setAttribute('aria-selected', String(selected));
    });
}

function renderRightRail() {
    return `<aside class="right-rail" aria-label="Community links">
        <div class="rail-card spotlight-card">
            ${illustration('maker', 'spotlight-art')}
            <h3>Made something?</h3>
            <button class="btn btn-outline btn-small" data-action="open-compose" data-type="launch">Share your project ${icon('arrow_forward', 17)}</button>
        </div>
        <button class="rail-card toolkit-card" data-action="go-page" data-page="polls">
            ${illustration('toolkit')}<span>Community polls</span>${icon('arrow_forward', 18)}
        </button>
        <div class="community-note">${icon('group', 22)}<button data-action="go-page" data-page="guidelines">Community guidelines ${icon('arrow_forward', 14)}</button></div>
        <div class="right-footer"><button data-action="go-page" data-page="about">About</button><button data-action="go-page" data-page="privacy">Privacy</button><button data-action="go-page" data-page="terms">Terms</button><span>© ${new Date().getFullYear()} VibeDock</span></div>
    </aside>`;
}

function renderFeedSection() {
    const filters = [
        ['all', 'All'],
        ['discussion', 'Discussions'],
        ['question', 'Questions'],
        ['launch', 'Launches'],
        ['poll', 'Polls'],
        ['saved', 'Saved'],
    ];
    return `<main class="feed-column" id="community-feed">
        <div class="feed-toolbar">
            <label class="mobile-feed-filter"><span class="visually-hidden">Filter posts</span><select data-feed-filter>${filters.map(([filter, label]) => `<option value="${filter}" ${state.filter === filter ? 'selected' : ''}>${label === 'All' ? 'All posts' : label}</option>`).join('')}</select></label>
            <div class="feed-tabs" role="tablist" aria-label="Filter feed">${filters.map(([filter, label]) => `<button class="feed-tab ${state.filter === filter ? 'is-active' : ''}" role="tab" aria-selected="${state.filter === filter}" data-action="filter" data-filter="${filter}">${label}</button>`).join('')}</div>
            <label class="sort-control"><span class="visually-hidden">Sort posts</span><select data-sort aria-label="Sort posts"><option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Newest</option><option value="popular" ${state.sort === 'popular' ? 'selected' : ''}>Popular</option></select>${icon('expand_more', 16)}</label>
        </div>
        <div class="active-tag-filter" hidden></div>
        ${renderComposer()}
        <div class="feed-list"></div>
        <div class="feed-empty" hidden>${illustration('conversation')}<strong>Nothing here yet</strong><button class="btn btn-outline btn-small" data-action="clear-filter">Clear filters</button></div>
    </main>`;
}

function renderMain() {
    return `<section class="community-section" id="community">
        <div class="section-shell">
            <div class="community-heading"><div><span class="section-kicker">Your people. Your progress.</span><h1>Community feed</h1></div></div>${state.feedError ? `<div class="feed-status" role="status">${escapeHtml(state.feedError)} <button data-action="reload-feed">Try again</button></div>` : (state.feedLoading || !state.feedLoaded || state.postLoading.has(String(state.initialPostId))) ? '<p class="feed-status" role="status">Loading conversations…</p>' : ''}
            <div class="community-grid">${renderLeftRail()}${renderFeedSection()}${renderRightRail()}</div>
        </div>
    </section>`;
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

function renderProfilePage() {
    const data = state.profileData;
    if (state.profileLoading) return `<main class="route-main"><div class="route-loading">Loading…</div></main>`;
    if (!data?.user) return `<main class="route-main"><section class="route-empty">${icon('person', 30)}<h1>Profile not found</h1><button class="btn btn-primary" data-action="go-page" data-page="home">Back to feed</button></section></main>`;

    const user = data.user;
    const relation = data.relationship || {};
    const isSelf = Boolean(relation.isSelf);
    const safeWebsite = safeUrl(user.website || '');
    const profilePosts = (data.posts || []).map(normalizePost);
    let relationActions = '';
    if (isSelf) {
        relationActions = `<button class="btn btn-outline" data-action="edit-profile">${icon('edit', 18)} Edit profile</button><button class="btn btn-primary" data-action="view-friend-requests">Requests${state.friendRequests.length ? ` <span class="request-count">${state.friendRequests.length}</span>` : ''}</button>`;
    } else if (relation.isFriend) {
        relationActions = `<button class="btn btn-primary" data-action="start-message" data-user-id="${escapeHtml(user.id)}">${icon('chat_bubble', 18)} Message</button><button class="btn btn-outline" data-action="remove-friend" data-user-id="${escapeHtml(user.id)}">Friends</button>`;
    } else if (relation.friendRequestDirection === 'incoming') {
        relationActions = `<button class="btn btn-primary" data-action="respond-friend" data-request-id="${escapeHtml(relation.friendRequestId)}" data-response="accept">Accept</button><button class="btn btn-outline" data-action="respond-friend" data-request-id="${escapeHtml(relation.friendRequestId)}" data-response="decline">Decline</button>`;
    } else if (relation.friendRequestDirection === 'outgoing') {
        relationActions = `<button class="btn btn-outline" disabled>Request sent</button>`;
    } else if (state.currentUser) {
        relationActions = `<button class="btn btn-primary" data-action="send-friend-request" data-user-id="${escapeHtml(user.id)}">${icon('group', 18)} Add friend</button>`;
    } else {
        relationActions = `<button class="btn btn-primary" data-action="open-auth" data-mode="register">Join to connect</button>`;
    }
    if (!isSelf && state.currentUser) {
        const blocked = relation.messagingBlocked || blockedByMe(user.id);
        if (!relation.isFriend) relationActions = `<button class="btn btn-primary" data-action="start-message" data-user-id="${escapeHtml(user.id)}" ${blocked ? 'disabled' : ''}>${icon('mail', 18)} Message</button>` + relationActions;
        if (blocked) relationActions = `<button class="btn btn-outline" disabled>Messaging blocked</button>`;
        relationActions += `<button class="btn btn-outline" data-action="block-member" data-user-id="${escapeHtml(user.id)}">${icon('shield', 18)} ${blockedByMe(user.id) || relation.blockedByMe ? 'Unblock' : 'Block'}</button>`;
    }
    const followButton = !isSelf ? `<button class="btn btn-outline follow-button ${relation.isFollowing ? 'is-following' : ''}" data-action="toggle-follow" data-user-id="${escapeHtml(user.id)}">${relation.isFollowing ? 'Following' : 'Follow'}</button>` : '';
    const coverClass = `cover-${COVER_CHOICES.some((choice) => choice.key === user.coverChoice) ? user.coverChoice : 'aurora'}`;

    return `<main class="route-main profile-page">
        <section class="profile-card">
            <div class="profile-cover ${coverClass}"></div>
            <div class="profile-detail">
                <div class="profile-avatar-wrap">${avatar(user.name, toneFor(user.name), 'avatar-profile-hero', user.avatarUrl)}</div>
                <div class="profile-heading-row"><div><h1>${escapeHtml(user.name)}</h1><span class="profile-handle">@${escapeHtml(user.username)}</span></div><div class="profile-actions">${relationActions}${followButton}</div></div>
                ${renderMemberBadges(user, profilePosts)}
                ${user.bio ? `<p class="profile-bio">${escapeHtml(user.bio)}</p>` : ''}
                ${user.profession ? `<p class="profile-profession">${icon('person', 17)} ${escapeHtml(user.profession)}</p>` : ''}
                ${safeWebsite ? `<div class="profile-meta"><a href="${escapeHtml(safeWebsite)}" target="_blank" rel="noopener noreferrer">${icon('language', 17)} ${escapeHtml(new URL(safeWebsite).hostname.replace(/^www\./, ''))}</a></div>` : ''}
                ${Array.isArray(user.skills) && user.skills.length ? `<div class="profile-skills"><strong>Skills</strong><div>${user.skills.slice(0, 12).map((skill) => `<span class="profile-skill">${skillIcon(skill)}${escapeHtml(skill)}</span>`).join('')}</div></div>` : ''}
                <div class="profile-stats"><div><strong>${Number(user.postsCount || 0)}</strong><span>Posts</span></div><div><strong>${Number(user.followersCount || 0)}</strong><span>Followers</span></div><div><strong>${Number(user.followingCount || 0)}</strong><span>Following</span></div><div><strong>${Number(user.friendsCount || 0)}</strong><span>Friends</span></div></div>
            </div>
        </section>
        ${isSelf && state.friendRequests.length ? `<section class="friend-request-strip"><div><strong>Friend requests</strong></div>${state.friendRequests.slice(0, 4).map((request) => `<div class="friend-request-chip">${avatar(request.user.name, toneFor(request.user.name), 'avatar-small', request.user.avatarUrl)}<span>@${escapeHtml(request.user.username)}</span><button data-action="respond-friend" data-request-id="${escapeHtml(request.id)}" data-response="accept">Accept</button></div>`).join('')}</section>` : ''}
        <section class="profile-posts"><div class="route-section-heading"><h2>${isSelf ? 'Your posts' : `${escapeHtml(user.name)}'s posts`}</h2>${isSelf ? `<button class="btn btn-primary btn-small" data-action="open-compose" data-type="discussion">${icon('add', 17)} Post</button>` : ''}</div><div class="profile-post-list">${profilePosts.length ? profilePosts.map(renderPost).join('') : `<div class="route-empty compact"><strong>No posts yet</strong></div>`}</div></section>
    </main>`;
}

function renderLaunchPage() {
    const query = state.search.trim().toLowerCase();
    const launches = state.posts.filter((post) => post.type === 'launch' && !post.isHidden && (!query || `${post.title} ${post.body} ${post.authorName} ${post.category}`.toLowerCase().includes(query)));
    return `<main class="route-main launch-page">
        <section class="page-intro">${illustration('launch', 'page-art')}<div><span class="route-eyebrow">Showcase</span><h1>Launches</h1><p>Projects made by the community.</p></div><button class="btn btn-primary" data-action="open-compose" data-type="launch">${icon('add', 20)} Share a launch</button></section>
        ${state.feedError ? `<p class="feed-status" role="alert">${escapeHtml(state.feedError)} <button data-action="reload-feed">Try again</button></p>` : ''}<section class="launch-grid">${state.feedLoading || !state.feedLoaded ? '<p class="feed-status" role="status">Loading launches…</p>' : launches.length ? launches.map(renderPost).join('') : `<div class="route-empty compact">${icon('rocket_launch', 30)}<strong>${state.feedError ? 'Launches unavailable' : 'No launches yet'}</strong><button class="btn btn-outline btn-small" data-action="open-compose" data-type="launch">Share a launch</button></div>`}</section>
    </main>`;
}

function localRankings() {
    const tools = state.posts.filter((post) => post.type === 'launch' && !post.isHidden)
        .sort((a, b) => Number(b.upvotes || 0) - Number(b.downvotes || 0) - (Number(a.upvotes || 0) - Number(a.downvotes || 0)));
    const makers = new Map();
    state.posts.filter(post => !post.isHidden).forEach((post) => {
        const author = post.author || {};
        const key = String(author.id || author.username || post.authorName);
        const item = makers.get(key) || { id: key, username: author.username || '', name: author.name || post.authorName || 'Member', profession: author.profession || post.role || 'Maker', avatarUrl: author.avatarUrl || null, postsCount: 0, likesReceived: 0, commentsReceived: 0, score: 0 };
        item.postsCount += 1;
        item.likesReceived += Number(post.likes || 0);
        item.commentsReceived += Number(post.commentsCount || 0);
        item.score = item.postsCount + item.likesReceived * 2 + item.commentsReceived * 3;
        makers.set(key, item);
    });
    if (state.currentUser) {
        const key = String(state.currentUser.id || state.currentUser.username);
        if (!makers.has(key)) makers.set(key, { id: key, username: state.currentUser.username, name: state.currentUser.name, profession: state.currentUser.profession || 'Member', avatarUrl: state.currentUser.avatarUrl, postsCount: 0, likesReceived: 0, commentsReceived: 0, score: 0 });
    }
    return {
        tools,
        leaderboard: [...makers.values()].sort((a, b) => b.score - a.score).slice(0, 20).map((user, index) => ({ ...user, rank: index + 1 })),
    };
}

function renderRankedLaunch(post, index) {
    const logo = post.logoUrl ? safeImageUrl(post.logoUrl) : '';
    const url = safeUrl(post.projectUrl);
    return `<article class="ranking-launch-row"><span class="ranking-number">${index + 1}</span><div class="ranking-launch-logo">${logo ? `<img src="${escapeHtml(logo)}" alt="" loading="lazy">` : icon('rocket_launch', 22)}</div><div class="ranking-launch-copy"><strong>${escapeHtml(post.title)}</strong><span>by ${escapeHtml(post.authorName || 'Member')}</span></div>${url ? `<a class="ranking-launch-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" aria-label="Visit ${escapeHtml(post.title)}">${icon('open_in_new', 18)}</a>` : ''}<div class="ranking-vote-buttons"><button class="launch-vote-button ${post.launchVote === 1 ? 'is-selected' : ''}" data-action="launch-vote" data-post-id="${escapeHtml(post.id)}" data-vote="1" aria-label="Upvote" aria-pressed="${post.launchVote === 1}">${icon('arrow_upward', 18)}<span>${Number(post.upvotes || 0)}</span></button><button class="launch-vote-button ${post.launchVote === -1 ? 'is-selected' : ''}" data-action="launch-vote" data-post-id="${escapeHtml(post.id)}" data-vote="-1" aria-label="Downvote" aria-pressed="${post.launchVote === -1}">${icon('arrow_downward', 18)}<span>${Number(post.downvotes || 0)}</span></button></div></article>`;
}

function renderLeaderRow(user, index) {
    const profile = user.username ? `<button class="leader-profile-link" data-action="open-profile" data-username="${escapeHtml(user.username)}">${escapeHtml(user.name)}</button>` : `<strong>${escapeHtml(user.name)}</strong>`;
    return `<article class="leader-row"><span class="ranking-number">${Number(user.rank || index + 1)}</span>${avatar(user.name, toneFor(user.name), 'leader-avatar', user.avatarUrl)}<div class="leader-copy">${profile}<span>${escapeHtml(user.profession || 'Member')}</span></div><div class="leader-score"><strong>${Number(user.score || 0)}</strong><span>pts</span></div></article>`;
}

function renderRankingsPage() {
    const rankingData = state.rankings || (apiEnabled ? {tools: [], leaderboard: []} : localRankings());
    const tools = (rankingData.tools || []).map(normalizePost).sort((a,b) => (b.upvotes-b.downvotes)-(a.upvotes-a.downvotes));
    const makers = rankingData.leaderboard || [];
    return `<main class="route-main rankings-page"><section class="page-intro">${illustration('launch', 'page-art')}<div><span class="route-eyebrow">Rankings</span><h1>What makers are building</h1><p>Discover the builds and people moving the community forward.</p></div></section>${state.rankingsError ? `<div class="feed-status" role="alert">${escapeHtml(state.rankingsError)} <button data-action="reload-rankings">Try again</button></div>` : ''}${state.rankingsLoading || !state.rankingsLoaded ? '<p class="feed-status" role="status">Loading rankings…</p>' : ''}<div class="rankings-grid" ${state.rankingsLoading ? 'aria-busy="true"' : ''}><section class="ranking-panel"><header><span class="ranking-panel-icon">${icon('rocket_launch', 22)}</span><div><h2>Apps & websites</h2><p>All-time upvotes minus downvotes</p></div></header><div class="ranking-list">${tools.length ? tools.map(renderRankedLaunch).join('') : `<div class="route-empty compact"><strong>${state.rankingsLoading || !state.rankingsLoaded ? 'Fetching launches…' : state.rankingsError ? 'Rankings unavailable' : 'No launches yet'}</strong></div>`}</div></section><section class="ranking-panel"><header><span class="ranking-panel-icon">${icon('group', 22)}</span><div><h2>Engagement leaders</h2><p>${apiEnabled ? 'Last 30 days' : 'Demo activity · this browser'}</p></div></header><div class="ranking-list">${makers.length ? makers.map(renderLeaderRow).join('') : `<div class="route-empty compact"><strong>${state.rankingsLoading || !state.rankingsLoaded ? 'Fetching makers…' : state.rankingsError ? 'Rankings unavailable' : 'No makers ranked yet'}</strong></div>`}</div></section></div><details class="ranking-method"><summary>How the rankings work</summary><p>Launches are ranked by upvotes minus downvotes. Each member has one vote per launch: click again to remove it, or switch direction.</p><p>Engagement score = posts + (likes received × 2) + (comments received × 3) + comments written. Production uses the last 30 days and excludes hidden posts and inactive accounts. Demo scores reflect sample activity, not live community data.</p></details></main>`;
}

const infoContent = {
    about: { eyebrow: 'About', title: 'A place to make things', intro: 'VibeDock brings builders together to share ideas, learn in public, and launch projects.', sections: [['What you can do', 'Post a work in progress, ask a question, run a poll, launch an app or website, and meet other makers.'], ['Who it is for', 'Vibe coders, developers, and designers building with AI, code, and curiosity.']] },
    guidelines: { eyebrow: 'Guidelines', title: 'Build kindly', intro: 'Keep this a useful, welcoming place.', sections: [['Be generous', 'Offer clear feedback and credit the people and tools that helped.'], ['Be respectful', 'Critique the work, not the person. Harassment is not welcome.'], ['Be honest', 'Share real projects and disclose paid promotion or affiliate links.'], ['Keep it safe', 'No private information, harmful instructions, or content you do not have the right to share.'], ['Message safety', 'A baseline automatic filter rejects some explicit hate and threats before sending. It cannot understand every language or context. Use a message’s options to report abuse or block its sender. Blocking stops private messaging in both directions and hides that member’s community messages from you. Reports are reviewed by administrators; reports alone do not automatically ban accounts.']] },
    privacy: { eyebrow: 'Privacy', title: 'Your information', intro: 'This community stores the information needed to run accounts and community features.', sections: [['What is stored', 'Account details, profile information, posts, uploaded images, votes, reports, direct messages, and community chat messages. Passwords are stored as hashes.'], ['How it is used', 'To display profiles and community content, deliver messages, prevent abuse, and operate moderation tools. Private messages are stored on the server, not end-to-end encrypted. When reported, only the reported message and your report details are shown in the moderator review queue.'], ['Your choices', 'You can edit your profile. Contact the site administrator for account removal or privacy questions.'], ['Retention', 'The site operator sets and publishes retention periods before launch.']] },
    terms: { eyebrow: 'Terms', title: 'Using VibeDock', intro: 'Use the community lawfully and treat members with care.', sections: [['Your content', 'You keep ownership of your work and give the service permission to host and display it as needed to run the community.'], ['Your account', 'Keep your sign in details private and use accurate contact information.'], ['Moderation', 'Administrators may hide content, review reports, or disable accounts to protect the community.']] },
};

const BADGES = [
    {key:'first-step', label:'First step', glyph:'auto_awesome', description:'Publish your first post, question, poll, or launch.'},
    {key:'regular', label:'Dock regular', glyph:'anchor', description:'Share 10 visible posts, questions, polls, or launches.'},
    {key:'maker', label:'Launched it', glyph:'rocket_launch', description:'Publish your first project launch.'},
    {key:'curious', label:'Curious mind', glyph:'bar_chart', description:'Start 3 community polls.'},
    {key:'contributor', label:'Conversation starter', glyph:'forum', description:'Leave 10 comments on visible community posts.'},
    {key:'community-star', label:'Community star', glyph:'star', description:'Awarded by an admin for a positive community impact.', source:'admin'},
    {key:'expert', label:'Expert', glyph:'school', description:'Awarded by an admin for sharing valuable expertise.', source:'admin'},
    {key:'early-supporter', label:'Early supporter', glyph:'favorite', description:'Awarded by an admin to recognize early supporters.', source:'admin'},
];
function previewBadges(user) {
    const posts = state.posts.filter(post => !post.isHidden && String(post.author?.id) === String(user.id) && ['discussion','question','poll','launch'].includes(post.type));
    const keys = [];
    if (posts.length) keys.push('first-step');
    if (posts.length >= 10) keys.push('regular');
    if (posts.some(post => post.type === 'launch')) keys.push('maker');
    if (posts.filter(post => post.type === 'poll').length >= 3) keys.push('curious');
    const comments = state.posts.filter(post => !post.isHidden).flatMap(post => post.comments || []).filter(comment => String(comment.author?.id) === String(user.id));
    if (comments.length >= 10) keys.push('contributor');
    keys.push(...(readStorage('vibedock-preview-badges', {})[user.id] || []));
    return BADGES.filter(badge => keys.includes(badge.key));
}
function renderMemberBadges(user) {
    const badges = apiEnabled ? user.badges || [] : previewBadges(user);
    return `<div class="member-badges" aria-label="Member badges">${badges.map(badge => `<a href="/badges" data-action="go-page" data-page="badges" class="member-badge ${badge.source === 'admin' ? 'admin-awarded' : ''}" title="${badge.source === 'admin' ? 'Awarded by an administrator' : 'Earned through community activity'}">${icon(BADGES.find(item => item.key === badge.key)?.glyph || 'star',16)}${escapeHtml(badge.label)}</a>`).join('')}${!badges.length ? '<a class="badge-empty" href="/badges" data-action="go-page" data-page="badges">Your next contribution could earn a badge →</a>' : ''}</div>`;
}
function renderPollsPage() {
    const polls = state.posts.filter(post => post.type === 'poll' && !post.isHidden);
    return `<main class="route-main polls-page"><section class="page-intro">${illustration('conversation','page-art')}<div><span class="route-eyebrow">LET THE COMMUNITY WEIGH IN</span><h1>Real people. Real opinions.</h1><p>Compare tools, test an idea, or decide what to build next.</p></div><button class="btn btn-primary" data-action="open-compose" data-type="poll">${icon('add',20)} Create a poll</button></section>${state.feedError ? `<p class="feed-status" role="alert">${escapeHtml(state.feedError)} <button data-action="reload-feed">Try again</button></p>` : ''}<section class="polls-list">${!state.feedLoaded || state.feedLoading ? '<p role="status">Loading polls…</p>' : polls.length ? polls.map(renderPost).join('') : '<div class="route-empty"><h2>Be the first to ask</h2><p>Make your next decision together.</p><button class="btn btn-outline" data-action="open-compose" data-type="poll">Start a poll</button></div>'}</section></main>`;
}
function renderGuidePage() {
    if (state.page === 'badges') return `<main class="route-main guide-page"><header class="create-heading"><span class="section-kicker">SMALL STEPS. WELL EARNED.</span><h1>Your activity tells a story.</h1><p>Badges recognize what you bring to the dock.</p></header><div class="badge-guide-grid">${BADGES.map(badge => `<article class="badge-guide-card"><span class="badge-medallion ${badge.source === 'admin' ? 'admin-awarded' : ''}">${icon(badge.glyph,30)}</span><small>${badge.source === 'admin' ? 'ADMIN AWARDED' : 'ACTIVITY MILESTONE'}</small><h2>${badge.label}</h2><p>${badge.description}</p></article>`).join('')}</div><section class="guide-note"><h2>Earned, not bought.</h2><p>Activity badges reflect your current visible contributions. Removed or hidden content doesn’t count. Admin awards can be granted or revoked by the site team.</p><p>A business verification tick is separate: it indicates an admin has reviewed brand ownership, not that a project is endorsed.</p><a class="feature-link" href="/create/post" data-action="open-compose" data-type="discussion">Share something ${icon('arrow_forward',18)}</a></section></main>`;
    return `<main class="route-main guide-page"><header class="create-heading"><span class="section-kicker">A QUICK LOOK AROUND</span><h1>Find your place on the dock.</h1><p>Make something. Share it. Keep going together.</p></header><div class="help-feature-grid">${[
        ['post','forum','Share a post','Progress, discoveries, and the messy middle.'],
        ['question','chat_bubble','Ask a question','Get a fresh perspective from fellow makers.'],
        ['poll','bar_chart','Run a poll','Compare AI models or get feedback on your next idea.'],
        ['launch','rocket_launch','Launch a project','A dedicated home for your build and your brand.'],
    ].map(([type,glyph,title,body]) => `<a class="help-feature" href="/create/${type}" data-action="open-compose" data-type="${type === 'post' ? 'discussion' : type}">${icon(glyph,28)}<h2>${title}</h2><p>${body}</p><span>Get started →</span></a>`).join('')}</div><section class="guide-faq"><h2>A few useful answers</h2><details open><summary>How do brand claims and green ticks work?</summary><p>Add a unique brand handle when you launch and confirm you’re authorized to represent it. Your handle is reserved when the launch is published. An administrator reviews ownership before granting the green “Verified business” tick. Claims aren’t trademark registration, and verification isn’t an endorsement. An admin can revoke verification.</p></details><details><summary>How can I earn a badge?</summary><p>Share posts, launch projects, start polls, or join conversations. Activity badges appear on your profile automatically; admins can also award special recognition.</p><a class="feature-link" href="/badges" data-action="go-page" data-page="badges">View all badges →</a></details><details><summary>Can I sign in with Google or Facebook?</summary><p>Yes, on the live site once social sign-in is configured. Use “Continue with Google” or “Continue with Facebook” on either sign-in or registration. Email sign-in is always available. The standalone demo cannot connect to these providers.</p></details><details><summary>Where can I change my avatar?</summary><p>Open your profile, choose Edit profile, and select a 3D character or upload your own photo. Our character library uses Microsoft Fluent Emoji artwork under the MIT license.</p></details><details><summary>How do I report an issue or unsafe content?</summary><p>Use the post’s More options menu or the message’s options to report content to the site team. You can also block members. Never share account credentials or private API keys in posts.</p><a class="feature-link" href="/guidelines" data-action="go-page" data-page="guidelines">Read the guidelines →</a></details></section></main>`;
}
function renderRecognitionAdmin() {
    const members = new Map(state.posts.filter(post=>post.author?.id).map(post=>[String(post.author.id),post.author]));
    if (state.currentUser) members.set(String(state.currentUser.id), state.currentUser);
    return `<section class="admin-preview-section"><h2>Member badges</h2><p>Demo controls only. Production awards are protected by administrator permissions.</p><form class="recognition-form" data-form="demo-badge"><label class="field-label">Member<select name="user">${[...members.values()].map(user=>`<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)}</option>`).join('')}</select></label><label class="field-label">Badge<select name="badge">${BADGES.filter(b=>b.source==='admin').map(b=>`<option value="${b.key}">${b.label}</option>`).join('')}</select></label><label class="field-label">Action<select name="action"><option value="award">Award</option><option value="revoke">Revoke</option></select></label><button class="btn btn-primary" type="submit">Update badge</button></form></section><section class="admin-preview-section"><h2>Brand verification</h2><p>Confirm ownership independently before granting a green tick. Never verify a claim based on the name alone.</p>${state.posts.filter(post=>post.brand).map(post=>`<article class="admin-preview-row"><div><strong>@${escapeHtml(post.brand.slug)}</strong><span>${escapeHtml(post.title)} · ${escapeHtml(post.brand.status)}</span></div><button class="btn btn-outline btn-small" data-action="demo-verify-brand" data-post-id="${escapeHtml(post.id)}">${post.brand.status==='verified'?'Revoke tick':'Verify ownership'}</button></article>`).join('') || '<p>No brand claims yet.</p>'}</section>`;
}

function renderInfoPage() {
    const content = infoContent[state.page] || infoContent.about;
    return `<main class="route-main info-page"><header class="info-page-heading">${illustration('conversation')}<span class="route-eyebrow">${content.eyebrow}</span><h1>${content.title}</h1><p>${content.intro}</p></header><div class="info-page-sections">${content.sections.map(([title, body]) => `<section><h2>${title}</h2><p>${body}</p></section>`).join('')}</div><nav class="info-page-links" aria-label="More information"><button data-action="go-page" data-page="about">About</button><button data-action="go-page" data-page="guidelines">Guidelines</button><button data-action="go-page" data-page="privacy">Privacy</button><button data-action="go-page" data-page="terms">Terms</button></nav></main>`;
}

function renderAdminPage() {
    if (!state.currentUser) return `<main class="route-main"><section class="route-empty">${icon('lock', 30)}<h1>Admin access</h1><button class="btn btn-primary" data-action="open-auth" data-mode="login">Sign in</button></section></main>`;
    if (!state.currentUser.isAdmin) return `<main class="route-main"><section class="route-empty">${icon('lock', 30)}<h1>Admins only</h1><button class="btn btn-outline" data-action="go-page" data-page="home">Back to feed</button></section></main>`;
    return `<main class="route-main admin-preview-page"><header class="admin-preview-heading"><div><span class="route-eyebrow">Preview</span><h1>Admin panel</h1></div><a class="btn btn-outline btn-small" href="/admin">Open full panel</a></header><div class="admin-preview-stats"><div><strong>${state.posts.length}</strong><span>Posts</span></div><div><strong>${state.posts.filter((post) => post.type === 'launch').length}</strong><span>Launches</span></div></div>${renderRecognitionAdmin()}<section class="admin-preview-section"><h2>Recent posts</h2>${state.posts.slice(0, 10).map((post) => `<article class="admin-preview-row"><div><strong>${escapeHtml(post.title || post.body.slice(0, 70))}</strong><span>${escapeHtml(post.authorName || 'Member')} · ${escapeHtml(prettyType(post.type))}</span></div><button class="btn btn-outline btn-small" data-action="admin-hide-post" data-post-id="${escapeHtml(post.id)}">${post.isHidden ? 'Restore' : 'Hide'}</button></article>`).join('')}</section></main>`;
}

function renderMobileNav() {
    if (state.page === 'admin') return '';
    const items = [['home', 'home', 'Home'], ['feed', 'forum', 'Feed'], ['messages', 'mail', 'Inbox'], ['community-chat', 'group', 'Chat'], ['profile', 'person', 'Profile']];
    return `<nav class="mobile-bottom-nav" aria-label="Quick navigation">${items.map(([page, glyph, label]) => `<button class="${state.page === page ? 'is-active' : ''}" data-action="go-page" data-page="${page}" aria-label="${label}" aria-current="${state.page === page ? 'page' : 'false'}">${icon(glyph, 23, '', state.page === page)}<span>${label}</span></button>`).join('')}</nav>`;
}

// Messaging safety is enforced by Laravel; local storage only simulates the demo.
function previewKey(name) { return `vibedock-${state.currentUser?.id || 'guest'}-${name}`; }
function blockedByMe(id) { return state.blockedUsers.some(user => String(user.id) === String(id)); }
function findMember(id) {
    return [state.messagePeer, state.profileData?.user, ...state.memberResults, ...state.blockedUsers,
        ...state.conversations.map(item => item.user), ...state.posts.map(post => post.author),
        ...state.groupMessages.map(message => message.user)].find(user => user && String(user.id) === String(id));
}
function demoThreads() { return readStorage(previewKey('threads'), {}); }
function saveDemoThread() {
    const threads = demoThreads();
    threads[state.selectedMessageUser] = { user: state.messagePeer, messages: state.messages };
    writeStorage(previewKey('threads'), threads);
    state.conversations = Object.values(threads).map(thread => ({ user: thread.user, latestMessage: thread.messages.at(-1), unreadCount: 0 }));
}
async function loadSafety() {
    const id = state.currentUser?.id;
    if (!id || state.safetyLoadedFor === id) return;
    state.safetyLoadedFor = id;
    try {
        const users = apiEnabled ? (await apiRequest('/api/blocks')).data : readStorage(previewKey('blocks'), []);
        if (state.currentUser?.id !== id) return;
        state.blockedUsers = users || [];
        state.reportedMessages = apiEnabled ? [] : readStorage(previewKey('reports'), []).map(report => `${report.type}:${report.id}`);
        if (state.currentUser?.id === id) renderApp();
    } catch { showToast('Could not load blocked members. Try refreshing.'); }
}
function messageActions(message, type) {
    if (message.sentByMe) return '';
    const user = type === 'community' ? message.user : message.sender || state.messagePeer;
    const key = `${type}:${message.id}`;
    return `<details class="message-actions"><summary class="icon-button" aria-label="Message options" title="Message options">${icon('more_horiz', 20)}</summary><div class="message-action-menu"><button data-action="report-message" data-message-type="${type}" data-message-id="${escapeHtml(message.id)}" ${state.reportedMessages.includes(key) ? 'disabled' : ''}>${icon('flag', 18)} ${state.reportedMessages.includes(key) ? 'Reported' : 'Report message'}</button>${user ? `<button data-action="block-member" data-user-id="${escapeHtml(user.id)}">${icon('shield', 18)} ${blockedByMe(user.id) ? 'Unblock' : 'Block'} member</button>` : ''}</div></details>`;
}
function renderGroupMessages() {
    const messages = state.groupMessages.filter(message => !blockedByMe(message.user?.id)).map(message => ({...message, sentByMe: String(message.user?.id) === String(state.currentUser?.id)}));
    return messages.length ? messages.map(message => `<article class="community-chat-message ${message.sentByMe ? 'mine' : ''}">${avatar(message.user?.name || 'Member', toneFor(message.user?.name || ''), 'chat-avatar', message.user?.avatarUrl)}<div class="community-chat-message-body"><div class="chat-message-meta">${message.user?.username ? `<button class="chat-author" data-action="open-profile" data-username="${escapeHtml(message.user.username)}">${escapeHtml(message.user.name)}</button>` : `<strong>${escapeHtml(message.user?.name || 'Member')}</strong>`}<span>${escapeHtml(message.createdAt || 'just now')}</span></div><p>${escapeHtml(message.body)}</p></div>${messageActions(message, 'community')}</article>`).join('') : `<div class="chat-empty">${illustration('conversation')}<strong>Start the conversation</strong><span>Share a build. Ask a question.</span></div>`;
}
function renderCommunityChatPage() {
    if (!state.currentUser) return `<main class="route-main"><section class="route-empty">${illustration('conversation')}<h1>Community chat</h1><button class="btn btn-primary" data-action="open-auth" data-mode="login">Sign in</button></section></main>`;
    return `<main class="route-main community-chat-page"><section class="community-chat-shell" aria-label="Community conversation">
        <header class="community-chat-heading"><div class="chat-title">${illustration('conversation')}<div><h1>Community chat</h1><span class="chat-member-count">Build together. Talk here.</span></div></div><div class="chat-header-actions"><button class="btn btn-outline btn-small" data-action="go-page" data-page="messages" aria-label="Private messages">${icon('mail', 18)}<span>Messages</span></button><button class="icon-button" data-action="blocked-members" aria-label="Blocked members" title="Blocked members">${icon('shield', 22)}</button></div></header>
        <div class="chat-safety-note">${icon('shield', 16)}<span>Be kind. Report anything unsafe.</span><button data-action="go-page" data-page="guidelines">Guidelines</button></div>
        <div class="community-chat-transcript" id="community-chat-transcript" role="log" aria-live="polite" aria-label="Community messages">${renderGroupMessages()}</div>
        <div class="chat-error" role="alert" ${state.chatError ? '' : 'hidden'}>${escapeHtml(state.chatError)}</div>
        <form class="community-chat-compose" data-form="community-chat"><label class="visually-hidden" for="community-chat-message">Write a message</label><textarea id="community-chat-message" name="body" rows="1" maxlength="500" placeholder="Message the community…" required>${escapeHtml(state.chatDraft)}</textarea><span class="chat-character-count" data-chat-count>${state.chatDraft.length}/500</span><button class="btn btn-primary" type="submit" aria-label="Send message">${icon('send', 21)}</button></form>
    </section></main>`;
}
function renderDirectMessages() {
    return state.messages.map(message => `<article class="direct-message-row ${message.sentByMe ? 'mine' : ''}"><div class="thread-message ${message.sentByMe ? 'mine' : ''}"><p>${escapeHtml(message.body)}</p><span>${escapeHtml(message.createdAt || 'just now')}</span></div>${messageActions(message, 'direct')}</article>`).join('');
}
function renderMessagesPage() {
    if (!state.currentUser) return `<main class="route-main"><section class="route-empty"><h1>Private messages</h1><button class="btn btn-primary" data-action="open-auth" data-mode="login">Sign in</button></section></main>`;
    const activeUser = state.messagePeer;
    const conversations = state.conversations;
    const draft = state.messageDrafts[state.selectedMessageUser] || '';
    const cannotSend = state.messagingBlocked || blockedByMe(activeUser?.id) || state.messagesLoading || Boolean(state.threadError);
    const requests = state.friendRequests.length ? `<details class="inbox-requests"><summary>Friend requests (${state.friendRequests.length})</summary>${state.friendRequests.map(request => `<div class="message-request-row"><strong>${escapeHtml(request.user.name)}</strong><button class="btn btn-small btn-primary" data-action="respond-friend" data-request-id="${escapeHtml(request.id)}" data-response="accept">Accept</button><button class="icon-button" aria-label="Decline request" data-action="respond-friend" data-request-id="${escapeHtml(request.id)}" data-response="decline">${icon('close', 18)}</button></div>`).join('')}</details>` : '';
    return `<main class="route-main messages-page"><header class="messages-heading"><div class="chat-title">${illustration('conversation')}<h1>Private messages</h1></div><div class="chat-header-actions"><button class="icon-button" data-action="blocked-members" aria-label="Blocked members" title="Blocked members">${icon('shield', 22)}</button><button class="btn btn-primary btn-small" data-action="new-message">${icon('add', 18)} New message</button></div></header>${requests}
        <section class="messages-layout ${activeUser ? 'has-thread' : ''}"><aside class="conversation-list" aria-label="Conversations"><div class="conversation-list-heading"><strong>Inbox</strong><span>${conversations.length}</span></div>${conversations.length ? conversations.map(item => `<button class="conversation-item ${String(item.user.id) === String(state.selectedMessageUser) ? 'is-active' : ''}" data-action="open-message-thread" data-user-id="${escapeHtml(item.user.id)}">${avatar(item.user.name, toneFor(item.user.name), 'avatar-message', item.user.avatarUrl)}<span class="conversation-copy"><strong>${escapeHtml(item.user.name)}</strong><small>${escapeHtml(item.latestMessage?.body || `@${item.user.username}`)}</small></span>${item.unreadCount ? `<span class="unread-badge">${Number(item.unreadCount)}</span>` : ''}</button>`).join('') : `<div class="chat-empty">${illustration('maker')}<strong>No conversations yet</strong><button class="btn btn-outline btn-small" data-action="new-message">Find a member</button></div>`}</aside>
        ${activeUser ? `<section class="message-thread"><header class="thread-header"><button class="icon-button inbox-back" data-action="inbox-back" aria-label="Back to inbox">${icon('arrow_forward', 20)}</button>${avatar(activeUser.name, toneFor(activeUser.name), 'avatar-small', activeUser.avatarUrl)}<div><strong>${escapeHtml(activeUser.name)}</strong><button class="chat-author" data-action="open-profile" data-username="${escapeHtml(activeUser.username)}">@${escapeHtml(activeUser.username)}</button></div><button class="icon-button thread-block" data-action="block-member" data-user-id="${escapeHtml(activeUser.id)}" aria-label="${blockedByMe(activeUser.id) ? 'Unblock' : 'Block'} member" title="${blockedByMe(activeUser.id) ? 'Unblock' : 'Block'} member">${icon('shield', 20)}</button></header>
        <div class="thread-messages" id="thread-messages" role="log" aria-live="polite" aria-label="Private conversation">${state.messagesLoading ? '<div class="route-loading">Loading…</div>' : state.threadError ? `<div class="chat-empty"><span>${escapeHtml(state.threadError)}</span><button class="btn btn-outline btn-small" data-action="open-message-thread" data-user-id="${escapeHtml(activeUser.id)}">Retry</button></div>` : state.messages.length ? renderDirectMessages() : `<div class="chat-empty">${illustration('conversation')}<strong>Say hello to ${escapeHtml(activeUser.name.split(' ')[0])}</strong></div>`}</div>
        <div class="chat-error" role="alert" ${state.messageError ? '' : 'hidden'}>${escapeHtml(state.messageError)}</div>
        ${state.messagingBlocked || blockedByMe(activeUser.id) ? '<div class="chat-safety-note">Messaging is blocked between these accounts.</div>' : ''}
        <form class="thread-compose" data-form="message" data-user-id="${escapeHtml(activeUser.id)}"><label class="visually-hidden" for="message-body">Write a private message</label><textarea id="message-body" name="body" rows="1" maxlength="2000" placeholder="Write a private message…" ${cannotSend ? 'disabled' : ''} required>${escapeHtml(draft)}</textarea><button class="btn btn-primary" type="submit" aria-label="Send private message" ${cannotSend ? 'disabled' : ''}>${icon('send', 21)}</button></form></section>` : `<section class="message-thread message-thread-empty"><div class="chat-empty">${illustration('conversation')}<strong>Your next conversation starts here.</strong><button class="btn btn-primary" data-action="new-message">New message</button></div></section>`}</section></main>`;
}
function renderMemberResults() {
    const members = state.memberResults.filter(user => String(user.id) !== String(state.currentUser?.id) && !blockedByMe(user.id));
    return members.length ? members.map(user => `<button class="member-result" data-action="open-message-thread" data-user-id="${escapeHtml(user.id)}">${avatar(user.name, toneFor(user.name), 'avatar-post', user.avatarUrl)}<span><strong>${escapeHtml(user.name)}</strong><small>@${escapeHtml(user.username)}</small></span>${icon('mail', 20)}</button>`).join('') : '<p class="member-search-hint">Search a name or username (at least 2 characters).</p>';
}
function renderMessagingModal() {
    let contents = '';
    if (state.modal === 'new-message') contents = `<h2 id="message-modal-title">New message</h2><label class="field-label">Find a member<input type="search" data-member-search placeholder="Name or username" maxlength="80" autocomplete="off"></label><div class="member-results" aria-live="polite">${renderMemberResults()}</div>`;
    if (state.modal === 'blocked-members') contents = `<h2 id="message-modal-title">Blocked members</h2><div class="member-results">${state.blockedUsers.length ? state.blockedUsers.map(user => `<div class="member-result">${avatar(user.name, toneFor(user.name), 'avatar-post', user.avatarUrl)}<span><strong>${escapeHtml(user.name)}</strong></span><button class="btn btn-outline btn-small" data-action="unblock-member" data-user-id="${escapeHtml(user.id)}">Unblock</button></div>`).join('') : '<p>No blocked members.</p>'}</div>`;
    if (state.modal === 'block-member') contents = `<h2 id="message-modal-title">Block ${escapeHtml(state.safetyUser?.name || 'member')}?</h2><p>This stops private messages in both directions and hides their community messages from you.</p><button class="btn btn-primary" data-action="confirm-block" data-user-id="${escapeHtml(state.safetyUser?.id)}">Block member</button>`;
    if (state.modal === 'message-report') contents = `<h2 id="message-modal-title">Report message</h2><p>Only this message is shared with moderators.</p><form class="modal-form" data-form="message-report"><label class="field-label">Reason<select name="reason" required><option value="">Choose a reason</option><option value="hate">Hate speech</option><option value="harassment">Harassment or abuse</option><option value="threat">Threats or violence</option><option value="spam">Spam</option><option value="other">Other</option></select></label><label class="field-label">Details (optional)<textarea name="details" rows="3" maxlength="1000"></textarea></label><label class="block-checkbox"><input type="checkbox" name="also_block"> Also block this member</label><div class="form-message" data-form-message hidden></div><button class="btn btn-primary" type="submit">Send report</button></form>`;
    return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-dialog messaging-dialog" role="dialog" aria-modal="true" aria-labelledby="message-modal-title"><button class="modal-close icon-button" data-action="close-modal" aria-label="Close">${icon('close', 20)}</button>${contents}</section></div>`;
}
async function searchMessageMembers(query) {
    const seq = ++state.memberSearchSeq;
    const term = query.trim().slice(0, 80);
    if (term.length < 2) { state.memberResults = []; }
    else {
        try {
            const users = apiEnabled ? (await apiRequest(`/api/search?q=${encodeURIComponent(term)}`)).users : localSearchResults(term).users;
            if (seq !== state.memberSearchSeq) return;
            state.memberResults = users || [];
        } catch { if (seq === state.memberSearchSeq) state.memberResults = []; }
    }
    const results = document.querySelector('.member-results');
    if (state.modal === 'new-message' && results && seq === state.memberSearchSeq) results.innerHTML = renderMemberResults();
}
async function setMemberBlock(user, block) {
    if (!state.currentUser || !user || String(user.id) === String(state.currentUser.id)) return;
    if (apiEnabled) await apiRequest(`/api/users/${encodeURIComponent(user.id)}/block`, block ? 'POST' : 'DELETE', {});
    state.blockedUsers = state.blockedUsers.filter(item => String(item.id) !== String(user.id));
    if (block) state.blockedUsers.push(user);
    if (!apiEnabled) writeStorage(previewKey('blocks'), state.blockedUsers);
    if (String(state.messagePeer?.id) === String(user.id)) state.messagingBlocked = block;
    if (state.profileData?.relationship && String(state.profileData.user.id) === String(user.id)) Object.assign(state.profileData.relationship, {blockedByMe: block, messagingBlocked: block});
    if (apiEnabled && !block && state.messagePeer?.id) await loadThread(state.messagePeer);
}
async function submitMessageReport(form) {
    const target = state.messageReport;
    if (!target) return;
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    const data = new FormData(form);
    const payload = { reason: String(data.get('reason') || ''), details: String(data.get('details') || '').trim() };
    try {
        if (!['hate', 'harassment', 'threat', 'spam', 'other'].includes(payload.reason)) throw new Error('Choose a reason.');
        if (apiEnabled) await apiRequest(`/api/message-reports/${target.type}/${encodeURIComponent(target.id)}`, 'POST', payload);
        else {
            const reports = readStorage(previewKey('reports'), []);
            if (!reports.some(item => item.type === target.type && String(item.id) === String(target.id))) reports.push({...payload, type: target.type, id: target.id});
            writeStorage(previewKey('reports'), reports);
        }
        state.reportedMessages.push(`${target.type}:${target.id}`);
        let blockFailed = false;
        if (data.get('also_block')) {
            try { await setMemberBlock(target.user, true); } catch { blockFailed = true; }
        }
        state.modal = null;
        state.messageReport = null;
        renderApp();
        showToast(blockFailed ? 'Report sent. Blocking failed; please try blocking again.' : apiEnabled ? 'Report sent for moderator review.' : 'Report saved in this demo. No moderator is notified.');
    } catch (error) {
        const message = form.querySelector('[data-form-message]');
        message.hidden = false;
        message.textContent = error.message;
    } finally { if (button.isConnected) button.disabled = false; }
}

function renderFooter() {
    return `<footer class="site-footer"><div class="footer-shell">
        <div class="footer-main">
            <div class="footer-brand-block"><a class="brand footer-brand" href="/" data-action="go-page" data-page="home">${brandMark()}<span class="brand-word">vibe<span>dock</span></span></a><p>A home for vibe coders.</p></div>
            <div class="footer-column"><strong>Explore</strong><button data-action="go-page" data-page="feed">Feed</button><button data-action="go-page" data-page="polls">Polls</button><button data-action="go-page" data-page="launches">Launches</button><button data-action="go-page" data-page="rankings">Rankings</button><button data-action="go-page" data-page="community-chat">Community chat</button></div>
            <div class="footer-column"><strong>Information</strong><button data-action="go-page" data-page="help">Help & features</button><button data-action="go-page" data-page="badges">Badges</button><button data-action="go-page" data-page="about">About</button><button data-action="go-page" data-page="guidelines">Guidelines</button><button data-action="go-page" data-page="privacy">Privacy</button><button data-action="go-page" data-page="terms">Terms</button></div>
            <div class="footer-column"><strong>Account</strong>${state.currentUser ? `<button data-action="open-my-profile">Your profile</button><button data-action="go-page" data-page="messages">Messages</button>${state.currentUser.isAdmin ? `<a href="/admin">Admin panel</a>` : ''}<button data-action="logout">Sign out</button>` : `<button data-action="open-auth" data-mode="register">Join free</button><button data-action="open-auth" data-mode="login">Sign in</button>`}</div>
        </div>
        <div class="footer-bottom"><span>© ${new Date().getFullYear()} VibeDock</span></div>
    </div></footer>`;
}

/* ------------------------------------------------------------------ */
/* Modals                                                              */
/* ------------------------------------------------------------------ */

function socialBrand(provider) {
    if (provider === 'google') {
        return `<svg class="social-brand-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285f4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.4 3-7.3Z"/><path fill="#34a853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"/><path fill="#fbbc05" d="M6.4 13.8a6 6 0 0 1 0-3.7V7.5H3.1a10 10 0 0 0 0 8.9l3.3-2.6Z"/><path fill="#ea4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.9 5.5l3.3 2.6C7.2 7.7 9.4 6 12 6Z"/></svg>`;
    }
    return `<svg class="social-brand-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#1877f2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.3c0-3 1.8-4.7 4.5-4.7 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.4 0-1.8.9-1.8 1.8V12H17l-.5 3.5h-2.6v8.4A12 12 0 0 0 24 12Z"/><path fill="#fff" d="M16.5 15.5 17 12h-3.1V9.5c0-.9.4-1.8 1.8-1.8h1.5V4.8s-1.3-.2-2.6-.2c-2.7 0-4.5 1.7-4.5 4.7V12h-3v3.5h3v8.4a12 12 0 0 0 3.7 0v-8.4h2.7Z"/></svg>`;
}

function renderAuthModal() {
    const isLogin = state.authMode === 'login';
    const socialOptions = apiEnabled
        ? `<div class="oauth-options"><a class="oauth-button" href="/auth/google/redirect">${socialBrand('google')}<span>Continue with Google</span></a><a class="oauth-button" href="/auth/facebook/redirect">${socialBrand('facebook')}<span>Continue with Facebook</span></a></div><div class="auth-divider"><span>or use email</span></div>`
        : `<div class="oauth-options"><button class="oauth-button" data-action="demo-social">${socialBrand('google')}<span>Continue with Google</span></button><button class="oauth-button" data-action="demo-social">${socialBrand('facebook')}<span>Continue with Facebook</span></button></div><p class="oauth-preview-note">Social sign-in is available on the configured live site. Use a demo account here.</p><div class="auth-divider"><span>or use email</span></div><section class="demo-credentials"><strong>Demo accounts</strong><div><code>demo@vibedock.test</code><button type="button" data-action="fill-demo-account" data-demo-account="member">Use</button></div><div><code>admin@vibedock.test</code><button type="button" data-action="fill-demo-account" data-demo-account="admin">Use</button></div></section>`;
    return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-dialog auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button class="modal-close icon-button" data-action="close-modal" aria-label="Close">${icon('close', 21)}</button>
        <div class="modal-brand">${brandMark()}<span class="brand-word">vibe<span>dock</span></span></div>
        <h2 id="auth-title">${isLogin ? 'Welcome back' : 'Join the community'}</h2>
        ${socialOptions}
        <div class="auth-switch" role="tablist"><button class="${!isLogin ? 'is-active' : ''}" data-action="auth-mode" data-mode="register" role="tab" aria-selected="${!isLogin}">Create account</button><button class="${isLogin ? 'is-active' : ''}" data-action="auth-mode" data-mode="login" role="tab" aria-selected="${isLogin}">Sign in</button></div>
        <form class="modal-form" data-form="auth" data-mode="${isLogin ? 'login' : 'register'}">
            ${!isLogin ? `<label class="field-label">Name<input name="name" type="text" autocomplete="name" minlength="2" maxlength="80" placeholder="Your name" required></label><label class="field-label">Username<input name="username" type="text" autocomplete="username" minlength="3" maxlength="24" pattern="[A-Za-z0-9_]+" placeholder="yourname" required></label>` : ''}
            <label class="field-label">Email<input name="email" type="email" autocomplete="email" placeholder="you@example.com" required></label>
            <label class="field-label">Password<input name="password" type="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" minlength="8" placeholder="At least 8 characters" required></label>
            <div class="form-message" data-form-message hidden></div>
            <button class="btn btn-primary modal-submit" type="submit">${isLogin ? 'Sign in' : 'Create account'}</button>
        </form>
        <p class="modal-terms">${isLogin ? `New here? <button data-action="auth-mode" data-mode="register">Create an account</button>` : `By joining you agree to our <button data-action="go-page" data-page="guidelines">guidelines</button>.`}</p>
    </section></div>`;
}

function uploadField(name, title) {
    const logo = name === 'logo';
    const limit = apiEnabled ? (logo ? '2 MB' : '5 MB') : '1.2 MB in this preview';
    return renderUploadField({name, title,
        accept: logo ? '.svg,image/svg+xml,image/png,image/jpeg,image/webp' : 'image/png,image/jpeg,image/webp',
        hint: `${logo ? 'SVG, ' : ''}PNG, JPEG or WebP · Up to ${limit}`,
        icon: icon(logo ? 'rocket_launch' : 'image', 24),
    });
}

function renderCreatePage() {
    const type = state.page === 'create-post' ? 'discussion' : state.page.slice(7);
    const titles = {discussion:'Share a post', question:'Ask a question', poll:'Create a poll', launch:'Your next big thing. Starts here.'};
    const hints = {discussion:'A small update can start a great conversation.', question:'A fresh perspective is one question away.', poll:'Real opinions. Better decisions.', launch:'Give your project a home on the dock.'};
    return `<main class="route-main create-page ${type === 'launch' ? 'launch-studio' : ''}"><a class="feature-link" href="${type === 'launch' ? '/launches' : '/feed'}" data-action="go-page" data-page="${type === 'launch' ? 'launches' : 'feed'}">${icon('arrow_back',18)} Back to ${type === 'launch' ? 'launches' : 'feed'}</a><header class="create-heading"><span class="section-kicker">${type === 'launch' ? 'THE LAUNCH STUDIO' : 'YOUR COMMUNITY'}</span><h1>${titles[type]}</h1><p>${hints[type]}</p></header>
    ${!state.currentUser ? `<section class="settings-panel"><h2>Make yourself at home</h2><p>Sign in to ${type === 'launch' ? 'launch your project' : titles[type].toLowerCase()}.</p><button class="btn btn-primary" data-action="open-auth" data-mode="login">Sign in</button> <button class="btn btn-outline" data-action="open-auth" data-mode="register">Create account</button></section>` : `<div class="create-layout"><section class="create-editor">
    <form class="modal-form compose-form" data-form="compose" data-type="${type}">
        ${type!=='discussion'?`<label class="field-label">${type==='launch'?'Project name':type==='poll'?'Poll question':'Your question'}<input name="title" maxlength="140" required></label>`:''}
        <label class="field-label">${type==='launch'?'What does it do?':type==='poll'?'Context (optional)':type==='question'?'Details':'Your post'}<textarea name="body" rows="4" maxlength="5000" ${type!=='poll'?'required':''} placeholder="${type==='launch'?'What did you build, and who is it for?':'What would you like to share?'}"></textarea></label>
        ${type==='poll'?`<div class="poll-option-fields">${[1,2].map(i=>`<label class="field-label">Option ${i}<input name="options[]" maxlength="80" required></label>`).join('')}</div><button class="add-option" type="button" data-action="add-option">${icon('add',16)} Add option</button>`:''}
        ${type==='launch'?`<label class="field-label">Project URL<input type="url" name="project_url" required placeholder="https://your-project.com"></label><label class="field-label">Project type<select name="launch_category"><option value="website">Website</option><option value="app">App</option><option value="ai_tool">AI tool</option><option value="ai_app">AI app</option><option value="other">Other</option></select></label><label class="field-label">SEO description <small>A short search preview, up to 160 characters.</small><textarea name="seo_description" rows="2" maxlength="160" placeholder="Describe your project in one useful sentence."></textarea></label>${uploadField('logo', 'Project logo')}${uploadField('image', 'Project screenshot (optional)')}<fieldset class="brand-claim-fields"><legend>Claim your brand <span>Optional</span></legend><label class="field-label">Brand handle<input name="brand_slug" minlength="3" maxlength="40" pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="your-brand" aria-describedby="brand-hint"></label><p id="brand-hint">Your own /brands/your-brand address. Lowercase letters, numbers and hyphens. Reserved when you publish.</p><label class="claim-consent"><input type="checkbox" name="brand_authorized" value="1"> I’m authorized to represent this brand.</label><small>Claims do not establish trademark rights. A green tick appears only after an admin reviews ownership.</small></fieldset>`:`${uploadField('image', 'Image (optional)')}<label class="field-label">Topic<select name="category"><option value="">None</option>${popularTopics.map(topic=>`<option>${escapeHtml(topic)}</option>`).join('')}</select></label>`}
        <div class="form-message" data-form-message hidden></div><div class="compose-submit-row"><button class="btn btn-primary" type="submit">${type==='launch'?'Publish launch':type==='poll'?'Publish poll':type==='question'?'Ask question':'Publish post'}</button></div>
    </form>
    </section><aside class="create-aside">${type === 'launch' ? `<div class="launch-live-preview"><span class="section-kicker">YOUR LAUNCH PREVIEW</span><div class="launch-preview-logo">${icon('rocket_launch',36)}</div><h2 data-launch-title>Your project name</h2><p data-launch-description>Something worth sharing.</p><span class="launch-preview-domain" data-launch-domain>your-project.com</span><span class="launch-preview-tag">Made by @${escapeHtml(state.currentUser.username)}</span></div><div class="create-tip"><strong>A name. A story. A first impression.</strong><p>Add a clear logo and a real screenshot. Tell people who it’s for.</p></div>` : `<div class="create-tip">${icon(typeIcon(type),32)}<h2>${type === 'poll' ? 'Make every vote count' : type === 'question' ? 'Make it easy to help' : 'Keep it real'}</h2><p>${type === 'poll' ? 'Use distinct options. Comparing AI models? Name the task you’re testing.' : type === 'question' ? 'Include what you tried and what you expected. Never share passwords or API keys.' : 'Share something you learned, made, or are working through.'}</p></div>`}</aside></div>`}</main>`;
}

function renderProfileEditPage() {
    if (!state.currentUser) return `<main class="route-main"><section class="route-empty"><h1>Edit profile</h1><button class="btn btn-primary" data-action="open-auth" data-mode="login">Sign in</button></section></main>`;
    const user=state.currentUser;
    return `<main class="route-main profile-edit-page"><header class="settings-heading"><div><span class="section-kicker">Make yourself at home</span><h1>Your profile, your personality.</h1></div><button class="btn btn-outline" data-action="open-my-profile">View profile ${icon('arrow_forward',18)}</button></header>
    <form data-form="profile" class="profile-settings-form"><aside class="settings-preview"><div class="profile-preview-cover cover-${escapeHtml(user.coverChoice||'aurora')}"></div><img class="settings-avatar" src="${escapeHtml(avatarAsset(user.avatarUrl)?.large || safeImageUrl(user.avatarUrl) || avatarPath('fluent-astronaut', 'large'))}" alt="Your selected avatar" width="112" height="112" decoding="async" loading="eager"><h2 data-profile-name>${escapeHtml(user.name)}</h2><p>@${escapeHtml(user.username)}</p><div class="settings-section-links"><a href="#profile-basics">The basics</a><a href="#profile-style">Your look</a><a href="#profile-skills">Your skills</a></div><button type="submit" class="btn btn-primary">Save changes ${icon('check',18)}</button></aside>
    <div class="settings-fields"><section id="profile-basics" class="settings-panel"><div class="settings-panel-heading">${illustration('maker')}<div><h2>The basics</h2><p>Let fellow makers get to know you.</p></div></div><div class="settings-two-col"><label class="field-label">Name<input name="name" value="${escapeHtml(user.name)}" maxlength="80" minlength="2" required></label><label class="field-label">Username<input name="username" value="${escapeHtml(user.username)}" pattern="[A-Za-z0-9_]+" minlength="3" maxlength="24" required></label></div><label class="field-label">What do you do?<input name="profession" value="${escapeHtml(user.profession||'')}" maxlength="80" placeholder="Designer, developer, curious human…"></label><label class="field-label">About you<textarea name="bio" rows="3" maxlength="280">${escapeHtml(user.bio||'')}</textarea></label><label class="field-label">Website<input name="website" type="url" value="${escapeHtml(user.website||'')}" placeholder="https://"></label></section>
    <section id="profile-style" class="settings-panel"><div class="settings-panel-heading">${illustration('conversation')}<div><h2>A little character</h2><p>Male, female, or a little character. Find your look.</p></div></div>${renderAvatarPicker(user)}${uploadField('avatar', 'Or upload your own photo')}${renderCoverPicker(user)}</section>
    <section id="profile-skills" class="settings-panel"><div class="settings-panel-heading">${illustration('build')}<div><h2>What’s in your toolkit?</h2><p>Choose up to 12 skills. Add your own, too.</p></div></div><label class="field-label">Selected skills<input name="skills" maxlength="420" value="${escapeHtml((user.skills||[]).join(', '))}" placeholder="Add custom skills, separated by commas"></label>${renderSkillPicker(user.skills||[])}</section><div class="settings-save"><div class="form-message" data-form-message hidden></div><button type="submit" class="btn btn-primary">Save changes</button></div></div></form></main>`;
}

function renderAvatarPicker(user) {
    const selected = user.avatarUploaded || !AVATAR_CHOICES.some(choice=>choice.key===user.avatarChoice) ? 'keep' : user.avatarChoice;
    const groups = ['Male', 'Female', 'Characters'];
    const active = AVATAR_CHOICES.find(choice => choice.key === selected)?.group || 'Male';
    return `<fieldset class="avatar-picker" data-active-avatar-group="${active}"><legend>Avatar</legend>
        ${selected === 'keep' ? `<label class="avatar-current-choice"><input type="radio" name="avatar_choice" value="keep" checked>${avatar(user.name || 'You', 'tone-neutral', 'avatar-choice-preview', user.avatarUrl)}<span>Keep current avatar</span></label>` : ''}
        <div class="avatar-picker-tools"><div class="avatar-group-switch" role="group" aria-label="Avatar category">${groups.map(group => `<button type="button" data-action="avatar-group" data-group="${group}" aria-pressed="${group === active}" aria-controls="avatar-${group.toLowerCase()}">${group}</button>`).join('')}</div><button type="button" class="btn btn-outline btn-small" data-action="random-avatar">${icon('shuffle', 16)} Random</button></div>
        ${groups.map(group => `<div class="avatar-choice-group" id="avatar-${group.toLowerCase()}" data-avatar-group="${group}" ${active !== group ? 'hidden' : ''}><div class="avatar-choice-grid">${AVATAR_CHOICES.filter(choice => choice.group === group).map((choice, index) => {
            const visible = index < 8 || selected === choice.key;
            return `<label ${!visible ? 'hidden' : ''} data-avatar-index="${index}" class="avatar-choice ${selected === choice.key ? 'is-selected' : ''}" title="${choice.label}"><input type="radio" name="avatar_choice" value="${choice.key}" ${selected === choice.key ? 'checked' : ''}>${active === group && visible ? avatarChoiceImage(choice) : `<span class="avatar-placeholder" data-avatar-image="${choice.key}"></span>`}<span>${choice.label}</span></label>`;
        }).join('')}</div>${group === 'Characters' ? `<button type="button" class="picker-expand" data-action="expand-avatars" aria-expanded="false" aria-controls="avatar-characters">Meet all 12 characters ${icon('expand_more',18)}</button>` : ''}</div>`).join('')}
        <p class="avatar-picker-note">Your choice, not a profile label. Only the group you open loads images.</p>
    </fieldset>`;
}
function avatarChoiceImage(choice) {
    return `<img src="${avatarPath(choice.key)}" ${avatarResolutionAttributes(choice.key, 72)} alt="${choice.label}" width="96" height="96" loading="lazy" decoding="async">`;
}
function hydrateAvatarGroup(panel) {
    panel.querySelectorAll('.avatar-choice:not([hidden]) [data-avatar-image]').forEach(placeholder => {
        const choice = AVATAR_CHOICES.find(item => item.key === placeholder.dataset.avatarImage);
        if (choice) placeholder.outerHTML = avatarChoiceImage(choice);
    });
}
function selectAvatarGroup(picker, group) {
    if (!['Male','Female','Characters'].includes(group)) return;
    picker.dataset.activeAvatarGroup = group;
    picker.querySelectorAll('[data-action="avatar-group"]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.group === group)));
    picker.querySelectorAll('[data-avatar-group]').forEach(panel => {
        panel.hidden = panel.dataset.avatarGroup !== group;
        if (!panel.hidden) hydrateAvatarGroup(panel);
    });
}

function renderCoverPicker(user) {
    const selected = user.coverChoice || 'aurora';
    return `<fieldset class="cover-picker"><legend>Cover</legend><div class="cover-choice-grid">${COVER_CHOICES.map((choice) => `<label class="cover-choice cover-swatch-${choice.key} ${selected === choice.key ? 'is-selected' : ''}" title="${choice.label}"><input type="radio" name="cover_choice" value="${choice.key}" ${selected === choice.key ? 'checked' : ''}>${icon('check', 18)}<span class="cover-name">${choice.label}</span></label>`).join('')}</div></fieldset>`;
}

function syncSkillPicker(form) {
    const skills = form.querySelector('[name="skills"]').value.split(',').map(item => item.trim()).filter(Boolean);
    form.querySelectorAll('[data-skill]').forEach(button => button.setAttribute('aria-pressed', String(skills.some(skill => skill.toLowerCase() === button.dataset.skill.toLowerCase()))));
    form.querySelector('.skill-status').textContent = `${skills.length}/12 selected`;
}

function renderSkillPicker(selected) {
    const chosen = selected.map(name => name.toLowerCase());
    return `<fieldset class="skill-picker"><legend>Find your skills</legend><label class="visually-hidden" for="skill-search">Search skills</label><input id="skill-search" type="search" data-skill-search placeholder="Search ${SKILLS.length} skills…" autocomplete="off"><div class="skill-catalog" id="skill-catalog">${SKILLS.map((skill, index) => `<button ${index >= 16 && !chosen.includes(skill.name.toLowerCase()) ? 'hidden' : ''} data-skill-index="${index}" type="button" class="skill-option" data-action="toggle-skill" data-skill="${escapeHtml(skill.name)}" aria-pressed="${chosen.includes(skill.name.toLowerCase())}">${skillIcon(skill.name)}<span>${escapeHtml(skill.name)}</span>${icon('check', 14, 'skill-check')}</button>`).join('')}</div><button class="picker-expand" type="button" data-action="expand-skills" aria-expanded="false" aria-controls="skill-catalog">Browse all ${SKILLS.length} skills ${icon('expand_more',18)}</button><p class="skill-empty" hidden>No matching skills. You can add a custom skill above.</p><p class="skill-status" role="status">${selected.length}/12 selected</p></fieldset>`;
}

function renderReportModal() {
    const post = state.posts.find((item) => item.id === String(state.reportPostId));
    return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-dialog compose-dialog report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-title"><button class="modal-close icon-button" data-action="close-modal" aria-label="Close">${icon('close', 21)}</button><h2 id="report-title">Report post</h2><form class="modal-form" data-form="report" data-post-id="${escapeHtml(post?.id || '')}"><label class="field-label">Reason<select name="reason" required><option value="">Choose a reason</option><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="misinformation">Misleading information</option><option value="unsafe">Unsafe content</option><option value="other">Something else</option></select></label><label class="field-label">Details <span class="optional-label">Optional</span><textarea name="details" rows="3" maxlength="1000" placeholder="Anything that may help moderators."></textarea></label><div class="form-message" data-form-message hidden></div><div class="compose-submit-row"><button class="btn btn-primary" type="submit">Send report</button></div></form></section></div>`;
}

function renderModal() {
    if (state.modal === 'auth') return renderAuthModal();
    if (state.modal === 'report') return renderReportModal();
    if (['new-message', 'blocked-members', 'block-member', 'message-report'].includes(state.modal)) return renderMessagingModal();
    return '';
}

function renderPageContent() {
    if (creationPages.includes(state.page)) return renderCreatePage();
    if (state.page === 'polls') return renderPollsPage();
    if (state.page === 'badges' || state.page === 'help') return renderGuidePage();
    if (state.page === 'feed') return renderMain();
    if (state.page === 'profile-edit') return renderProfileEditPage();
    if (state.page === 'launches') return renderLaunchPage();
    if (state.page === 'rankings') return renderRankingsPage();
    if (state.page === 'community-chat') return renderCommunityChatPage();
    if (state.page === 'profile') return renderProfilePage();
    if (state.page === 'messages') return renderMessagesPage();
    if (state.page === 'admin') return renderAdminPage();
    if (['about', 'guidelines', 'privacy', 'terms'].includes(state.page)) return renderInfoPage();
    return renderLanding();
}

let renderedPage = null;
const renderedRegions = new Map();
function patchRegion(id, html) {
    const el = document.getElementById(id);
    if (!el || renderedRegions.get(id) === html) return false;
    el.innerHTML = html; renderedRegions.set(id, html); return true;
}

function renderApp({ updatePage = true } = {}) {
    if (!root) return;
    if (!document.querySelector('#page-content')) root.innerHTML = '<div id="header-region"></div><div id="page-content"></div><div id="footer-region"></div><div id="navigation-region"></div><div id="modal-region"></div>';
    patchRegion('header-region', renderHeader());
    if (updatePage && !(creationPages.includes(state.page) && renderedPage === state.page && document.querySelector('.create-editor')) && !(state.page === 'profile-edit' && renderedPage === 'profile-edit' && document.querySelector('.profile-settings-form'))) patchRegion('page-content', renderPageContent());
    renderedPage = state.page;
    patchRegion('footer-region', ['messages', 'community-chat', 'profile-edit'].includes(state.page) ? '' : renderFooter());
    patchRegion('navigation-region', renderMobileNav());
    const modalChanged = patchRegion('modal-region', renderModal());
    if (updatePage && state.page === 'feed') {
        renderFeed();
        if (apiEnabled && state.initialPostId && !state.posts.some(post => post.id === String(state.initialPostId)) && !state.postRequests.has(String(state.initialPostId))) void loadSinglePost(state.initialPostId);
    }
    updateMetadata(state, apiEnabled);
    document.body.classList.toggle('has-modal', Boolean(state.modal));
    if (modalChanged && state.modal === 'auth') {
        window.requestAnimationFrame(() => root.querySelector('.modal-dialog input')?.focus());
    } else if (modalChanged && state.modal) {
        window.requestAnimationFrame(() => root.querySelector('.modal-dialog input, .modal-dialog select, .modal-dialog textarea')?.focus());
    }
    if (state.page === 'profile' && state.profileUsername && state.profileLoadedFor !== state.profileUsername && state.profileLoadingFor !== state.profileUsername) {
        void loadProfile(state.profileUsername);
    }
    if (state.page === 'messages' && !state.conversationsLoaded) {
        void loadConversations();
    }
    if (['feed','launches','polls'].includes(state.page) && !state.feedLoaded && !state.feedLoading) void loadServerFeed();
    if (state.page === 'rankings' && !state.rankingsLoaded) void loadRankings();
    if (state.page === 'community-chat' && state.currentUser && !state.groupChatLoaded && !state.groupChatLoading) void loadCommunityChat();
    if (state.page === 'community-chat') {
        const transcript = document.querySelector('#community-chat-transcript');
        if (transcript) transcript.scrollTop = transcript.scrollHeight;
    }
    if (state.page === 'messages') {
        const thread = document.querySelector('#thread-messages');
        if (thread && !state.messagesLoading) thread.scrollTop = thread.scrollHeight;
    }
    syncCommunityPolling();
    syncMessagePolling();
    if (state.currentUser && state.safetyLoadedFor !== state.currentUser.id) void loadSafety();
    if (state.flashMessage) {
        const message = state.flashMessage;
        state.flashMessage = '';
        window.setTimeout(() => showToast(message), 0);
    }
}

/* ------------------------------------------------------------------ */
/* Data helpers                                                        */
/* ------------------------------------------------------------------ */

function persistDemo() {
    if (!apiEnabled) {
        writeStorage(STORAGE.posts, state.posts);
        writeStorage(STORAGE.user, state.currentUser);
        writeStorage('vibedock-preview-chat', state.groupMessages);
    }
    writeStorage('vibedock-preview-saved', state.savedIds);
}

function openAuth(mode = 'register') {
    state.modal = 'auth';
    state.authMode = mode;
    state.mobileMenu = false;
    renderApp({ updatePage: false });
}

function openCompose(type = 'discussion') {
    const kind = ['question','poll','launch'].includes(type) ? type : 'post';
    navigateTo(`create-${kind}`);
}

function showMessage(form, message, isError = true) {
    const target = form.querySelector('[data-form-message]');
    if (!target) return;
    target.hidden = !message;
    target.textContent = message || '';
    target.classList.toggle('is-error', isError);
    target.classList.toggle('is-success', !isError);
}

async function apiRequest(path, method = 'GET', payload = undefined) {
    const headers = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
    const options = { method, headers, credentials: 'same-origin' };
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
    if (csrf && !['GET', 'HEAD'].includes(method.toUpperCase())) headers['X-CSRF-TOKEN'] = csrf;
    if (payload !== undefined) {
        if (payload instanceof FormData) {
            options.body = payload;
        } else {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(payload);
        }
    }
    const response = await fetch(path, options);
    const data = response.status === 204 ? {} : await response.json().catch(() => {
        if (response.ok) throw new Error('The server returned an unexpected response. Please reload and try again.');
        return {};
    });
    if (!response.ok) {
        const detail = data.errors ? Object.values(data.errors).flat().join(' ') : '';
        const error = new Error(detail || data.message || 'Something went wrong. Please try again.');
        error.status = response.status;
        throw error;
    }
    if (data.csrfToken) {
        const token = document.querySelector('meta[name="csrf-token"]');
        if (token) token.content = data.csrfToken;
    }
    return data;
}

async function loadSinglePost(id) {
    state.postRequests.add(String(id)); state.postLoading.add(String(id)); renderApp();
    try {
        const result = await apiRequest(`/api/posts/${encodeURIComponent(id)}`);
        const post = normalizePost(result.post);
        if (!state.posts.some(item => item.id === post.id)) state.posts.push(post);
    } catch (error) {
        if (state.initialPostId === String(id)) state.feedError = error.status === 404 ? 'This post is no longer available.' : error.message;
    }
    state.postLoading.delete(String(id));
    if (state.initialPostId === String(id)) renderApp();
}

async function loadServerFeed() {
    if (!apiEnabled || state.feedLoading) return;
    state.feedLoading = true; state.feedLoaded = true; state.feedError = ''; renderApp();
    try {
        const posts = ((await apiRequest('/api/feed')).data || []).filter(post=>post.type!=='model').map(normalizePost);
        const linked = state.posts.find(post => post.id === String(state.initialPostId));
        state.posts = linked && !posts.some(post => post.id === linked.id) ? [...posts, linked] : posts;
    }
    catch (error) { state.feedError = error.message; }
    finally { state.feedLoading = false; if (['feed','launches','polls','rankings'].includes(state.page)) renderApp(); }
}

async function loadRankings() {
    if (state.rankingsLoading) return;
    state.rankingsLoaded = true; state.rankingsError = '';
    if (!apiEnabled) {
        state.rankings = null;
        renderApp();
        return;
    }
    try {
        state.rankingsLoading = true; renderApp();
        const result = await apiRequest('/api/rankings');
        state.rankings = {
            tools: Array.isArray(result.tools) ? result.tools.map(normalizePost) : [],
            leaderboard: Array.isArray(result.leaderboard) ? result.leaderboard : [],
        };
    } catch (error) {
        state.rankingsError = error.message;
    } finally { state.rankingsLoading = false; }
    if (state.page === 'rankings') renderApp();
}

async function loadCommunityChat(isPolling = false) {
    if (!state.currentUser || state.groupChatLoading) return;
    const viewer = state.currentUser.id;
    state.groupChatLoading = true;
    const transcript = document.querySelector('#community-chat-transcript');
    const stick = !isPolling || !transcript || transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight < 100;
    try {
        const data = apiEnabled ? (await apiRequest('/api/community-chat')).data : state.groupMessages;
        if (state.currentUser?.id !== viewer) return;
        const changed = JSON.stringify(data) !== JSON.stringify(state.groupMessages);
        state.groupMessages = Array.isArray(data) ? data : [];
        state.groupChatLoaded = true;
        if (changed || !isPolling) {
            const log = document.querySelector('#community-chat-transcript');
            if (log) {
                const top = log.scrollTop;
                log.innerHTML = renderGroupMessages();
                log.scrollTop = stick ? log.scrollHeight : top;
            }
        }
    } catch (error) {
        if (!isPolling) showToast(error.message);
        state.groupChatLoaded = true;
    } finally { state.groupChatLoading = false; }
}


function syncCommunityPolling() {
    const shouldPoll = apiEnabled && state.currentUser && state.page === 'community-chat';
    if (shouldPoll && !state.groupChatTimer) {
        state.groupChatTimer = window.setInterval(() => {
            if (document.visibilityState === 'visible') void loadCommunityChat(true);
        }, 12000);
    } else if (!shouldPoll && state.groupChatTimer) {
        window.clearInterval(state.groupChatTimer);
        state.groupChatTimer = null;
    }
}

function previewProfile(username) {
    const own = state.currentUser && String(state.currentUser.username || '').toLowerCase() === String(username).toLowerCase();
    const authoredPosts = state.posts.filter((post) => String(post.author?.username || '').toLowerCase() === String(username).toLowerCase());
    const author = own ? state.currentUser : authoredPosts[0]?.author;
    if (!author) return null;
    const user = {
        ...author,
        name: author.name || authoredPosts[0]?.authorName || 'Member',
        username: author.username || username,
        bio: author.bio || '',
        profession: author.profession || '',
        skills: author.skills || (own ? [] : ['React', 'Prompt engineering', 'UI design']),
        website: author.website || '',
        coverChoice: author.coverChoice || 'aurora',
        avatarChoice: author.avatarChoice || 'neutral',
        avatarUploaded: Boolean(author.avatarUploaded),
        postsCount: authoredPosts.length,
        followersCount: 0,
        followingCount: 0,
        friendsCount: 0,
        avatarUrl: author.avatarUrl || null,
    };
    return { user, relationship: { isSelf: own, isFollowing: false, isFriend: false, blockedByMe: blockedByMe(user.id), messagingBlocked: blockedByMe(user.id) }, posts: authoredPosts };
}

async function loadProfile(username) {
    const request = ++state.profileRequest;
    state.profileLoading = true;
    state.profileLoadingFor = username;
    state.profileError = '';
    renderApp();
    try {
        const data = apiEnabled ? await apiRequest(`/api/users/${encodeURIComponent(username)}`) : previewProfile(username);
        if (request !== state.profileRequest || state.profileUsername !== username) return;
        if (!data?.user) throw new Error('Profile not found.');
        state.profileData = data;
        if (Array.isArray(data.posts)) data.posts = data.posts.map(normalizePost);
        state.profileLoadedFor = username;
        // Requests aren't needed to paint the profile; load them independently.
        if (data.relationship?.isSelf) void loadFriendRequests().then(() => {
            if (state.page === 'profile' && state.profileUsername === username) renderApp();
        });
    } catch (error) {
        if (request !== state.profileRequest || state.profileUsername !== username) return;
        state.profileData = null;
        state.profileError = error.message;
        state.profileLoadedFor = username;
    } finally {
        if (request === state.profileRequest) {
            state.profileLoading = false;
            state.profileLoadingFor = null;
            if (state.page === 'profile') renderApp();
        }
    }
}

async function loadFriendRequests() {
    if (state.friendRequestsLoaded) return;
    state.friendRequestsLoaded = true;
    if (!apiEnabled || !state.currentUser) {
        state.friendRequests = [];
        return;
    }
    try {
        const result = await apiRequest('/api/friend-requests');
        state.friendRequests = Array.isArray(result.data) ? result.data : [];
    } catch {
        state.friendRequests = [];
    }
}

async function loadThread(userOrId, polling = false) {
    if (!state.currentUser) return;
    const user = typeof userOrId === 'object' ? userOrId : findMember(userOrId);
    if (!user?.id) return;
    const viewer = state.currentUser.id;
    const requestId = ++state.threadRequest;
    if (!polling) {
        state.selectedMessageUser = String(user.id);
        state.messagePeer = user;
        state.messages = [];
        state.messagesLoading = true;
        state.threadError = '';
        state.messageError = '';
        state.messagingBlocked = blockedByMe(user.id);
        renderApp();
    }
    try {
        const result = apiEnabled ? await apiRequest(`/api/messages/${encodeURIComponent(user.id)}`) : { user, data: demoThreads()[user.id]?.messages || [], messagingBlocked: blockedByMe(user.id) };
        if (requestId !== state.threadRequest || viewer !== state.currentUser?.id || String(state.selectedMessageUser) !== String(user.id)) return;
        state.messagePeer = result.user || user;
        const changed = JSON.stringify(state.messages) !== JSON.stringify(result.data);
        const blockChanged = state.messagingBlocked !== Boolean(result.messagingBlocked);
        state.messagingBlocked = Boolean(result.messagingBlocked);
        state.messages = Array.isArray(result.data) ? result.data : [];
        if (polling && (changed || blockChanged)) {
            if (blockChanged) renderApp();
            else {
                const log = document.querySelector('#thread-messages');
                if (log) {
                    const stick = log.scrollHeight - log.scrollTop - log.clientHeight < 100;
                    const top = log.scrollTop;
                    log.innerHTML = renderDirectMessages();
                    log.scrollTop = stick ? log.scrollHeight : top;
                }
            }
        }
    } catch (error) {
        if (!polling && requestId === state.threadRequest) state.threadError = error.message;
    } finally {
        if (!polling && requestId === state.threadRequest && viewer === state.currentUser?.id) { state.messagesLoading = false; renderApp(); }
    }
}


async function loadConversations() {
    state.conversationsLoaded = true;
    const viewer = state.currentUser?.id;
    if (!viewer) return;
    if (!apiEnabled) {
        state.conversations = Object.values(demoThreads()).map(thread => ({ user: thread.user, latestMessage: thread.messages.at(-1), unreadCount: 0 }));
        renderApp();
        return;
    }
    try {
        const result = await apiRequest('/api/messages');
        if (state.currentUser?.id !== viewer) return;
        state.conversations = result.data || [];
        await loadFriendRequests();
        renderApp();
    } catch (error) { showToast(error.message); }
}


async function openMessageThread(userOrId) {
    if (!state.currentUser) return openAuth('login');
    const user = typeof userOrId === 'object' ? userOrId : findMember(userOrId);
    if (!user || String(user.id) === String(state.currentUser.id)) return;
    state.page = 'messages';
    state.profileUsername = null;
    state.initialPostId = null;
    state.modal = null;
    state.mobileSearch = false;
    state.mobileMenu = false;
    state.selectedMessageUser = String(user.id);
    state.messagePeer = user;
    state.conversationsLoaded = false;
    window.history.pushState({}, '', '/messages');
    await loadThread(user);
}


function syncMessagePolling() {
    const shouldPoll = apiEnabled && state.currentUser && state.page === 'messages';
    if (shouldPoll && !state.messagesPollTimer) state.messagesPollTimer = window.setInterval(() => {
        if (document.visibilityState === 'visible' && !state.messagesLoading && !state.sendingMessage && !state.modal) {
            if (state.messagePeer) void loadThread(state.messagePeer, true);
            else void loadConversations();
        }
    }, 12000);
    if (!shouldPoll && state.messagesPollTimer) { clearInterval(state.messagesPollTimer); state.messagesPollTimer = null; }
}


function showMessageError(type, message) {
    state[type === 'direct' ? 'messageError' : 'chatError'] = message;
    const el = document.querySelector(type === 'direct' ? '.messages-page .chat-error' : '.community-chat-page .chat-error');
    if (el) { el.hidden = !message; el.textContent = message; }
}


function navigateTo(page, username = null) {
    const allowed = ['home', 'feed', 'profile-edit', 'polls', 'badges', 'help', ...creationPages, 'launches', 'rankings', 'community-chat', 'messages', 'profile', 'admin', 'about', 'guidelines', 'privacy', 'terms'];
    const nextPage = allowed.includes(page) ? page : 'home';
    if (nextPage === 'admin' && apiEnabled) {
        window.location.assign('/admin');
        return;
    }
    if (['messages', 'community-chat', 'profile-edit'].includes(nextPage) && !state.currentUser) return openAuth('login');
    const nextUsername = nextPage === 'profile' ? (username || state.currentUser?.username || '') : null;
    if (nextPage === 'profile' && !nextUsername) return openAuth('login');
    if (nextPage === 'messages') state.conversationsLoaded = false;
    state.page = nextPage;
    state.mobileMenu = false;
    state.mobileSearch = false;
    state.modal = null;
    state.initialPostId = null;
    if (nextPage === 'profile') {
        if (state.profileUsername !== nextUsername) { state.profileData = null; state.profileLoadedFor = null; }
        state.profileUsername = nextUsername;
    } else {
        state.profileUsername = null;
    }
    if (nextPage === 'community-chat' && !apiEnabled) state.groupChatLoaded = true;
    const path = creationPages.includes(nextPage) ? `/create/${nextPage.slice(7)}` : nextPage === 'home' ? '/' : nextPage === 'profile-edit' ? '/settings/profile' : nextPage === 'profile' ? `/u/${encodeURIComponent(nextUsername)}` : `/${nextPage}`;
    window.history.pushState({}, '', path);
    renderApp();
    window.scrollTo({ top: 0, behavior: 'instant' });
}

function showToast(message) {
    document.querySelector('.toast')?.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `${icon('check', 17)}<span>${escapeHtml(message)}</span>`;
    document.body.append(toast);
    window.setTimeout(() => toast.remove(), 2800);
}

function closeModal() {
    state.modal = null;
    renderApp({ updatePage: false });
}

function setFilter(filter) {
    const changingPage = state.page !== 'feed';
    if (changingPage) {
        state.page = 'feed';
        state.profileUsername = null;
        state.initialPostId = null;
        window.history.pushState({}, '', '/feed');
    }
    state.filter = ['all', 'discussion', 'question', 'poll', 'launch', 'saved'].includes(filter) ? filter : 'all';
    state.tag = '';
    state.mobileMenu = false;
    if (changingPage) renderApp();
    renderHeaderAndFeedState();
}

function renderHeaderAndFeedState() {
    if (state.page !== 'feed') {
        renderApp();
        return;
    }
    const header = document.querySelector('.site-header');
    if (header) { header.outerHTML = renderHeader(); renderedRegions.delete('header-region'); }
    renderFeed();
    if (state.filter !== 'all') {
        document.querySelector('#community')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/* ------------------------------------------------------------------ */
/* Forms and actions                                                   */
/* ------------------------------------------------------------------ */

async function createAuth(form) {
    const formData = new FormData(form);
    const mode = form.dataset.mode;
    const payload = {
        email: String(formData.get('email') || '').trim(),
        password: String(formData.get('password') || ''),
    };
    if (mode === 'register') {
        payload.name = String(formData.get('name') || '').trim();
        payload.username = String(formData.get('username') || '').trim().toLowerCase();
    }
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.classList.add('is-loading');
    try {
        if (apiEnabled) {
            const result = await apiRequest(mode === 'login' ? '/login' : '/register', 'POST', payload);
            state.currentUser = result.user;
        } else if (mode === 'login') {
            const demoAccounts = {
                'demo@vibedock.test': { password: 'VibeDockDemo2026!', name: 'Demo Maker', username: 'demomaker', avatarChoice: 'fluent-owl', coverChoice: 'blossom', isAdmin: false, profession: 'Independent maker', skills: ['Prototyping', 'AI tools', 'Product design'] },
                'admin@vibedock.test': { password: 'VibeDockAdmin2026!', name: 'Demo Admin', username: 'demoadmin', avatarChoice: 'fluent-ninja', coverChoice: 'ocean', isAdmin: true, profession: 'Community moderator', skills: ['Community building'] },
            };
            const account = demoAccounts[payload.email.toLowerCase()];
            if (!account || account.password !== payload.password) throw new Error('Use one of the demo accounts shown above.');
            const { password: _password, ...profile } = account;
            state.currentUser = { id: `preview-${profile.username}`, ...profile, email: payload.email, avatarUploaded: false, avatarUrl: avatarPath(profile.avatarChoice) };
        } else {
            const username = payload.username || payload.name.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
            if (username.length < 3) throw new Error('Choose a username with at least three letters or numbers.');
            state.currentUser = { id: `preview-${Date.now()}`, name: payload.name, username, email: payload.email, bio: '', profession: '', skills: [], coverChoice: 'aurora', avatarChoice: 'fluent-astronaut', avatarUploaded: false, avatarUrl: '/avatars/fluent-astronaut.png', isAdmin: false };
            writeStorage(STORAGE.user, state.currentUser);
        }
        state.modal = null;
        state.feedLoaded = !apiEnabled; state.rankingsLoaded = false; state.rankings = null;
        state.profileLoadedFor = null;
        persistDemo(); renderApp(); showToast('Welcome!');
    } catch (error) {
        showMessage(form, error.message);
    } finally {
        if (submit.isConnected) {
            submit.disabled = false;
            submit.classList.remove('is-loading');
        }
    }
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('This image could not be read. Try another file.'));
        reader.readAsDataURL(file);
    });
}

async function createPost(form) {
    if (form.dataset.saving || !state.currentUser) return;
    form.dataset.saving = 'true';
    const formData = new FormData(form);
    const type = form.dataset.type;
    const options = formData.getAll('options[]').map((value) => String(value).trim()).filter(Boolean);
    const payload = {
        type,
        title: String(formData.get('title') || '').trim(),
        body: String(formData.get('body') || '').trim(),
        category: String(formData.get('category') || '').trim(),
        launch_category: String(formData.get('launch_category') || ''),
        project_url: String(formData.get('project_url') || '').trim(),
        ...(type === 'launch' && String(formData.get('brand_slug') || '').trim() ? {brand_slug: String(formData.get('brand_slug')).trim(), brand_authorized: formData.get('brand_authorized') || ''} : {}),
        ...(type === 'launch' ? {seo_description: String(formData.get('seo_description') || '').trim()} : {}),
    };
    if (type === 'poll') payload.options = options;
    const imageFile = formData.get('image');
    const logoFile = formData.get('logo');
    const hasImage = imageFile instanceof File && imageFile.size > 0;
    const hasLogo = logoFile instanceof File && logoFile.size > 0;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.classList.add('is-loading');
    try {
        for (const [name, file] of [['image', imageFile], ['logo', logoFile]]) {
            if (file instanceof File && file.size > 0) { const error = validateUpload(file, name, apiEnabled); if (error) throw new Error(error); }
        }
        if (payload.brand_slug && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.brand_slug) || payload.brand_slug.length < 3 || payload.brand_slug.length > 40)) throw new Error('Use 3–40 lowercase letters, numbers or hyphens for your brand handle.');
        if (payload.brand_slug && !payload.brand_authorized) throw new Error('Confirm that you are authorized to represent this brand.');
        if (!apiEnabled && payload.brand_slug && state.posts.some(post => post.brand?.slug === payload.brand_slug)) throw new Error('That brand handle is already claimed. Choose another.');
        if (type === 'launch' && !safeUrl(payload.project_url)) throw new Error('Use a valid https:// or http:// project URL.');
        if (type === 'poll' && (options.length < 2 || new Set(options.map(option => option.toLowerCase())).size !== options.length)) throw new Error('Add at least two different poll options.');
        checkMessage([payload.title, payload.body, payload.seo_description, ...options].filter(Boolean).join(' '));
        if (apiEnabled) {
            const apiPayload = new FormData();
            Object.entries(payload).filter(([key]) => key !== 'options').forEach(([key, value]) => apiPayload.append(key, value));
            if (type === 'poll') options.forEach((option) => apiPayload.append('options[]', option));
            if (hasImage) apiPayload.append('image', imageFile);
            if (hasLogo) apiPayload.append('logo', logoFile);
            const result = await apiRequest('/api/posts', 'POST', apiPayload);
            state.posts.unshift(normalizePost(result.post));
        } else {
            if (hasImage && imageFile.size > 1200000) throw new Error('Preview images must be smaller than 1.2 MB.');
            if (hasLogo && logoFile.size > 1200000) throw new Error('Preview logos must be smaller than 1.2 MB.');
            const imageUrl = hasImage ? await readFileAsDataUrl(imageFile) : null;
            const logoUrl = hasLogo && logoFile.type !== 'image/svg+xml' ? await readFileAsDataUrl(logoFile) : null;
            const post = normalizePost({
                id: `local-${Date.now()}`,
                type,
                brand: payload.brand_slug ? {slug: payload.brand_slug, status: 'pending'} : null,
                title: payload.title,
                body: payload.body,
                category: payload.category,
                seoDescription: payload.seo_description || '',
                launchCategory: payload.launch_category,
                projectUrl: payload.project_url,
                modelProvider: payload.model_provider,
                modelAccess: payload.model_access,
                imageUrl,
                logoUrl,
                upvotes: 0,
                downvotes: 0,
                launchVote: null,
                authorName: state.currentUser.name,
                author: { id: state.currentUser.id, name: state.currentUser.name, username: state.currentUser.username, profession: state.currentUser.profession, avatarUrl: state.currentUser.avatarUrl },
                role: state.currentUser.profession || 'Member',
                createdAt: 'just now',
                likes: 0,
                liked: false,
                commentsCount: 0,
                tags: payload.category ? [payload.category] : [],
                options: type === 'poll' ? options : [],
                votes: type === 'poll' ? options.map(() => 0) : [],
                votedOption: null,
            });
            state.posts.unshift(post);
        }
        state.page = type === 'launch' ? 'launches' : 'feed';
        if (type === 'launch') state.rankingsLoaded = false;
        state.initialPostId = null;
        state.profileUsername = null;
        state.filter = type;
        state.tag = '';
        state.search = '';
        state.modal = null;
        window.history.pushState({}, '', type === 'launch' ? '/launches' : '/feed');
        persistDemo();
        renderApp();
        window.scrollTo({ top: 0, behavior: 'instant' });
        showToast(type === 'launch' ? 'Launch published!' : type === 'poll' ? 'Poll posted!' : 'Posted!');
    } catch (error) {
        showMessage(form, error.message);
    } finally {
        delete form.dataset.saving;
        if (submit.isConnected) {
            submit.disabled = false;
            submit.classList.remove('is-loading');
        }
    }
}

function findPostById(postId) {
    const allPosts = [...state.posts, ...(state.profileData?.posts || [])];
    return allPosts.find((item) => item.id === String(postId))
        || allPosts.find((item) => item.sourcePost?.id === String(postId))?.sourcePost
        || null;
}

function updatePostCopies(id, values) {
    for (const post of [...state.posts, ...(state.profileData?.posts || [])]) {
        if (String(post.id) === String(id)) Object.assign(post, values);
        if (String(post.sourcePost?.id) === String(id)) Object.assign(post.sourcePost, values);
    }
}
function setReactionBusy(id, busy, kind = 'react') {
    root.querySelectorAll(`[data-action="${kind}"]`).forEach(button => {
        if (button.dataset.postId === String(id)) {
            button.disabled = busy;
            button.setAttribute('aria-busy', String(busy));
        }
    });
}
function refreshReactionViews(post) {
    // Only replace reaction controls: comment drafts, images and focus stay intact.
    root.querySelectorAll('.post-reactions').forEach(group => {
        if (group.querySelector('[data-post-id]')?.dataset.postId !== String(post.id)) return;
        const focused = group.contains(document.activeElement) ? document.activeElement : null;
        const action = focused?.dataset.action;
        const reaction = focused?.dataset.reaction;
        const template = document.createElement('template'); template.innerHTML = renderReactions(post);
        const next = template.content.firstElementChild;
        group.replaceWith(next);
        if (action) next.querySelector(reaction ? `[data-reaction="${reaction}"]` : `[data-action="${action}"]`)?.focus({preventScroll:true});
    });
    renderedRegions.delete('page-content');
    // A later card reconciliation must not mistake the original markup for current state.
    root.querySelectorAll('.post-card').forEach(card => { if (card.querySelector(`[data-action="react"]`)?.dataset.postId === String(post.id)) delete card.renderedHTML; });
}

function refreshPostView() {
    if (state.page === 'feed') {
        renderFeed();
        return;
    }
    const main = root.querySelector('.route-main');
    if (main) patchRegion('page-content', renderPageContent());
}

async function vote(postId, optionIndex) {
    if (!state.currentUser) {
        openAuth('register');
        return;
    }
    const post = findPostById(postId);
    if (!post || post.votedOption !== null && post.votedOption !== undefined) return;
    try {
        if (apiEnabled) {
            const result = await apiRequest(`/api/posts/${encodeURIComponent(postId)}/vote`, 'POST', { option_index: Number(optionIndex) });
            post.votes = result.votes;
            post.votedOption = result.votedOption;
        } else {
            post.votes = post.options.map((_, index) => Number(post.votes?.[index] || 0));
            post.votes[Number(optionIndex)] += 1;
            post.votedOption = Number(optionIndex);
        }
        persistDemo();
        refreshPostView();
    } catch (error) {
        showToast(error.message);
    }
}

async function voteLaunch(postId, value) {
    if (!state.currentUser) return openAuth('login');
    const voteValue = Number(value);
    if (![-1, 1].includes(voteValue) || state.pendingLaunchVotes.has(String(postId))) return;
    const post = findPostById(postId);
    const rankedPost = state.rankings?.tools?.find((item) => String(item.id) === String(postId));
    if (!post && !rankedPost) return;
    state.pendingLaunchVotes.add(String(postId));
    try {
        const result = apiEnabled
            ? await apiRequest(`/api/launches/${encodeURIComponent(postId)}/vote`, 'POST', { vote: voteValue })
            : (() => {
                const target = post || rankedPost;
                const selected = Number(target.launchVote) === voteValue ? null : voteValue;
                target.upvotes = Math.max(0, Number(target.upvotes || 0) + (selected === 1 ? 1 : target.launchVote === 1 ? -1 : 0));
                target.downvotes = Math.max(0, Number(target.downvotes || 0) + (selected === -1 ? 1 : target.launchVote === -1 ? -1 : 0));
                target.launchVote = selected;
                return { upvotes: target.upvotes, downvotes: target.downvotes, launchVote: selected };
            })();
        [post, rankedPost].filter(Boolean).forEach((target) => {
            target.upvotes = Number(result.upvotes);
            target.downvotes = Number(result.downvotes);
            target.launchVote = result.launchVote;
        });
        persistDemo();
        refreshPostView();
    } catch (error) {
        showToast(error.message);
    } finally { state.pendingLaunchVotes.delete(String(postId)); }
}

async function toggleLike(postId) {
    if (!state.currentUser) return openAuth('register');
    const post = findPostById(postId);
    if (!post || state.pendingLikes.has(String(postId))) return;
    state.pendingLikes.add(String(postId)); setReactionBusy(postId, true, 'like');
    try {
        const result = apiEnabled ? await apiRequest(`/api/posts/${encodeURIComponent(postId)}/like`, 'POST', {}) : {liked:!post.liked, likes:Math.max(0, Number(post.likes || 0) + (post.liked ? -1 : 1))};
        updatePostCopies(postId, {liked:result.liked, likes:Number(result.likes)});
        persistDemo(); refreshReactionViews(post);
    } catch (error) { showToast(error.message); }
    finally { state.pendingLikes.delete(String(postId)); setReactionBusy(postId, false, 'like'); }
}

async function reactToPost(postId, reaction) {
    if (!state.currentUser) return openAuth('register');
    const post = findPostById(postId);
    if (!post || !REACTIONS.some(item=>item.key===reaction) || state.pendingReactions.has(String(postId))) return;
    state.pendingReactions.add(String(postId)); setReactionBusy(postId, true);
    try {
        let result;
        if (apiEnabled) result = await apiRequest(`/api/posts/${encodeURIComponent(postId)}/react`, 'POST', { reaction });
        else {
            const counts = {...post.reactions};
            if (post.myReaction) counts[post.myReaction] = Math.max(0, Number(counts[post.myReaction] || 0) - 1);
            const selected = post.myReaction === reaction ? null : reaction;
            if (selected) counts[selected] = Number(counts[selected] || 0) + 1;
            result = {reactions:counts, myReaction:selected};
        }
        updatePostCopies(postId, {reactions:result.reactions, myReaction:result.myReaction});
        persistDemo(); refreshReactionViews(post);
    } catch (error) { showToast(error.message); }
    finally { state.pendingReactions.delete(String(postId)); setReactionBusy(postId, false); }
}

async function repostPost(postId) {
    if (!state.currentUser) return openAuth('register');
    const original = findPostById(postId);
    if (!original) return;
    try {
        if (apiEnabled) {
            const result = await apiRequest(`/api/posts/${encodeURIComponent(postId)}/repost`, 'POST', {});
            state.posts.unshift(normalizePost(result.post));
        } else {
            const source = original.type === 'repost' ? original.sourcePost : original;
            if (!source) return;
            state.posts.unshift(normalizePost({
                id: `local-${Date.now()}`,
                type: 'repost',
                body: '',
                authorName: state.currentUser.name,
                author: { id: state.currentUser.id, name: state.currentUser.name, username: state.currentUser.username, avatarUrl: state.currentUser.avatarUrl },
                sourcePost: source,
                createdAt: 'just now',
            }));
        }
        if (state.page !== 'feed') {
            state.page = 'feed';
            state.initialPostId = null;
            window.history.pushState({}, '', '/feed');
        }
        state.filter = 'all';
        state.tag = '';
        persistDemo();
        renderApp();
        showToast('Reposted.');
    } catch (error) {
        showToast(error.message);
    }
}

async function submitComment(form) {
    const postId = String(form.dataset.postId);
    const body = String(new FormData(form).get('body') || '').trim();
    if (!body) return;
    const post = findPostById(postId);
    if (!post) return;
    try {
        checkMessage(body);
        if (apiEnabled) {
            const result = await apiRequest(`/api/posts/${encodeURIComponent(postId)}/comments`, 'POST', { body });
            post.commentsCount = result.comments;
            post.latestComment = result.comment;
        } else {
            post.commentsCount = Number(post.commentsCount || 0) + 1;
            post.latestComment = { authorName: state.currentUser.name, body };
        }
        state.commentingId = null;
        persistDemo();
        refreshPostView();
        showToast('Reply posted.');
    } catch (error) {
        showToast(error.message);
    }
}

async function submitProfile(form) {
    const formData = new FormData(form);
    const avatarFile = formData.get('avatar');
    const hasAvatar = avatarFile instanceof File && avatarFile.size > 0;
    if (form.dataset.saving) return;
    form.dataset.saving = 'true';
    const buttons = [...form.querySelectorAll('[type="submit"]')];
    buttons.forEach(button => { button.disabled = true; });
    try {
        if (hasAvatar) { const error = validateUpload(avatarFile, 'avatar', apiEnabled); if (error) throw new Error(error); }
        const skills = [...new Set(String(formData.get('skills') || '').split(',').map((skill) => skill.trim()).filter(Boolean))];
        if (skills.length > 12) throw new Error('Choose up to twelve skills.');
        if (skills.some(skill => skill.length > 32)) throw new Error('Each skill must be 32 characters or fewer.');
        const avatarChoice = String(formData.get('avatar_choice') || state.currentUser.avatarChoice || 'neutral');
        const coverChoice = String(formData.get('cover_choice') || state.currentUser.coverChoice || 'aurora');
        const values = {
            name: String(formData.get('name') || '').trim(),
            username: String(formData.get('username') || '').trim().toLowerCase(),
            bio: String(formData.get('bio') || '').trim(),
            profession: String(formData.get('profession') || '').trim(),
            skills,
            website: String(formData.get('website') || '').trim(),
        };
        if (apiEnabled) {
            const payload = new FormData();
            Object.entries(values).filter(([key]) => key !== 'skills').forEach(([key, value]) => payload.append(key, value));
            skills.forEach((skill) => payload.append('skills[]', skill));
            payload.append('avatar_choice', avatarChoice);
            payload.append('cover_choice', coverChoice);
            if (hasAvatar) payload.append('avatar', avatarFile);
            payload.append('_method', 'PUT');
            const result = await apiRequest('/api/profile', 'POST', payload);
            state.currentUser = { ...state.currentUser, ...result.user };
        } else {
            if (hasAvatar && avatarFile.size > 1200000) throw new Error('Preview images must be smaller than 1.2 MB.');
            const uploadedAvatar = hasAvatar ? await readFileAsDataUrl(avatarFile) : null;
            const keepPhoto = avatarChoice === 'keep' && !hasAvatar;
            const chosenAvatar = avatarChoice === 'keep' ? (state.currentUser.avatarChoice || 'neutral') : avatarChoice;
            state.currentUser = {
                ...state.currentUser,
                ...values,
                avatarChoice: chosenAvatar,
                coverChoice,
                avatarUploaded: hasAvatar || (keepPhoto && state.currentUser.avatarUploaded),
                avatarUrl: uploadedAvatar || (keepPhoto ? state.currentUser.avatarUrl : avatarPath(chosenAvatar)),
            };
            writeStorage(STORAGE.user, state.currentUser);
        }
        state.profileUsername = state.currentUser.username;
        state.profileData = apiEnabled ? null : previewProfile(state.currentUser.username);
        state.profileLoadedFor = apiEnabled ? null : state.currentUser.username;
        state.profileLoading = false;
        state.modal = null;
        state.page = 'profile';
        window.history.pushState({}, '', `/u/${encodeURIComponent(state.currentUser.username)}`);
        persistDemo();
        renderApp();
        showToast('Profile updated.');
    } catch (error) {
        showMessage(form, error.message);
    } finally {
        delete form.dataset.saving;
        buttons.forEach(button => { button.disabled = false; });
    }
}

async function submitReport(form) {
    const postId = String(form.dataset.postId || state.reportPostId || '');
    const formData = new FormData(form);
    const payload = {
        reason: String(formData.get('reason') || ''),
        details: String(formData.get('details') || '').trim(),
    };
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
        if (apiEnabled) await apiRequest(`/api/posts/${encodeURIComponent(postId)}/report`, 'POST', payload);
        state.modal = null;
        state.reportPostId = null;
        renderApp();
        showToast('Report sent.');
    } catch (error) {
        showMessage(form, error.message);
    } finally {
        if (submit.isConnected) submit.disabled = false;
    }
}

async function submitMessage(form) {
    const userId = String(form.dataset.userId || '');
    const body = String(new FormData(form).get('body') || '').trim();
    const viewer = state.currentUser?.id;
    if (!body || !userId || !viewer || state.sendingMessage) return;
    state.sendingMessage = true;
    state.threadRequest++;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    showMessageError('direct', '');
    try {
        if (state.messagingBlocked || blockedByMe(userId)) throw new Error('Messaging is blocked.');
        if (body.length > 2000) throw new Error('Keep messages under 2,000 characters.');
        checkMessage(body);
        const message = apiEnabled ? (await apiRequest(`/api/messages/${encodeURIComponent(userId)}`, 'POST', {body})).message : {id: `local-${Date.now()}`, body, sender: {...state.currentUser}, sentByMe: true, createdAt: 'just now'};
        if (state.currentUser?.id !== viewer) return;
        state.messageDrafts[userId] = '';
        if (String(state.selectedMessageUser) === userId) {
            state.messages.push(message);
            if (!apiEnabled) saveDemoThread();
            state.conversationsLoaded = false;
            renderApp();
            document.querySelector('#message-body')?.focus();
        }
    } catch (error) { if (state.currentUser?.id === viewer && String(state.selectedMessageUser) === userId) showMessageError('direct', error.message); }
    finally { state.sendingMessage = false; if (submit.isConnected) submit.disabled = false; }
}


async function submitCommunityChat(form) {
    const body = String(new FormData(form).get('body') || '').trim();
    const viewer = state.currentUser?.id;
    if (!body || !viewer || state.sendingChat) return;
    state.sendingChat = true;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    showMessageError('community', '');
    try {
        if (body.length > 500) throw new Error('Keep community messages under 500 characters.');
        checkMessage(body);
        const message = apiEnabled ? (await apiRequest('/api/community-chat', 'POST', {body})).message : {id: `local-${Date.now()}`, body, createdAt: 'just now', sentByMe: true, user: {...state.currentUser}};
        if (state.currentUser?.id !== viewer) return;
        state.groupMessages.push(message);
        state.groupMessages = state.groupMessages.slice(-80);
        if (!apiEnabled) writeStorage('vibedock-preview-chat', state.groupMessages);
        state.chatDraft = '';
        state.groupChatLoaded = true;
        renderApp();
        document.querySelector('#community-chat-message')?.focus();
    } catch (error) { if (state.currentUser?.id === viewer) showMessageError('community', error.message); }
    finally { state.sendingChat = false; if (submit.isConnected) submit.disabled = false; }
}

function refreshProfileAfterAction() {
    state.profileData = null;
    state.profileLoadedFor = null;
    state.profileLoading = false;
    state.friendRequestsLoaded = false;
    if (state.page === 'profile' && state.profileUsername) void loadProfile(state.profileUsername);
}

async function toggleFollow(userId) {
    if (!state.currentUser) return openAuth('register');
    try {
        if (apiEnabled) {
            await apiRequest(`/api/users/${encodeURIComponent(userId)}/follow`, 'POST', {});
        } else if (state.profileData) {
            state.profileData.relationship.isFollowing = !state.profileData.relationship.isFollowing;
            state.profileData.user.followersCount = Math.max(0, Number(state.profileData.user.followersCount || 0) + (state.profileData.relationship.isFollowing ? 1 : -1));
        }
        if (apiEnabled) refreshProfileAfterAction();
        else renderApp();
    } catch (error) {
        showToast(error.message);
    }
}

async function sendFriendRequest(userId) {
    if (!state.currentUser) return openAuth('register');
    try {
        const result = apiEnabled ? await apiRequest(`/api/users/${encodeURIComponent(userId)}/friend-request`, 'POST', {}) : { status: 'pending', direction: 'outgoing' };
        if (state.profileData) {
            state.profileData.relationship.friendRequestDirection = result.direction || 'outgoing';
            state.profileData.relationship.friendRequestId = result.friendRequestId || 'preview-request';
        }
        if (apiEnabled) refreshProfileAfterAction();
        else renderApp();
        showToast('Request sent.');
    } catch (error) {
        showToast(error.message);
    }
}

async function respondFriendRequest(requestId, response) {
    try {
        if (apiEnabled) await apiRequest(`/api/friend-requests/${encodeURIComponent(requestId)}/respond`, 'POST', { response });
        state.friendRequests = state.friendRequests.filter((request) => String(request.id) !== String(requestId));
        state.friendRequestsLoaded = true;
        refreshProfileAfterAction();
        if (response === 'accept') {
            state.conversationsLoaded = false;
            showToast('Friend request accepted.');
        } else {
            showToast('Request declined.');
        }
        if (state.page === 'messages') renderApp();
    } catch (error) {
        showToast(error.message);
    }
}

async function removeFriend(userId) {
    if (!window.confirm('Remove this friend?')) return;
    try {
        if (apiEnabled) await apiRequest(`/api/users/${encodeURIComponent(userId)}/friendship`, 'DELETE');
        if (state.profileData) {
            state.profileData.relationship.isFriend = false;
            state.profileData.user.friendsCount = Math.max(0, Number(state.profileData.user.friendsCount || 0) - 1);
        }
        renderApp();
        showToast('Friend removed.');
    } catch (error) {
        showToast(error.message);
    }
}

async function logout() {
    if (apiEnabled) {
        try {
            const result = await apiRequest('/logout', 'POST', {});
            const csrf = document.querySelector('meta[name="csrf-token"]');
            if (csrf && result.csrfToken) csrf.content = result.csrfToken;
        } catch (error) {
            showToast(error.message);
            return;
        }
    }
    state.safetyLoadedFor = null;
    state.blockedUsers = []; state.reportedMessages = []; state.messageDrafts = {}; state.chatDraft = '';
    state.messagePeer = null; state.selectedMessageUser = null; state.threadRequest++;
    state.feedLoaded = !apiEnabled; state.rankingsLoaded = false; state.rankings = null;
    state.currentUser = null;
    state.commentingId = null;
    state.conversations = [];
    state.messages = [];
    state.conversationsLoaded = true;
    state.friendRequests = [];
    state.page = 'home';
    state.profileUsername = null;
    state.profileData = null;
    state.initialPostId = null;
    window.history.pushState({}, '', '/');
    persistDemo();
    renderApp();
    showToast('Signed out.');
}

async function sharePost(postId) {
    const link = `${window.location.origin}/posts/${encodeURIComponent(postId)}`;
    if (navigator.share) {
        try {
            await navigator.share({ url: link });
            return;
        } catch {
            // Fall through to clipboard.
        }
    }
    try {
        await navigator.clipboard.writeText(link);
        showToast('Link copied.');
    } catch {
        showToast(link);
    }
}

/* ------------------------------------------------------------------ */
/* Event handling                                                      */
/* ------------------------------------------------------------------ */

root.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) {
        if (event.target.classList.contains('modal-backdrop')) closeModal();
        return;
    }
    const action = target.dataset.action;
    if (action === 'toggle-search') {
        state.mobileSearch = !state.mobileSearch;
        const header = document.querySelector('.site-header');
        if (header) { header.outerHTML = renderHeader(); renderedRegions.delete('header-region'); }
        document.querySelector(state.mobileSearch ? '[data-search]' : '[data-action="toggle-search"]')?.focus();
        return;
    }
    if (action === 'new-message') {
        if (!state.currentUser) return openAuth('login');
        state.memberResults = [...new Map(state.posts.filter(post => post.author?.id).map(post => [post.author.id, post.author])).values()];
        state.modal = 'new-message'; renderApp(); return;
    }
    if (action === 'inbox-back') { state.messagePeer = null; state.selectedMessageUser = null; state.threadRequest++; renderApp(); return; }
    if (action === 'blocked-members') { state.modal = 'blocked-members'; renderApp(); return; }
    if (action === 'block-member') {
        const user = findMember(target.dataset.userId);
        if (!user) return;
        if (blockedByMe(user.id)) {
            try { await setMemberBlock(user, false); renderApp(); showToast('Member unblocked.'); } catch (error) { showToast(error.message); }
        } else { state.safetyUser = user; state.modal = 'block-member'; renderApp(); }
        return;
    }
    if (action === 'confirm-block' || action === 'unblock-member') {
        target.disabled = true;
        try { await setMemberBlock(findMember(target.dataset.userId), action === 'confirm-block'); if (action === 'confirm-block') state.modal = null; renderApp(); showToast(action === 'confirm-block' ? 'Member blocked.' : 'Member unblocked.'); }
        catch (error) { showToast(error.message); target.disabled = false; }
        return;
    }
    if (action === 'report-message') {
        const type = target.dataset.messageType;
        const message = (type === 'community' ? state.groupMessages : state.messages).find(item => String(item.id) === target.dataset.messageId);
        const user = type === 'community' ? message?.user : message?.sender || state.messagePeer;
        if (!message || !user || String(user.id) === String(state.currentUser?.id)) return;
        state.messageReport = {type, id: message.id, user}; state.modal = 'message-report'; renderApp(); return;
    }
    if (action === 'toggle-skill') {
        const form = target.closest('form'); const input = form.querySelector('[name="skills"]');
        let skills = [...new Set(input.value.split(',').map(item => item.trim()).filter(Boolean))];
        const name = target.dataset.skill;
        if (skills.some(item => item.toLowerCase() === name.toLowerCase())) skills = skills.filter(item => item.toLowerCase() !== name.toLowerCase());
        else if (skills.length >= 12) { form.querySelector('.skill-status').textContent = 'Choose up to 12 skills. Remove one to add another.'; return; }
        else skills.push(name);
        input.value = skills.join(', '); syncSkillPicker(form); return;
    }
    if (action === 'clear-upload') {
        const input = target.closest('[data-upload]').querySelector('input[type="file"]');
        input.value = ''; syncUpload(input);
        if (input.name === 'avatar') {
            const form = input.closest('form');
            const choice = form.querySelector('[name="avatar_choice"]:checked')?.value;
            form.querySelector('.settings-avatar').src = !choice || choice === 'keep' ? (avatarAsset(state.currentUser.avatarUrl)?.large || state.currentUser.avatarUrl) : avatarPath(choice, 'large');
        }
        input.focus();
        return;
    }
    if (action === 'avatar-group') { selectAvatarGroup(target.closest('.avatar-picker'), target.dataset.group); return; }
    if (action === 'expand-avatars' || action === 'expand-skills') {
        const expanded = target.getAttribute('aria-expanded') !== 'true';
        target.setAttribute('aria-expanded', String(expanded));
        const fieldset = target.closest('fieldset');
        if (action === 'expand-avatars') {
            const panel = target.closest('[data-avatar-group]');
            panel.querySelectorAll('[data-avatar-index]').forEach(choice => { choice.hidden = !expanded && Number(choice.dataset.avatarIndex) >= 8 && !choice.querySelector('input').checked; });
            hydrateAvatarGroup(panel);
            target.textContent = expanded ? 'Show fewer characters' : 'Meet all 12 characters';
        } else {
            fieldset.querySelectorAll('[data-skill-index]').forEach(choice => { choice.hidden = !expanded && Number(choice.dataset.skillIndex) >= 16 && choice.getAttribute('aria-pressed') !== 'true'; });
            target.textContent = expanded ? 'Show fewer skills' : `Browse all ${SKILLS.length} skills`;
        }
        return;
    }
    if (action === 'reload-rankings') return loadRankings();
    if (action === 'reload-feed') { state.feedError = ''; if (state.initialPostId) return loadSinglePost(state.initialPostId); state.feedLoaded = false; return loadServerFeed(); }
    if (action === 'go-page') {
        event.preventDefault();
        return navigateTo(target.dataset.page || 'home');
    }
    if (action === 'open-profile') {
        event.preventDefault();
        state.search = '';
        const searchInput = document.querySelector('[data-search]');
        if (searchInput) searchInput.value = '';
        closeSearchDropdown();
        return navigateTo('profile', target.dataset.username);
    }
    if (action === 'open-post') {
        event.preventDefault();
        state.search = '';
        closeSearchDropdown();
        state.page = 'feed';
        state.profileUsername = null;
        state.mobileSearch = false;
        state.initialPostId = String(target.dataset.postId || '');
        state.filter = 'all'; state.tag = '';
        window.history.pushState({}, '', `/posts/${encodeURIComponent(state.initialPostId)}`);
        renderApp();
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
    }
    if (action === 'open-my-profile') return navigateTo('profile', state.currentUser?.username);
    if (action === 'edit-profile') return navigateTo('profile-edit');
    if (action === 'view-friend-requests') {
        state.friendRequestsLoaded = false;
        state.conversationsLoaded = false;
        return navigateTo('messages');
    }
    if (action === 'open-message-thread') return openMessageThread(target.dataset.userId);
    if (action === 'start-message') {
        const user = state.profileData?.user || state.conversations.find((item) => String(item.user.id) === String(target.dataset.userId))?.user;
        return openMessageThread(user || target.dataset.userId);
    }
    if (action === 'toggle-follow') return toggleFollow(target.dataset.userId);
    if (action === 'send-friend-request') return sendFriendRequest(target.dataset.userId);
    if (action === 'respond-friend') return respondFriendRequest(target.dataset.requestId, target.dataset.response);
    if (action === 'remove-friend') return removeFriend(target.dataset.userId);
    if (action === 'report-post') {
        state.reportPostId = target.dataset.postId;
        state.menuPostId = null;
        state.modal = 'report';
        return renderApp();
    }
    if (action === 'backdrop-close') {
        if (event.target === target) closeModal();
        return;
    }
    if (action === 'close-modal') return closeModal();
    if (action === 'open-auth') return openAuth(target.dataset.mode || 'register');
    if (action === 'fill-demo-account') {
        const admin = target.dataset.demoAccount === 'admin';
        state.authMode = 'login';
        state.modal = 'auth';
        renderApp();
        window.requestAnimationFrame(() => {
            const form = root.querySelector('form[data-form="auth"]');
            if (!form) return;
            form.elements.email.value = admin ? 'admin@vibedock.test' : 'demo@vibedock.test';
            form.elements.password.value = admin ? 'VibeDockAdmin2026!' : 'VibeDockDemo2026!';
            form.elements.password.focus();
        });
        return;
    }
    if (action === 'auth-mode') {
        state.authMode = target.dataset.mode || 'register';
        return renderApp();
    }
    if (action === 'demo-social') return showToast('Social sign-in needs a configured live server. Use the demo account below.');
    if (action === 'open-compose') return openCompose(target.dataset.type || 'discussion');
    if (action === 'add-option') {
        const fields = root.querySelector('.poll-option-fields');
        if (fields && fields.querySelectorAll('input').length < 5) {
            const number = fields.querySelectorAll('input').length + 1;
            fields.insertAdjacentHTML('beforeend', `<label class="sr-only" for="poll-option-${number}">Option ${number}</label><input id="poll-option-${number}" name="options[]" maxlength="80" placeholder="Option ${number}" required>`);
            fields.querySelector(`#poll-option-${number}`)?.focus();
        }
        if (root.querySelectorAll('.poll-option-fields input').length >= 5) target.hidden = true;
        return;
    }
    if (action === 'filter') return setFilter(target.dataset.filter || 'all');
    if (action === 'tag') {
        if (state.page !== 'feed') {
            state.page = 'feed';
            window.history.pushState({}, '', '/feed');
        }
        state.filter = 'all';
        state.initialPostId = null;
        state.tag = target.dataset.tag || '';
        renderHeaderAndFeedState();
        return;
    }
    if (action === 'clear-filter') {
        if (state.page !== 'feed') {
            state.page = 'feed';
            window.history.pushState({}, '', '/feed');
        }
        state.initialPostId = null;
        state.filter = 'all';
        state.tag = '';
        state.search = '';
        const search = document.querySelector('[data-search]');
        if (search) search.value = '';
        renderHeaderAndFeedState();
        return;
    }
    if (action === 'toggle-menu') {
        state.mobileMenu = !state.mobileMenu;
        const header = document.querySelector('.site-header');
        if (header) { header.outerHTML = renderHeader(); renderedRegions.delete('header-region'); }
        return;
    }
    if (action === 'post-menu') {
        state.menuPostId = state.menuPostId === target.dataset.postId ? null : target.dataset.postId;
        refreshPostView();
        return;
    }
    if (action === 'save-post') {
        const postId = String(target.dataset.postId);
        const wasSaved = state.savedIds.includes(postId);
        state.savedIds = wasSaved ? state.savedIds.filter((id) => id !== postId) : [...state.savedIds, postId];
        state.menuPostId = null;
        persistDemo();
        refreshPostView();
        showToast(wasSaved ? 'Removed from saved.' : 'Saved.');
        return;
    }
    if (action === 'random-avatar') {
        const form = target.closest('form');
        if (!form) return;
        const current = form.querySelector('input[name="avatar_choice"]:checked')?.value;
        const pool = AVATAR_CHOICES.filter(choice => choice.group === form.querySelector('.avatar-picker').dataset.activeAvatarGroup).map(choice => choice.key).filter(key => key !== current);
        const pick = pool[Math.floor(Math.random() * pool.length)];
        const input = form.querySelector(`input[name="avatar_choice"][value="${pick}"]`);
        if (input) {
            input.checked = true;
            input.dispatchEvent(new Event('change', {bubbles:true}));
            form.querySelectorAll('.avatar-choice').forEach((element) => element.classList.toggle('is-selected', element.contains(input)));
            if (input.closest('.avatar-choice')) input.closest('.avatar-choice').hidden = false;
            hydrateAvatarGroup(input.closest('[data-avatar-group]'));
            input.closest('.avatar-choice')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        return;
    }
    if (action === 'like') return toggleLike(target.dataset.postId);
    if (action === 'react') return reactToPost(target.dataset.postId, target.dataset.reaction);
    if (action === 'repost') return repostPost(target.dataset.postId);
    if (action === 'vote') return vote(target.dataset.postId, target.dataset.optionIndex);
    if (action === 'launch-vote') return voteLaunch(target.dataset.postId, target.dataset.vote);
    if (action === 'comment-toggle') {
        if (!state.currentUser) return openAuth('register');
        state.commentingId = state.commentingId === target.dataset.postId ? null : target.dataset.postId;
        refreshPostView();
        if (state.commentingId) document.querySelector('.comment-form input')?.focus();
        return;
    }
    if (action === 'share') return sharePost(target.dataset.postId);
    if (action === 'demo-verify-brand' && !apiEnabled && state.currentUser?.isAdmin) {
        const post = state.posts.find(post=>post.id===target.dataset.postId);
        if (post?.brand) { post.brand.status = post.brand.status === 'verified' ? 'pending' : 'verified'; persistDemo(); renderApp(); showToast('Demo verification updated.'); }
        return;
    }
    if (action === 'admin-hide-post') {
        const post = findPostById(target.dataset.postId);
        if (!post || !state.currentUser?.isAdmin) return;
        post.isHidden = !post.isHidden;
        persistDemo();
        renderApp();
        showToast(post.isHidden ? 'Post hidden.' : 'Post restored.');
        return;
    }
    if (action === 'logout') return logout();
});

root.addEventListener('input', (event) => {
    if (event.target.closest('.launch-studio .compose-form')) {
        const title = root.querySelector('[data-launch-title]');
        const description = root.querySelector('[data-launch-description]');
        const domain = root.querySelector('[data-launch-domain]');
        const form = event.target.closest('form');
        if (title) title.textContent = form.elements.title.value || 'Your project name';
        if (description) description.textContent = form.elements.body.value.slice(0, 180) || 'Something worth sharing.';
        const url = safeUrl(form.elements.project_url.value);
        if (domain) domain.textContent = url ? new URL(url).hostname : 'your-project.com';
    }

    if (event.target.matches('.profile-settings-form input[name="name"]')) {
        const name = root.querySelector('[data-profile-name]'); if (name) name.textContent = event.target.value;
    }

    if (event.target.matches('[data-member-search]')) {
        clearTimeout(state.memberSearchTimer);
        const query = event.target.value;
        state.memberSearchSeq++;
        state.memberSearchTimer = setTimeout(() => void searchMessageMembers(query), 200);
    }
    if (event.target.matches('[data-skill-search]')) {
        const query = event.target.value.trim().toLowerCase();
        event.target.closest('fieldset').querySelectorAll('[data-skill]').forEach(button => { button.hidden = query ? !button.dataset.skill.toLowerCase().includes(query) : event.target.closest('fieldset').querySelector('[data-action="expand-skills"]').getAttribute('aria-expanded') !== 'true' && Number(button.dataset.skillIndex) >= 16 && button.getAttribute('aria-pressed') !== 'true'; });
        event.target.closest('fieldset').querySelector('[data-action="expand-skills"]').hidden = Boolean(query);
        event.target.closest('fieldset').querySelector('.skill-empty').hidden = Boolean(event.target.closest('fieldset').querySelector('[data-skill]:not([hidden])'));
    }
    if (event.target.matches('[name="skills"]')) syncSkillPicker(event.target.closest('form'));
    if (event.target.matches('#community-chat-message')) { showMessageError('community', ''); state.chatDraft = event.target.value; const counter = document.querySelector('[data-chat-count]'); if (counter) counter.textContent = `${state.chatDraft.length}/500`; }
    if (event.target.matches('#message-body')) { showMessageError('direct', ''); state.messageDrafts[state.selectedMessageUser] = event.target.value; }

    if (event.target.matches('[data-search]')) {
        state.search = event.target.value;
        scheduleSearch(state.search);
        if (state.page === 'feed') renderFeed();
    }
    if (event.target.matches('.thread-compose textarea, .community-chat-compose textarea')) {
        const field = event.target;
        field.style.height = 'auto';
        field.style.height = `${Math.min(field.scrollHeight, 140)}px`;
    }
});

root.addEventListener('change', (event) => {
    if (event.target.matches('[data-feed-filter]')) return setFilter(event.target.value);
    if (event.target.matches('[data-sort]')) {
        state.sort = event.target.value;
        renderFeed();
    }
    if (event.target.matches('.upload-input')) {
        const error = validateUpload(event.target.files?.[0], event.target.name, apiEnabled);
        if (error) { event.target.value = ''; showToast(error); }
        syncUpload(event.target);
    }
    if (event.target.matches('input[name="avatar_choice"]')) {
        const upload = event.target.closest('form').querySelector('[name="avatar"]');
        if (upload) { upload.value = ''; syncUpload(upload); }
        const image = document.querySelector('.settings-avatar');
        if (image) image.src = event.target.value === 'keep' ? (avatarAsset(state.currentUser.avatarUrl)?.large || state.currentUser.avatarUrl) : avatarPath(event.target.value, 'large');

        const form = event.target.closest('form');
        if (form) form.querySelectorAll('.avatar-choice').forEach((element) => element.classList.toggle('is-selected', element.contains(event.target)));
    }
    if (event.target.matches('input[name="avatar"]')) {
        const input = event.target;
        const file = input.files?.[0];
        if (!file) {
            const form = input.closest('form');
            const choice = form.querySelector('[name="avatar_choice"]:checked')?.value;
            form.querySelector('.settings-avatar').src = !choice || choice === 'keep' ? (avatarAsset(state.currentUser.avatarUrl)?.large || state.currentUser.avatarUrl) : avatarPath(choice, 'large');
            return;
        }
        void readFileAsDataUrl(file).then(url => {
            if (input.isConnected && input.files?.[0] === file) {
                const image = input.closest('form').querySelector('.settings-avatar');
                if (image) image.src = url;
            }
        }).catch(error => showToast(error.message));
    }
    if (event.target.matches('input[name="cover_choice"]')) {
        const cover = document.querySelector('.profile-preview-cover');
        if (cover) cover.className = `profile-preview-cover cover-${event.target.value}`;

        const form = event.target.closest('form');
        if (form) form.querySelectorAll('.cover-choice').forEach((element) => element.classList.toggle('is-selected', element.contains(event.target)));
    }
});

root.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!form.matches('form[data-form]')) return;
    event.preventDefault();
    if (form.dataset.form === 'demo-badge' && !apiEnabled && state.currentUser?.isAdmin) {
        const data = new FormData(form); const id = String(data.get('user')); const badge = String(data.get('badge'));
        if (!BADGES.some(item=>item.key===badge && item.source==='admin')) return;
        const awards = readStorage('vibedock-preview-badges', {});
        const keys = new Set(awards[id] || []);
        if (data.get('action') === 'award') keys.add(badge); else keys.delete(badge);
        awards[id] = [...keys]; writeStorage('vibedock-preview-badges', awards); showToast('Demo badge updated.'); return;
    }
    if (form.dataset.form === 'auth') await createAuth(form);
    if (form.dataset.form === 'compose') await createPost(form);
    if (form.dataset.form === 'comment') await submitComment(form);
    if (form.dataset.form === 'profile') await submitProfile(form);
    if (form.dataset.form === 'report') await submitReport(form);
    if (form.dataset.form === 'message') await submitMessage(form);
    if (form.dataset.form === 'message-report') await submitMessageReport(form);
    if (form.dataset.form === 'community-chat') await submitCommunityChat(form);
});

root.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && event.target.matches('.thread-compose textarea, .community-chat-compose textarea')) {
        event.preventDefault();
        event.target.closest('form')?.requestSubmit();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const reactions = document.querySelector('.message-actions[open]');
    if (reactions) {
        reactions.open = false;
        reactions.querySelector('summary')?.focus();
        return;
    }
    if (state.modal) {
        closeModal();
        return;
    }
    if (state.mobileSearch) {
        state.mobileSearch = false;
        const header = document.querySelector('.site-header');
        if (header) { header.outerHTML = renderHeader(); renderedRegions.delete('header-region'); }
        document.querySelector('[data-action="toggle-search"]')?.focus();
    }
    if (state.menuPostId) {
        state.menuPostId = null;
        refreshPostView();
    }
    closeSearchDropdown();
});

document.addEventListener('click', (event) => {
    document.querySelectorAll('.message-actions[open]').forEach((picker) => {
        if (!picker.contains(event.target)) picker.open = false;
    });
    if (state.menuPostId && !event.target.closest('.post-more-wrap')) {
        state.menuPostId = null;
        refreshPostView();
    }
    if (!event.target.closest('.nav-search, [data-action="toggle-search"]')) closeSearchDropdown();
});

window.addEventListener('popstate', () => {
    const parts = parseRoute(window.location.pathname);
    const page = pageForRoute(parts);
    if (state.page === 'profile' && page !== 'profile') {
        state.profileData = null;
        state.profileLoadedFor = null;
    }
    state.page = page;
    state.profileUsername = page === 'profile' ? parts[1] : null;
    state.initialPostId = parts[0] === 'posts' ? parts[1] : parts[0] === 'brands' ? state.posts.find(post => post.brand?.slug === parts[1])?.id || null : null;
    state.modal = null;
    state.mobileMenu = false;
    state.mobileSearch = false;
    if (page === 'messages') state.conversationsLoaded = false;
    renderApp();
});

renderApp();

root.addEventListener('error', event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || image.dataset.fallback) return;
    image.dataset.fallback = 'true';
    if (image.closest('.avatar') || image.classList.contains('settings-avatar')) { image.removeAttribute('srcset'); image.src = avatarPath('fluent-robot'); }
    else {
        const notice = document.createElement('span');
        notice.className = 'image-unavailable'; notice.setAttribute('role', 'img');
        notice.setAttribute('aria-label', image.alt || 'Image unavailable');
        notice.textContent = image.closest('.launch-brand-tile, .ranking-launch-logo') ? '↗' : 'Image unavailable';
        image.replaceWith(notice);
    }
}, true);
