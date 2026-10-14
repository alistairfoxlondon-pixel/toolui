import '../css/fonts.css';
import '../css/app.css';
import '../css/community-features.css';
import '../css/product-pages.css';
import { ICON_PATHS, ICON_PATHS_FILLED } from './icon-paths.js';
import { checkMessage } from './moderation.js';
import CHARACTER_AVATARS from '../data/character-avatars.json';
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

function icon(name, size = 22, className = '', filled = false) {
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
        author: { id: 'demo-mayachen', name: 'Maya Chen', username: 'mayachen', avatarUrl: '/avatars/pixel-fox.svg' },
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
        author: { id: 'demo-ravipatel', name: 'Ravi Patel', username: 'ravipatel', avatarUrl: '/avatars/captain-commit.svg' },
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
        author: { id: 'demo-priyar', name: 'Priya Rahman', username: 'priyar', avatarUrl: '/avatars/byte-bard.svg' },
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
        author: { id: 'demo-noahbuilds', name: 'Noah Williams', username: 'noahbuilds', avatarUrl: '/avatars/orbit-ollie.svg' },
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
        author: { id: 'demo-kena', name: 'Ken Alvarez', username: 'kenalvarez', avatarUrl: '/avatars/agent-loop.svg' },
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
        reactions: post.reactions || { celebrate: 0, helpful: 0, support: 0 },
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

const DEMO_MODELS = [
    {id:'claude', name:'Claude', provider:'Anthropic', description:'Rate your experience building and debugging with Claude.', websiteUrl:'https://claude.ai', isActive:true},
    {id:'gpt', name:'GPT', provider:'OpenAI', description:'Rate your experience turning prompts into working apps with GPT.', websiteUrl:'https://chatgpt.com', isActive:true},
    {id:'gemini', name:'Gemini', provider:'Google', description:'Rate your experience planning, coding, and iterating with Gemini.', websiteUrl:'https://gemini.google.com', isActive:true},
    {id:'deepseek', name:'DeepSeek', provider:'DeepSeek', description:'Rate your hands-on coding experience with DeepSeek.', websiteUrl:'https://www.deepseek.com', isActive:true},
];

const storedUser = apiEnabled ? null : readStorage(STORAGE.user);
const storedPosts = apiEnabled ? null : readStorage(STORAGE.posts);
const routeParts = decodeURIComponent(window.location.pathname).split('/').filter(Boolean);
const routePages = {
    feed: 'feed', posts: 'feed', settings: 'profile-edit',
    launches: 'launches', models: 'models', rankings: 'rankings', 'community-chat': 'community-chat',
    messages: 'messages', about: 'about', guidelines: 'guidelines', privacy: 'privacy',
    terms: 'terms', admin: 'admin', u: 'profile',
};
const pathPage = routePages[routeParts[0]] || 'home';

const state = {
    currentUser: config.currentUser || storedUser || null,
    page: config.initialPage || pathPage,
    profileUsername: config.profileUsername || (pathPage === 'profile' ? routeParts[1] : null),
    initialPostId: config.initialPostId || (routeParts[0] === 'posts' ? routeParts[1] : null),
    profileData: null,
    profileLoading: false,
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
    groupMessages: apiEnabled ? [] : readStorage('vibedock-preview-chat', [{ id: 1, body: 'Welcome to the community chat.', sentByMe: false, createdAt: 'today', user: { id: 'demo-mayachen', name: 'Maya Chen', username: 'mayachen', avatarUrl: '/avatars/female-rose.svg' } }]),
    groupChatLoaded: false,
    groupChatLoading: false,
    groupChatTimer: null,
    rankings: null,
    rankingsLoaded: false,
    messagePeer: null,
    messages: [],
    messagesLoading: false,
    friendRequests: [],
    friendRequestsLoaded: false,
    posts: (apiEnabled ? [] : (storedPosts || seedPosts)).filter(post => post.type !== 'model').map(normalizePost),
    feedLoaded: !apiEnabled, feedLoading: false, feedError: '',
    catalogue: apiEnabled ? [] : readStorage('vibedock-preview-models', DEMO_MODELS),
    catalogueLoaded: !apiEnabled, catalogueLoading: false, catalogueError: '',
    modelQuery: '', ratingPending: null, editingModel: null,
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
    modal: config.initialAuthMode ? 'auth' : null,
    authMode: config.initialAuthMode || 'register',
    flashMessage: config.flashMessage || '',
    composeType: 'discussion',
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
    const safeImage = imageUrl ? safeImageUrl(imageUrl) : '';
    return `<span class="avatar ${tone} ${extraClass}" aria-hidden="true">${safeImage ? `<img src="${escapeHtml(safeImage)}" alt="" loading="lazy">` : escapeHtml(initials(name))}</span>`;
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
        ['models', 'smart_toy', 'AI models'],
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
                <p>Build. Share. Find your people.</p>
                <div class="hero-actions">
                    <button class="btn btn-primary" ${state.currentUser ? 'data-action="open-compose" data-type="discussion"' : 'data-action="open-auth" data-mode="register"'}>${state.currentUser ? 'Share a build' : 'Join the community'} ${icon('arrow_forward', 19)}</button>
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
        <section class="landing-intro"><span class="section-kicker">A little less solo. A lot more possibility.</span><h2>Make something.<br>Make it <span>together.</span></h2></section>
        <section class="feature-grid" aria-label="What you can do on VibeDock">
            <article class="feature-card feature-launch"><div class="feature-copy"><span class="feature-number">01 / LAUNCH</span><h3>Your side project.<br>Its first supporters.</h3><p>Launch your app or website. Let the community try it.</p><a class="feature-link" href="/launches" data-action="go-page" data-page="launches">Explore launches ${icon('arrow_forward', 18)}</a></div><div class="feature-art launch-scene">${illustration('launch')}<span class="art-pill">${icon('code', 18)} Built by you</span><span class="art-vote">${icon('arrow_upward', 22)} Your next launch</span></div></article>
            <article class="feature-card feature-people"><div class="feature-copy"><span class="feature-number">02 / CONNECT</span><h3>Good people.<br>Better conversations.</h3><p>Find a fresh perspective in chat or a private conversation.</p><a class="feature-link" href="/community-chat" data-action="go-page" data-page="community-chat">Meet the community ${icon('arrow_forward', 18)}</a></div><div class="feature-art character-scene"><img src="/avatars/orbit-ollie.svg" alt="Original astronaut character" width="140" height="140" loading="lazy"><img src="/avatars/byte-bard.svg" alt="Original wizard character" width="120" height="120" loading="lazy"><img src="/avatars/disco-duck.svg" alt="Original duck character" width="100" height="100" loading="lazy">${illustration('conversation')}</div></article>
            <article class="feature-card feature-models"><div class="feature-copy"><span class="feature-number">03 / COMPARE</span><h3>Find your coding<br>copilot.</h3><p>Real member ratings. An admin-curated AI model catalogue.</p><a class="feature-link" href="/models" data-action="go-page" data-page="models">Compare AI models ${icon('arrow_forward', 18)}</a></div><div class="feature-art model-scene">${illustration('toolkit')}<div class="art-rating" aria-hidden="true">☆ ☆ ☆ ☆ ☆<span>Your experience counts</span></div></div></article>
            <article class="feature-card feature-feedback"><div class="feature-copy"><span class="feature-number">04 / LEARN</span><h3>Less guesswork.<br>More “aha”.</h3><p>Ask a question, share progress, or poll your fellow makers.</p><a class="feature-link" href="/feed" data-action="go-page" data-page="feed">Join the conversation ${icon('arrow_forward', 18)}</a></div><div class="feature-art feedback-scene">${illustration('maker')}<div class="art-poll"><span>What should I build next?</span><i></i><i></i><i></i></div></div></article>
        </section>
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
        <div class="composer-main">${avatar(state.currentUser?.name || 'You', state.currentUser ? toneFor(state.currentUser.name) : 'tone-neutral', 'avatar-composer')}<button class="composer-prompt" data-action="open-compose" data-type="discussion">Share what you're making…</button><button class="composer-open icon-button" aria-label="Start a post" data-action="open-compose" data-type="discussion">${icon('add', 20)}</button></div>
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
        <div class="launch-preview-info"><span class="launch-overline">${escapeHtml(category)}</span><strong>${escapeHtml(domain)}</strong></div>
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
    return `<form class="comment-form" data-form="comment" data-post-id="${escapeHtml(post.id)}">${avatar(state.currentUser?.name || 'You', toneFor(state.currentUser?.name || 'You'), 'avatar-mini')}<label class="visually-hidden" for="comment-${escapeHtml(post.id)}">Write a reply</label><input id="comment-${escapeHtml(post.id)}" name="body" maxlength="2000" placeholder="Write a reply…" required><button type="submit" aria-label="Post reply">${icon('send', 17)}</button></form>`;
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
    const reactions = actionPost.reactions || {};
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
            <div class="post-actions">
                <button class="post-action ${actionPost.liked ? 'is-liked' : ''}" data-action="like" data-post-id="${escapeHtml(actionPost.id)}" aria-pressed="${actionPost.liked ? 'true' : 'false'}" aria-label="Like">${icon('favorite', 20, '', actionPost.liked)}<span>${Number(actionPost.likes || 0) || ''}</span></button>
                <details class="reaction-picker"><summary class="post-action" aria-label="Add reaction" title="Add reaction">${icon('add_reaction', 21)}</summary><div class="reaction-options">
                <button class="post-action reaction-action ${actionPost.myReaction === 'celebrate' ? 'is-selected' : ''}" data-action="react" data-reaction="celebrate" data-post-id="${escapeHtml(actionPost.id)}" aria-pressed="${actionPost.myReaction === 'celebrate'}" aria-label="Celebrate" title="Celebrate">${icon('celebration', 20)}<span class="reaction-label">Celebrate</span><span>${Number(reactions.celebrate || 0) || ''}</span></button>
                <button class="post-action reaction-action ${actionPost.myReaction === 'helpful' ? 'is-selected' : ''}" data-action="react" data-reaction="helpful" data-post-id="${escapeHtml(actionPost.id)}" aria-pressed="${actionPost.myReaction === 'helpful'}" aria-label="Helpful" title="Helpful">${icon('check_circle', 20, '', actionPost.myReaction === 'helpful')}<span class="reaction-label">Helpful</span><span>${Number(reactions.helpful || 0) || ''}</span></button>
                <button class="post-action reaction-action ${actionPost.myReaction === 'support' ? 'is-selected' : ''}" data-action="react" data-reaction="support" data-post-id="${escapeHtml(actionPost.id)}" aria-pressed="${actionPost.myReaction === 'support'}" aria-label="Support" title="Support">${icon('group', 20)}<span class="reaction-label">Support</span><span>${Number(reactions.support || 0) || ''}</span></button>
                </div></details>
                <button class="post-action" data-action="comment-toggle" data-post-id="${escapeHtml(actionPost.id)}" aria-expanded="${state.commentingId === actionPost.id}" aria-label="Comment">${icon('comment', 20)}<span>${comments || ''}</span></button>
                <button class="post-action" data-action="repost" data-post-id="${escapeHtml(actionPost.id)}" aria-label="Repost" title="Repost">${icon('repeat', 20)}<span>${Number(actionPost.repostsCount || 0) || ''}</span></button>
                <button class="post-action share-action" data-action="share" data-post-id="${escapeHtml(post.id)}" aria-label="Share" title="Share">${icon('share', 19)}</button>
            </div>
        </div>
        ${state.commentingId === actionPost.id ? renderCommentForm(actionPost) : ''}
    </article>`;
}

function filteredPosts() {
    let posts = state.posts.filter((post) => !post.isHidden);
    if (state.initialPostId) posts = posts.filter((post) => post.id === String(state.initialPostId));
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
    list.innerHTML = posts.map(renderPost).join('');
    if (empty) empty.hidden = posts.length > 0;
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
        <button class="rail-card toolkit-card" data-action="go-page" data-page="models">
            ${illustration('toolkit')}<span>AI toolkit</span>${icon('arrow_forward', 18)}
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
            <div class="community-heading"><div><span class="section-kicker">Your people. Your progress.</span><h1>Community feed</h1></div></div>${state.feedError ? `<div class="feed-status" role="status">${escapeHtml(state.feedError)} <button data-action="reload-feed">Try again</button></div>` : state.feedLoading ? '<p class="feed-status" role="status">Loading conversations…</p>' : ''}
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
        <section class="launch-grid">${launches.length ? launches.map(renderPost).join('') : `<div class="route-empty compact">${icon('rocket_launch', 30)}<strong>No launches yet</strong><button class="btn btn-outline btn-small" data-action="open-compose" data-type="launch">Share a launch</button></div>`}</section>
    </main>`;
}

function catalogueModels() {
    if (apiEnabled) return state.catalogue;
    const ratings = readStorage('vibedock-preview-model-ratings', {});
    return state.catalogue.filter(model => model.isActive !== false).map(model => {
        const scores = Object.values(ratings).map(votes => Number(votes[model.id])).filter(score => score >= 1 && score <= 5);
        return {...model, ratingCount:scores.length, averageRating:scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : null, myRating:ratings[state.currentUser?.id]?.[model.id] || null};
    });
}
function renderModelsPage() {
    const models = catalogueModels().filter(model => `${model.name} ${model.provider}`.toLowerCase().includes(state.modelQuery.toLowerCase()))
        .sort((a,b) => (b.averageRating || 0)-(a.averageRating || 0) || b.ratingCount-a.ratingCount || a.name.localeCompare(b.name));
    return `<main class="route-main models-page"><section class="page-intro">${illustration('toolkit', 'page-art')}<div><span class="route-eyebrow">Community-rated · Admin-curated</span><h1>Which AI builds better?</h1><p>Rate the models you’ve actually used for vibe coding.</p></div>${state.currentUser?.isAdmin ? '<a class="btn btn-outline" href="/admin#models" data-action="go-page" data-page="admin">Manage catalogue</a>' : ''}</section>
        <div class="catalogue-toolbar"><label class="catalogue-search">${icon('search', 20)}<input type="search" data-model-search aria-label="Find an AI model" placeholder="Find a model or provider…" value="${escapeHtml(state.modelQuery)}"></label><span>Highest rated first · One rating per member</span></div>
        ${!apiEnabled ? '<p class="preview-note">Demo catalogue. Ratings are saved in this browser only.</p>' : ''}
        ${state.catalogueError ? `<div class="route-empty"><p>${escapeHtml(state.catalogueError)}</p><button class="btn btn-outline" data-action="reload-models">Try again</button></div>` : ''}
        <div class="catalogue-grid">${state.catalogueLoading ? '<div class="route-loading">Loading catalogue…</div>' : models.map(model => `<article class="catalogue-card"><div class="catalogue-card-top"><span class="catalogue-art">${illustration('toolkit')}</span><span class="catalogue-provider">${escapeHtml(model.provider)}</span></div><h2>${escapeHtml(model.name)}</h2><p>${escapeHtml(model.description)}</p><div class="model-score"><strong>${model.averageRating ? Number(model.averageRating).toFixed(1) : '—'}</strong><span>${model.ratingCount ? `${model.ratingCount} ${model.ratingCount === 1 ? 'rating' : 'ratings'}` : 'Not rated yet'}</span>${model.websiteUrl && safeUrl(model.websiteUrl) ? `<a href="${escapeHtml(safeUrl(model.websiteUrl))}" target="_blank" rel="noopener noreferrer" aria-label="Visit ${escapeHtml(model.name)}">${icon('open_in_new', 20)}</a>` : ''}</div><fieldset class="model-rating"><legend>${model.myRating ? `Your rating: ${model.myRating}/5` : 'How is it for vibe coding?'}</legend><div>${[1,2,3,4,5].map(score => `<button class="rating-star ${score <= (model.myRating || 0) ? 'is-selected' : ''}" data-action="rate-model" data-model-id="${escapeHtml(model.id)}" data-score="${score}" aria-label="Rate ${escapeHtml(model.name)} ${score} out of 5" aria-pressed="${model.myRating === score}" ${state.ratingPending === String(model.id) ? 'disabled' : ''}><svg viewBox="0 0 24 24" width="27" height="27" aria-hidden="true"><path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4L2.8 9.7l6.4-.9Z"/></svg></button>`).join('')}</div></fieldset></article>`).join('')}</div>
        ${!state.catalogueLoading && !models.length && !state.catalogueError ? `<div class="route-empty">${illustration('toolkit')}<h2>No models here yet</h2><p>${state.modelQuery ? 'Try another search.' : 'An administrator will add the catalogue.'}</p></div>` : ''}
    </main>`;
}
async function loadCatalogue() {
    if (!apiEnabled || state.catalogueLoading) return;
    state.catalogueLoading = true; state.catalogueLoaded = true; state.catalogueError = '';
    try { state.catalogue = (await apiRequest('/api/models')).data || []; }
    catch (error) { state.catalogueError = error.message; }
    finally { state.catalogueLoading = false; if (state.page === 'models') renderApp(); }
}
async function rateModel(id, score) {
    if (!state.currentUser) return openAuth('login');
    if (state.ratingPending || ![1,2,3,4,5].includes(score)) return;
    state.ratingPending = String(id); renderApp();
    try {
        if (apiEnabled) {
            const result = await apiRequest(`/api/models/${encodeURIComponent(id)}/rating`, 'PUT', {score});
            state.catalogue = state.catalogue.map(model => String(model.id) === String(id) ? result.model : model);
        } else {
            const ratings = readStorage('vibedock-preview-model-ratings', {});
            ratings[state.currentUser.id] = {...(ratings[state.currentUser.id] || {}), [id]:score};
            writeStorage('vibedock-preview-model-ratings', ratings);
        }
        showToast('Rating saved. You can change it anytime.');
    } catch (error) { showToast(error.message); }
    finally { state.ratingPending = null; renderApp(); }
}
function renderCatalogueAdmin() {
    const model = state.catalogue.find(item => String(item.id) === state.editingModel) || {};
    return `<section class="admin-preview-section catalogue-admin"><h2>AI model catalogue</h2><p>Admin-only demo controls. Production uses the protected Laravel admin area.</p><form class="model-admin-form" data-form="model-admin"><label class="field-label">Model name<input name="name" value="${escapeHtml(model.name || '')}" required maxlength="100"></label><label class="field-label">Provider<input name="provider" value="${escapeHtml(model.provider || '')}" required maxlength="80"></label><label class="field-label">Description<textarea name="description" required maxlength="500">${escapeHtml(model.description || '')}</textarea></label><label class="field-label">Official URL<input type="url" name="website_url" value="${escapeHtml(model.websiteUrl || '')}"></label><button class="btn btn-primary" type="submit">${model.id ? 'Save model' : 'Add model'}</button><div data-form-message class="form-message" hidden></div></form><div class="admin-model-list">${state.catalogue.map(item => `<div><strong>${escapeHtml(item.name)}</strong><span>${item.isActive === false ? 'Archived' : 'Published'}</span><button class="btn btn-outline btn-small" data-action="edit-catalogue-model" data-model-id="${escapeHtml(item.id)}">Edit</button><button class="btn btn-outline btn-small" data-action="archive-catalogue-model" data-model-id="${escapeHtml(item.id)}">${item.isActive === false ? 'Restore' : 'Archive'}</button></div>`).join('')}</div></section>`;
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
    const rankingData = state.rankings || localRankings();
    const tools = (rankingData.tools || []).map(normalizePost);
    const makers = rankingData.leaderboard || [];
    return `<main class="route-main rankings-page"><section class="page-intro">${illustration('launch', 'page-art')}<div><span class="route-eyebrow">Rankings</span><h1>What makers are building</h1><p>Discover the builds and people moving the community forward.</p></div></section><div class="rankings-grid"><section class="ranking-panel"><header><span class="ranking-panel-icon">${icon('rocket_launch', 22)}</span><div><h2>Apps & websites</h2><p>All-time upvotes minus downvotes</p></div></header><div class="ranking-list">${tools.length ? tools.map(renderRankedLaunch).join('') : `<div class="route-empty compact"><strong>No launches yet</strong></div>`}</div></section><section class="ranking-panel"><header><span class="ranking-panel-icon">${icon('group', 22)}</span><div><h2>Engagement leaders</h2><p>Last 30 days</p></div></header><div class="ranking-list">${makers.length ? makers.map(renderLeaderRow).join('') : `<div class="route-empty compact"><strong>No makers ranked yet</strong></div>`}</div></section></div></main>`;
}

const infoContent = {
    about: { eyebrow: 'About', title: 'A place to make things', intro: 'VibeDock brings builders together to share ideas, learn in public, and launch projects.', sections: [['What you can do', 'Post a work in progress, ask a question, run a poll, launch an app or website, and meet other makers.'], ['Who it is for', 'Vibe coders, developers, and designers building with AI, code, and curiosity.']] },
    guidelines: { eyebrow: 'Guidelines', title: 'Build kindly', intro: 'Keep this a useful, welcoming place.', sections: [['Be generous', 'Offer clear feedback and credit the people and tools that helped.'], ['Be respectful', 'Critique the work, not the person. Harassment is not welcome.'], ['Be honest', 'Share real projects and disclose paid promotion or affiliate links.'], ['Keep it safe', 'No private information, harmful instructions, or content you do not have the right to share.'], ['Message safety', 'A baseline automatic filter rejects some explicit hate and threats before sending. It cannot understand every language or context. Use a message’s options to report abuse or block its sender. Blocking stops private messaging in both directions and hides that member’s community messages from you. Reports are reviewed by administrators; reports alone do not automatically ban accounts.']] },
    privacy: { eyebrow: 'Privacy', title: 'Your information', intro: 'This community stores the information needed to run accounts and community features.', sections: [['What is stored', 'Account details, profile information, posts, uploaded images, votes, reports, direct messages, and community chat messages. Passwords are stored as hashes.'], ['How it is used', 'To display profiles and community content, deliver messages, prevent abuse, and operate moderation tools. Private messages are stored on the server, not end-to-end encrypted. When reported, only the reported message and your report details are shown in the moderator review queue.'], ['Your choices', 'You can edit your profile. Contact the site administrator for account removal or privacy questions.'], ['Retention', 'The site operator sets and publishes retention periods before launch.']] },
    terms: { eyebrow: 'Terms', title: 'Using VibeDock', intro: 'Use the community lawfully and treat members with care.', sections: [['Your content', 'You keep ownership of your work and give the service permission to host and display it as needed to run the community.'], ['Your account', 'Keep your sign in details private and use accurate contact information.'], ['Moderation', 'Administrators may hide content, review reports, or disable accounts to protect the community.']] },
};

function renderInfoPage() {
    const content = infoContent[state.page] || infoContent.about;
    return `<main class="route-main info-page"><header class="info-page-heading">${illustration('conversation')}<span class="route-eyebrow">${content.eyebrow}</span><h1>${content.title}</h1><p>${content.intro}</p></header><div class="info-page-sections">${content.sections.map(([title, body]) => `<section><h2>${title}</h2><p>${body}</p></section>`).join('')}</div><nav class="info-page-links" aria-label="More information"><button data-action="go-page" data-page="about">About</button><button data-action="go-page" data-page="guidelines">Guidelines</button><button data-action="go-page" data-page="privacy">Privacy</button><button data-action="go-page" data-page="terms">Terms</button></nav></main>`;
}

function renderAdminPage() {
    if (!state.currentUser) return `<main class="route-main"><section class="route-empty">${icon('lock', 30)}<h1>Admin access</h1><button class="btn btn-primary" data-action="open-auth" data-mode="login">Sign in</button></section></main>`;
    if (!state.currentUser.isAdmin) return `<main class="route-main"><section class="route-empty">${icon('lock', 30)}<h1>Admins only</h1><button class="btn btn-outline" data-action="go-page" data-page="home">Back to feed</button></section></main>`;
    return `<main class="route-main admin-preview-page"><header class="admin-preview-heading"><div><span class="route-eyebrow">Preview</span><h1>Admin panel</h1></div><a class="btn btn-outline btn-small" href="/admin">Open full panel</a></header><div class="admin-preview-stats"><div><strong>${state.posts.length}</strong><span>Posts</span></div><div><strong>${state.posts.filter((post) => post.type === 'launch').length}</strong><span>Launches</span></div><div><strong>${state.catalogue.length}</strong><span>AI models</span></div></div>${renderCatalogueAdmin()}<section class="admin-preview-section"><h2>Recent posts</h2>${state.posts.slice(0, 10).map((post) => `<article class="admin-preview-row"><div><strong>${escapeHtml(post.title || post.body.slice(0, 70))}</strong><span>${escapeHtml(post.authorName || 'Member')} · ${escapeHtml(prettyType(post.type))}</span></div><button class="btn btn-outline btn-small" data-action="admin-hide-post" data-post-id="${escapeHtml(post.id)}">${post.isHidden ? 'Restore' : 'Hide'}</button></article>`).join('')}</section></main>`;
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
            <div class="footer-column"><strong>Explore</strong><button data-action="go-page" data-page="feed">Feed</button><button data-action="go-page" data-page="models">AI models</button><button data-action="go-page" data-page="launches">Launches</button><button data-action="go-page" data-page="rankings">Rankings</button><button data-action="go-page" data-page="community-chat">Community chat</button></div>
            <div class="footer-column"><strong>Information</strong><button data-action="go-page" data-page="about">About</button><button data-action="go-page" data-page="guidelines">Guidelines</button><button data-action="go-page" data-page="privacy">Privacy</button><button data-action="go-page" data-page="terms">Terms</button></div>
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
        : `<section class="demo-credentials"><strong>Demo accounts</strong><div><code>demo@vibedock.test</code><button type="button" data-action="fill-demo-account" data-demo-account="member">Use</button></div><div><code>admin@vibedock.test</code><button type="button" data-action="fill-demo-account" data-demo-account="admin">Use</button></div></section>`;
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

function renderComposeModal() {
    const type = state.composeType;
    const titles = {discussion:'Share a post', question:'Ask a question', poll:'Create a poll', launch:'Launch your project'};
    const types = [['discussion','forum','Post'],['question','chat_bubble','Question'],['poll','bar_chart','Poll'],['launch','rocket_launch','Launch']];
    return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-dialog compose-dialog" role="dialog" aria-modal="true" aria-labelledby="compose-title"><button class="modal-close icon-button" aria-label="Close" data-action="close-modal">${icon('close',20)}</button><h2 id="compose-title">${titles[type]}</h2><div class="compose-type-switch" aria-label="Post type">${types.map(([key,glyph,label])=>`<button class="${type===key?'is-active':''}" data-action="compose-type" data-type="${key}" aria-pressed="${type===key}">${icon(glyph,18)} ${label}</button>`).join('')}</div>
    <form class="modal-form compose-form" data-form="compose" data-type="${type}">
        ${type!=='discussion'?`<label class="field-label">${type==='launch'?'Project name':type==='poll'?'Poll question':'Your question'}<input name="title" maxlength="140" required></label>`:''}
        <label class="field-label">${type==='launch'?'Project description':type==='poll'?'Context (optional)':'Your post'}<textarea name="body" rows="4" maxlength="5000" ${type!=='poll'?'required':''} placeholder="${type==='launch'?'What did you build, and who is it for?':'What would you like to share?'}"></textarea></label>
        ${type==='poll'?`<div class="poll-option-fields">${[1,2].map(i=>`<label class="field-label">Option ${i}<input name="options[]" maxlength="80" required></label>`).join('')}</div><button class="add-option" type="button" data-action="add-option">${icon('add',16)} Add option</button>`:''}
        ${type==='launch'?`<label class="field-label">Project URL<input type="url" name="project_url" required placeholder="https://your-project.com"></label><label class="field-label">Project type<select name="launch_category"><option value="website">Website</option><option value="app">App</option><option value="ai_tool">AI tool</option><option value="ai_app">AI app</option><option value="other">Other</option></select></label><label class="field-label">SEO description <small>A short search preview, up to 160 characters.</small><textarea name="seo_description" rows="2" maxlength="160" placeholder="Describe your project in one useful sentence."></textarea></label><label class="field-label">Project logo<input type="file" name="logo" accept=".svg,image/svg+xml,image/png,image/jpeg,image/webp"></label>`:`<label class="field-label">Image (optional)<input type="file" name="image" accept="image/png,image/jpeg,image/webp"></label><label class="field-label">Topic<select name="category"><option value="">None</option>${popularTopics.map(topic=>`<option>${escapeHtml(topic)}</option>`).join('')}</select></label>`}
        <div class="form-message" data-form-message hidden></div><div class="compose-submit-row"><button class="btn btn-primary" type="submit">${type==='launch'?'Publish launch':type==='poll'?'Publish poll':'Publish post'}</button></div>
    </form></section></div>`;
}
function renderProfileEditPage() {
    if (!state.currentUser) return `<main class="route-main"><section class="route-empty"><h1>Edit profile</h1><button class="btn btn-primary" data-action="open-auth" data-mode="login">Sign in</button></section></main>`;
    const user=state.currentUser;
    return `<main class="route-main profile-edit-page"><header class="settings-heading"><div><span class="section-kicker">Make yourself at home</span><h1>Your profile, your personality.</h1></div><button class="btn btn-outline" data-action="open-my-profile">View profile ${icon('arrow_forward',18)}</button></header>
    <form data-form="profile" class="profile-settings-form"><aside class="settings-preview"><div class="profile-preview-cover cover-${escapeHtml(user.coverChoice||'aurora')}"></div><img class="settings-avatar" src="${escapeHtml(safeImageUrl(user.avatarUrl)||'/avatars/orbit-ollie.svg')}" alt="Your selected avatar" width="112" height="112"><h2 data-profile-name>${escapeHtml(user.name)}</h2><p>@${escapeHtml(user.username)}</p><div class="settings-section-links"><a href="#profile-basics">The basics</a><a href="#profile-style">Your look</a><a href="#profile-skills">Your skills</a></div><button type="submit" class="btn btn-primary">Save changes ${icon('check',18)}</button></aside>
    <div class="settings-fields"><section id="profile-basics" class="settings-panel"><div class="settings-panel-heading">${illustration('maker')}<div><h2>The basics</h2><p>Let fellow makers get to know you.</p></div></div><div class="settings-two-col"><label class="field-label">Name<input name="name" value="${escapeHtml(user.name)}" maxlength="80" minlength="2" required></label><label class="field-label">Username<input name="username" value="${escapeHtml(user.username)}" pattern="[A-Za-z0-9_]+" minlength="3" maxlength="24" required></label></div><label class="field-label">What do you do?<input name="profession" value="${escapeHtml(user.profession||'')}" maxlength="80" placeholder="Designer, developer, curious human…"></label><label class="field-label">About you<textarea name="bio" rows="3" maxlength="280">${escapeHtml(user.bio||'')}</textarea></label><label class="field-label">Website<input name="website" type="url" value="${escapeHtml(user.website||'')}" placeholder="https://"></label></section>
    <section id="profile-style" class="settings-panel"><div class="settings-panel-heading">${illustration('conversation')}<div><h2>A little character</h2><p>Original characters. Entirely your choice.</p></div></div>${renderAvatarPicker(user)}<label class="field-label">Or upload a photo<input type="file" name="avatar" accept="image/png,image/jpeg,image/webp"></label>${renderCoverPicker(user)}</section>
    <section id="profile-skills" class="settings-panel"><div class="settings-panel-heading">${illustration('build')}<div><h2>What’s in your toolkit?</h2><p>Choose up to 12 skills. Add your own, too.</p></div></div><label class="field-label">Selected skills<input name="skills" maxlength="420" value="${escapeHtml((user.skills||[]).join(', '))}" placeholder="Add custom skills, separated by commas"></label>${renderSkillPicker(user.skills||[])}</section><div class="settings-save"><div class="form-message" data-form-message hidden></div><button type="submit" class="btn btn-primary">Save changes</button></div></div></form></main>`;
}

function renderAvatarPicker(user) {
    const selected = user.avatarUploaded || !AVATAR_CHOICES.some(choice=>choice.key===user.avatarChoice) ? 'keep' : user.avatarChoice;
    const groups = ['The cast'];
    return `<fieldset class="avatar-picker"><legend>Avatar</legend>
        ${user.avatarUploaded || !AVATAR_CHOICES.some(choice => choice.key === selected) ? `<label class="avatar-current-choice"><input type="radio" name="avatar_choice" value="keep" ${selected === 'keep' ? 'checked' : ''}>${avatar(user.name || 'You', 'tone-neutral', 'avatar-choice-preview', user.avatarUrl)}<span>Keep current avatar</span></label>` : ''}
        <div class="avatar-picker-tools"><button type="button" class="btn btn-outline btn-small" data-action="random-avatar">${icon('shuffle', 16)} Random</button></div>
        ${groups.map((group) => `<div class="avatar-choice-group"><span>${group}</span><div class="avatar-choice-grid">${AVATAR_CHOICES.filter((choice) => choice.group === group).map((choice) => `<label class="avatar-choice ${selected === choice.key ? 'is-selected' : ''}" title="${choice.label}"><input type="radio" name="avatar_choice" value="${choice.key}" ${selected === choice.key ? 'checked' : ''}><img src="/avatars/${choice.key}.svg" alt="${choice.label}" loading="lazy"><span>${choice.label}</span></label>`).join('')}</div></div>`).join('')}
    </fieldset>`;
}

function renderCoverPicker(user) {
    const selected = user.coverChoice || 'aurora';
    return `<fieldset class="cover-picker"><legend>Cover</legend><div class="cover-choice-grid">${COVER_CHOICES.map((choice) => `<label class="cover-choice cover-swatch-${choice.key} ${selected === choice.key ? 'is-selected' : ''}" title="${choice.label}"><input type="radio" name="cover_choice" value="${choice.key}" ${selected === choice.key ? 'checked' : ''}><span class="visually-hidden">${choice.label}</span>${selected === choice.key ? icon('check', 18) : ''}</label>`).join('')}</div></fieldset>`;
}

function syncSkillPicker(form) {
    const skills = form.querySelector('[name="skills"]').value.split(',').map(item => item.trim()).filter(Boolean);
    form.querySelectorAll('[data-skill]').forEach(button => button.setAttribute('aria-pressed', String(skills.some(skill => skill.toLowerCase() === button.dataset.skill.toLowerCase()))));
    form.querySelector('.skill-status').textContent = `${skills.length}/12 selected`;
}

function renderSkillPicker(selected) {
    const chosen = selected.map(name => name.toLowerCase());
    return `<fieldset class="skill-picker"><legend>Find your skills</legend><label class="visually-hidden" for="skill-search">Search skills</label><input id="skill-search" type="search" data-skill-search placeholder="Search ${SKILLS.length} skills…" autocomplete="off"><div class="skill-catalog">${SKILLS.map(skill => `<button type="button" class="skill-option" data-action="toggle-skill" data-skill="${escapeHtml(skill.name)}" aria-pressed="${chosen.includes(skill.name.toLowerCase())}">${skillIcon(skill.name)}<span>${escapeHtml(skill.name)}</span>${icon('check', 14, 'skill-check')}</button>`).join('')}</div><p class="skill-status" role="status">${selected.length}/12 selected</p></fieldset>`;
}

function renderReportModal() {
    const post = state.posts.find((item) => item.id === String(state.reportPostId));
    return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-dialog compose-dialog report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-title"><button class="modal-close icon-button" data-action="close-modal" aria-label="Close">${icon('close', 21)}</button><h2 id="report-title">Report post</h2><form class="modal-form" data-form="report" data-post-id="${escapeHtml(post?.id || '')}"><label class="field-label">Reason<select name="reason" required><option value="">Choose a reason</option><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="misinformation">Misleading information</option><option value="unsafe">Unsafe content</option><option value="other">Something else</option></select></label><label class="field-label">Details <span class="optional-label">Optional</span><textarea name="details" rows="3" maxlength="1000" placeholder="Anything that may help moderators."></textarea></label><div class="form-message" data-form-message hidden></div><div class="compose-submit-row"><button class="btn btn-primary" type="submit">Send report</button></div></form></section></div>`;
}

function renderModal() {
    if (state.modal === 'auth') return renderAuthModal();
    if (state.modal === 'compose') return renderComposeModal();
    if (state.modal === 'report') return renderReportModal();
    if (['new-message', 'blocked-members', 'block-member', 'message-report'].includes(state.modal)) return renderMessagingModal();
    return '';
}

function renderPageContent() {
    if (state.page === 'feed') return renderMain();
    if (state.page === 'profile-edit') return renderProfileEditPage();
    if (state.page === 'launches') return renderLaunchPage();
    if (state.page === 'models') return renderModelsPage();
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

function renderApp() {
    if (!root) return;
    if (!document.querySelector('#page-content')) root.innerHTML = '<div id="header-region"></div><div id="page-content"></div><div id="footer-region"></div><div id="navigation-region"></div><div id="modal-region"></div>';
    patchRegion('header-region', renderHeader());
    if (!(state.page === 'profile-edit' && renderedPage === 'profile-edit' && document.querySelector('.profile-settings-form'))) patchRegion('page-content', renderPageContent());
    renderedPage = state.page;
    patchRegion('footer-region', ['messages', 'community-chat', 'profile-edit'].includes(state.page) ? '' : renderFooter());
    patchRegion('navigation-region', renderMobileNav());
    const modalChanged = patchRegion('modal-region', renderModal());
    if (state.page === 'feed') renderFeed();
    const title = ({ home: 'Build together', feed: 'Community feed', 'profile-edit': 'Edit profile', models: 'AI models', launches: 'Launches', rankings: 'Rankings', 'community-chat': 'Community chat', messages: 'Messages', admin: 'Admin panel', about: 'About', guidelines: 'Guidelines', privacy: 'Privacy', terms: 'Terms', profile: state.profileData?.user?.name || 'Profile' })[state.page] || 'VibeDock';
    document.title = `${title} | VibeDock`;
    document.body.classList.toggle('has-modal', Boolean(state.modal));
    if (modalChanged && state.modal === 'auth') {
        window.requestAnimationFrame(() => root.querySelector('.modal-dialog input')?.focus());
    } else if (modalChanged && state.modal) {
        window.requestAnimationFrame(() => root.querySelector('.modal-dialog input, .modal-dialog select, .modal-dialog textarea')?.focus());
    }
    if (state.page === 'profile' && state.profileUsername && state.profileLoadedFor !== state.profileUsername && !state.profileLoading) {
        void loadProfile(state.profileUsername);
    }
    if (state.page === 'messages' && !state.conversationsLoaded) {
        void loadConversations();
    }
    if (state.page === 'models' && !state.catalogueLoaded && !state.catalogueLoading) void loadCatalogue();
    if (['feed','launches','rankings'].includes(state.page) && !state.feedLoaded && !state.feedLoading) void loadServerFeed();
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
    renderApp();
}

function openCompose(type = 'discussion') {
    if (!state.currentUser) {
        openAuth('register');
        return;
    }
    state.modal = 'compose';
    state.composeType = ['discussion', 'question', 'poll', 'launch'].includes(type) ? type : 'discussion';
    renderApp();
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
    const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
    if (!response.ok) {
        const detail = data.errors ? Object.values(data.errors).flat().join(' ') : '';
        const error = new Error(detail || data.message || 'Something went wrong. Please try again.');
        error.status = response.status;
        throw error;
    }
    return data;
}

async function loadServerFeed() {
    if (!apiEnabled || state.feedLoading) return;
    state.feedLoading = true; state.feedLoaded = true; state.feedError = '';
    try { state.posts = ((await apiRequest('/api/feed')).data || []).filter(post=>post.type!=='model').map(normalizePost); }
    catch (error) { state.feedError = error.message; }
    finally { state.feedLoading = false; if (['feed','launches','rankings'].includes(state.page)) renderApp(); }
}

async function loadRankings() {
    state.rankingsLoaded = true;
    if (!apiEnabled) {
        state.rankings = null;
        renderApp();
        return;
    }
    try {
        const result = await apiRequest('/api/rankings');
        state.rankings = {
            tools: Array.isArray(result.tools) ? result.tools.map(normalizePost) : [],
            leaderboard: Array.isArray(result.leaderboard) ? result.leaderboard : [],
        };
    } catch {
        state.rankings = { tools: [], leaderboard: [] };
    }
    renderApp();
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
    state.profileLoading = true;
    state.profileError = '';
    renderApp();
    try {
        if (apiEnabled) {
            state.profileData = await apiRequest(`/api/users/${encodeURIComponent(username)}`);
        } else {
            state.profileData = previewProfile(username);
            if (!state.profileData) throw new Error('Profile not found.');
        }
        if (Array.isArray(state.profileData?.posts)) state.profileData.posts = state.profileData.posts.map(normalizePost);
        state.profileLoadedFor = username;
        if (state.profileData?.relationship?.isSelf) await loadFriendRequests();
    } catch (error) {
        state.profileData = null;
        state.profileError = error.message;
        state.profileLoadedFor = username;
    } finally {
        state.profileLoading = false;
        renderApp();
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
    const allowed = ['home', 'feed', 'profile-edit', 'models', 'launches', 'rankings', 'community-chat', 'messages', 'profile', 'admin', 'about', 'guidelines', 'privacy', 'terms'];
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
        if (state.profileUsername !== nextUsername) state.profileData = null;
        state.profileUsername = nextUsername;
    } else {
        state.profileUsername = null;
    }
    if (nextPage === 'community-chat' && !apiEnabled) state.groupChatLoaded = true;
    const path = nextPage === 'home' ? '/' : nextPage === 'profile-edit' ? '/settings/profile' : nextPage === 'profile' ? `/u/${encodeURIComponent(nextUsername)}` : `/${nextPage}`;
    window.history.pushState({}, '', path);
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    renderApp();
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
                'demo@vibedock.test': { password: 'VibeDockDemo2026!', name: 'Demo Maker', username: 'demomaker', avatarChoice: 'byte-bard', coverChoice: 'blossom', isAdmin: false, profession: 'Independent maker', skills: ['Prototyping', 'AI tools', 'Product design'] },
                'admin@vibedock.test': { password: 'VibeDockAdmin2026!', name: 'Demo Admin', username: 'demoadmin', avatarChoice: 'agent-loop', coverChoice: 'ocean', isAdmin: true, profession: 'Community moderator', skills: ['Community building'] },
            };
            const account = demoAccounts[payload.email.toLowerCase()];
            if (!account || account.password !== payload.password) throw new Error('Use one of the demo accounts shown above.');
            const { password: _password, ...profile } = account;
            state.currentUser = { id: `preview-${profile.username}`, ...profile, email: payload.email, avatarUploaded: false, avatarUrl: `/avatars/${profile.avatarChoice}.svg` };
        } else {
            const username = payload.username || payload.name.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
            if (username.length < 3) throw new Error('Choose a username with at least three letters or numbers.');
            state.currentUser = { id: `preview-${Date.now()}`, name: payload.name, username, email: payload.email, bio: '', profession: '', skills: [], coverChoice: 'aurora', avatarChoice: 'neutral', avatarUploaded: false, avatarUrl: '/avatars/neutral.svg', isAdmin: false };
            writeStorage(STORAGE.user, state.currentUser);
        }
        state.modal = null; state.catalogueLoaded = !apiEnabled;
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
        checkMessage([payload.title, payload.body, ...options].filter(Boolean).join(' '));
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
        state.modal = null;
        window.history.pushState({}, '', type === 'launch' ? '/launches' : '/feed');
        persistDemo();
        renderApp();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast(type === 'launch' ? 'Launch published!' : type === 'poll' ? 'Poll posted!' : 'Posted!');
    } catch (error) {
        showMessage(form, error.message);
    } finally {
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

function refreshPostView() {
    if (state.page === 'feed') {
        renderFeed();
        return;
    }
    const main = root.querySelector('.route-main');
    if (main) main.outerHTML = renderPageContent();
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
    if (![-1, 1].includes(voteValue)) return;
    const post = findPostById(postId);
    const rankedPost = state.rankings?.tools?.find((item) => String(item.id) === String(postId));
    if (!post && !rankedPost) return;
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
    }
}

async function toggleLike(postId) {
    if (!state.currentUser) {
        openAuth('register');
        return;
    }
    const post = findPostById(postId);
    if (!post) return;
    try {
        if (apiEnabled) {
            const result = await apiRequest(`/api/posts/${encodeURIComponent(postId)}/like`, 'POST', {});
            post.liked = result.liked;
            post.likes = Number(result.likes);
        } else {
            post.liked = !post.liked;
            post.likes = Math.max(0, Number(post.likes || 0) + (post.liked ? 1 : -1));
        }
        persistDemo();
        refreshPostView();
    } catch (error) {
        showToast(error.message);
    }
}

async function reactToPost(postId, reaction) {
    if (!state.currentUser) return openAuth('register');
    const post = findPostById(postId);
    if (!post || !['celebrate', 'helpful', 'support'].includes(reaction)) return;
    try {
        if (apiEnabled) {
            const result = await apiRequest(`/api/posts/${encodeURIComponent(postId)}/react`, 'POST', { reaction });
            post.reactions = result.reactions;
            post.myReaction = result.myReaction;
        } else {
            const counts = { ...(post.reactions || {}) };
            if (post.myReaction) counts[post.myReaction] = Math.max(0, Number(counts[post.myReaction] || 0) - 1);
            if (post.myReaction !== reaction) {
                counts[reaction] = Number(counts[reaction] || 0) + 1;
                post.myReaction = reaction;
            } else {
                post.myReaction = null;
            }
            post.reactions = counts;
        }
        persistDemo();
        refreshPostView();
    } catch (error) {
        showToast(error.message);
    }
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
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
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
                avatarUrl: uploadedAvatar || (keepPhoto ? state.currentUser.avatarUrl : `/avatars/${chosenAvatar}.svg`),
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
        if (submit.isConnected) submit.disabled = false;
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
    state.catalogueLoaded = !apiEnabled;
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
    if (action === 'rate-model') return rateModel(target.dataset.modelId, Number(target.dataset.score));
    if (action === 'reload-models') { state.catalogueLoaded = false; return loadCatalogue(); }
    if (action === 'reload-feed') { state.feedLoaded = false; return loadServerFeed(); }
    if (action === 'edit-catalogue-model' && state.currentUser?.isAdmin && !apiEnabled) { state.editingModel = target.dataset.modelId; renderApp(); return; }
    if (action === 'archive-catalogue-model' && state.currentUser?.isAdmin && !apiEnabled) {
        const model = state.catalogue.find(item=>String(item.id)===target.dataset.modelId);
        if (model) model.isActive = model.isActive === false;
        writeStorage('vibedock-preview-models', state.catalogue); renderApp(); return;
    }
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
        state.filter = 'all';
        window.history.pushState({}, '', `/posts/${encodeURIComponent(state.initialPostId)}`);
        renderApp();
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (action === 'open-compose') return openCompose(target.dataset.type || 'discussion');
    if (action === 'compose-type') {
        state.composeType = target.dataset.type || 'discussion';
        return renderApp();
    }
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
        const pool = AVATAR_CHOICES.map((choice) => choice.key).filter((key) => key !== current);
        const pick = pool[Math.floor(Math.random() * pool.length)];
        const input = form.querySelector(`input[name="avatar_choice"][value="${pick}"]`);
        if (input) {
            input.checked = true;
            form.querySelectorAll('.avatar-choice').forEach((element) => element.classList.toggle('is-selected', element.contains(input)));
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
    if (event.target.matches('[data-model-search]')) {
        state.modelQuery = event.target.value;
        const cursor = event.target.selectionStart;
        renderApp();
        const input = root.querySelector('[data-model-search]'); input?.focus();
        return;
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
        event.target.closest('fieldset').querySelectorAll('[data-skill]').forEach(button => { button.hidden = !button.dataset.skill.toLowerCase().includes(query); });
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
    if (event.target.matches('input[name="avatar_choice"]')) {
        const image = document.querySelector('.settings-avatar');
        if (image) image.src = event.target.value === 'keep' ? state.currentUser.avatarUrl : `/avatars/${event.target.value}.svg`;

        const form = event.target.closest('form');
        if (form) form.querySelectorAll('.avatar-choice').forEach((element) => element.classList.toggle('is-selected', element.contains(event.target)));
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
    if (form.dataset.form === 'model-admin' && state.currentUser?.isAdmin && !apiEnabled) {
        const data = new FormData(form);
        const name = String(data.get('name')).trim();
        if (state.catalogue.some(model=>model.name.toLowerCase()===name.toLowerCase() && String(model.id)!==state.editingModel)) return showMessage(form,'That model already exists.');
        const existing = state.catalogue.find(model=>String(model.id)===state.editingModel);
        const model = {id:existing?.id || `model-${Date.now()}`, name, provider:String(data.get('provider')).trim(), description:String(data.get('description')).trim(), websiteUrl:safeUrl(data.get('website_url')), isActive:existing?.isActive ?? true};
        if (existing) Object.assign(existing, model); else state.catalogue.push(model);
        writeStorage('vibedock-preview-models',state.catalogue); state.editingModel=null; renderApp(); showToast('Catalogue saved in this demo.'); return;
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
    const reactions = document.querySelector('.reaction-picker[open], .message-actions[open]');
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
    document.querySelectorAll('.reaction-picker[open], .message-actions[open]').forEach((picker) => {
        if (!picker.contains(event.target)) picker.open = false;
    });
    if (state.menuPostId && !event.target.closest('.post-more-wrap')) {
        state.menuPostId = null;
        refreshPostView();
    }
    if (!event.target.closest('.nav-search, [data-action="toggle-search"]')) closeSearchDropdown();
});

window.addEventListener('popstate', () => {
    const parts = decodeURIComponent(window.location.pathname).split('/').filter(Boolean);
    const page = routePages[parts[0]] || 'home';
    if (state.page === 'profile' && page !== 'profile') {
        state.profileData = null;
        state.profileLoadedFor = null;
    }
    state.page = page;
    state.profileUsername = page === 'profile' ? parts[1] : null;
    state.initialPostId = parts[0] === 'posts' ? parts[1] : null;
    state.modal = null;
    state.mobileMenu = false;
    state.mobileSearch = false;
    if (page === 'messages') state.conversationsLoaded = false;
    renderApp();
});

renderApp();
