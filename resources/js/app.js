import '@fontsource-variable/figtree/wght.css';
import '../css/app.css';
import { ICON_PATHS, ICON_PATHS_FILLED } from './icon-paths.js';

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
    const path = (filled ? ICON_PATHS_FILLED[name] : null) || ICON_PATHS[name] || ICON_PATHS.explore;
    return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="${path}"/></svg>`;
}

/* ------------------------------------------------------------------ */
/* Libraries                                                           */
/* ------------------------------------------------------------------ */

const AVATAR_CHOICES = [
    { key: 'female-rose', label: 'Rose', group: 'Women' },
    { key: 'female-violet', label: 'Violet', group: 'Women' },
    { key: 'female-teal', label: 'Teal', group: 'Women' },
    { key: 'female-sun', label: 'Sun', group: 'Women' },
    { key: 'female-forest', label: 'Forest', group: 'Women' },
    { key: 'female-ocean', label: 'Ocean', group: 'Women' },
    { key: 'female-dusk', label: 'Dusk', group: 'Women' },
    { key: 'male-indigo', label: 'Indigo', group: 'Men' },
    { key: 'male-sky', label: 'Sky', group: 'Men' },
    { key: 'male-amber', label: 'Amber', group: 'Men' },
    { key: 'male-forest', label: 'Forest', group: 'Men' },
    { key: 'male-ruby', label: 'Ruby', group: 'Men' },
    { key: 'male-slate', label: 'Slate', group: 'Men' },
    { key: 'male-wine', label: 'Wine', group: 'Men' },
    { key: 'neutral', label: 'Neutral', group: 'Neutral' },
];

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

const ACCESS_META = {
    free: { label: 'Free', icon: 'check_circle', className: 'access-free' },
    freemium: { label: 'Freemium', icon: 'bolt', className: 'access-freemium' },
    paid: { label: 'Paid', icon: 'payments', className: 'access-paid' },
};

const MODEL_PROVIDERS = ['OpenAI', 'Google', 'Meta', 'Mistral', 'xAI', 'DeepSeek', 'Qwen', 'Anthropic', 'Other'];

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
        author: { id: 'demo-mayachen', name: 'Maya Chen', username: 'mayachen', avatarUrl: null },
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
        author: { id: 'demo-ravipatel', name: 'Ravi Patel', username: 'ravipatel', avatarUrl: null },
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
        type: 'model',
        title: 'OpenChat 70B is free to self-host',
        body: 'Open weights, Apache license, runs on a single GPU. Great for local side projects.',
        authorName: 'Priya Rahman',
        author: { id: 'demo-priyar', name: 'Priya Rahman', username: 'priyar', avatarUrl: null },
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
        author: { id: 'demo-noahbuilds', name: 'Noah Williams', username: 'noahbuilds', avatarUrl: null },
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
        type: 'model',
        title: 'CodePilot Pro adds a free starter tier',
        body: 'The free tier now includes 50 requests a day — enough to test agents without paying.',
        authorName: 'Ken Alvarez',
        author: { id: 'demo-kena', name: 'Ken Alvarez', username: 'kenalvarez', avatarUrl: null },
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

const storedUser = apiEnabled ? null : readStorage(STORAGE.user);
const storedPosts = apiEnabled ? null : readStorage(STORAGE.posts);
const routeParts = decodeURIComponent(window.location.pathname).split('/').filter(Boolean);
const routePages = {
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
    posts: (storedPosts || seedPosts).map(normalizePost),
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
    freeModelsOnly: false,
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
    return `<span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 38 38" fill="none"><rect x="1" y="1" width="36" height="36" rx="11" fill="currentColor"/><path d="m10 12 8.2 15L27 12" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><path d="m28.4 6.6.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z" fill="#ffd1dc"/></svg></span>`;
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
    return `<div class="search-results" id="community-search-results" role="listbox">${users.length ? `<span class="search-results-label">People</span>${users.map((user) => `<button class="search-result" role="option" data-action="open-profile" data-username="${escapeHtml(user.username)}">${avatar(user.name, toneFor(user.name), 'avatar-search', user.avatarUrl)}<span><strong>${escapeHtml(user.name)}</strong><small>@${escapeHtml(user.username)}</small></span>${icon('open_in_new', 17)}</button>`).join('')}` : ''}${posts.length ? `<span class="search-results-label">Posts</span>${posts.map((post) => `<button class="search-result" role="option" data-action="open-post" data-post-id="${escapeHtml(post.id)}"><span class="search-result-type">${icon(typeIcon(post.type), 18)}</span><span><strong>${escapeHtml(post.title)}</strong><small>${escapeHtml(post.authorName || 'Member')}</small></span>${icon('open_in_new', 17)}</button>`).join('')}` : ''}</div>`;
}

function updateSearchResults() {
    const box = document.querySelector('.nav-search');
    if (!box) return;
    box.querySelector('.search-results')?.remove();
    box.insertAdjacentHTML('beforeend', renderSearchResults());
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
}

/* ------------------------------------------------------------------ */
/* Header and hero                                                     */
/* ------------------------------------------------------------------ */

function renderHeader() {
    const userArea = state.currentUser
        ? `<div class="signed-in-actions"><button class="header-icon-link" data-action="go-page" data-page="messages" aria-label="Messages">${icon('chat_bubble', 21)}</button><button class="user-pill" data-action="open-my-profile" aria-label="Your profile">${avatar(state.currentUser.name, toneFor(state.currentUser.name), 'avatar-small', state.currentUser.avatarUrl)}<span class="user-pill-name">@${escapeHtml(state.currentUser.username || state.currentUser.name.split(' ')[0])}</span></button>${state.currentUser.isAdmin ? `<a class="admin-shortcut" href="/admin">${icon('admin_panel_settings', 18)}<span>Admin</span></a>` : ''}<button class="header-icon-link" data-action="logout" aria-label="Sign out">${icon('logout', 21)}</button></div>`
        : `<div class="signed-out-actions"><button class="text-button" data-action="open-auth" data-mode="login">Sign in</button><button class="btn btn-primary btn-small" data-action="open-auth" data-mode="register">Join free</button></div>`;

    const pages = [
        ['home', 'explore', 'Discover'],
        ['models', 'smart_toy', 'AI models'],
        ['launches', 'rocket_launch', 'Launches'],
        ['rankings', 'monitoring', 'Rankings'],
        ['community-chat', 'group', 'Chat'],
    ];

    return `<header class="site-header">
        <div class="nav-shell">
            <a class="brand" href="/" aria-label="VibeDock home" data-action="go-page" data-page="home">${brandMark()}<span class="brand-word">vibe<span>dock</span></span></a>
            <nav class="desktop-nav" aria-label="Main navigation">${pages.map(([page, glyph, label]) => `<button class="nav-link ${state.page === page ? 'is-active' : ''}" data-action="go-page" data-page="${page}">${label}</button>`).join('')}</nav>
            <div class="nav-search">
                ${icon('search', 20)}
                <input type="search" aria-label="Search community" placeholder="Search" value="${escapeHtml(state.search)}" data-search autocomplete="off" aria-controls="community-search-results">
                ${renderSearchResults()}
            </div>
            <div class="nav-actions">${userArea}<button class="mobile-menu-toggle icon-button" aria-label="Toggle navigation" aria-expanded="${state.mobileMenu}" data-action="toggle-menu">${icon(state.mobileMenu ? 'close' : 'menu', 22)}</button></div>
        </div>
        ${state.mobileMenu ? `<nav class="mobile-nav" aria-label="Mobile navigation">${pages.map(([page, glyph, label]) => `<button data-action="go-page" data-page="${page}">${icon(glyph, 21, '', state.page === page)} ${label}</button>`).join('')}${state.currentUser ? `<button data-action="open-my-profile">${icon('person', 21)} Profile</button><button data-action="go-page" data-page="messages">${icon('chat_bubble', 21)} Messages</button><button data-action="logout">${icon('logout', 21)} Sign out</button>` : `<button data-action="open-auth" data-mode="login">${icon('person', 21)} Sign in</button>`}</nav>` : ''}
    </header>`;
}

function renderHero() {
    return `<section class="hero" aria-label="Welcome">
        <div class="hero-shell">
            <div class="hero-copy">
                <h1>Build ideas.<br><span>Grow together.</span></h1>
                <p>Share work in progress, get feedback, and launch projects with a community of makers and vibe coders.</p>
                <div class="hero-actions">
                    <button class="btn btn-light" data-action="open-auth" data-mode="register">Join the community ${icon('arrow_forward', 19)}</button>
                    <button class="hero-secondary" data-action="go-page" data-page="launches">Explore launches ${icon('open_in_new', 18)}</button>
                </div>
            </div>
            <div class="hero-visual" aria-hidden="true">
                <div class="hero-card">
                    <div class="hero-card-top">${icon('smart_toy', 20)}<span>New AI model shared</span>${icon('check_circle', 18, 'hero-card-check')}</div>
                    <div class="hero-model-row">
                        <span class="model-tile">${icon('smart_toy', 26)}</span>
                        <div><strong>OpenChat 70B</strong><span>Open community</span></div>
                        <span class="model-access-badge access-free">${icon('check_circle', 14)} Free</span>
                    </div>
                    <div class="hero-card-actions">
                        <span>${icon('favorite', 17)} 42</span>
                        <span>${icon('comment', 17)} 9</span>
                        <span>${icon('rocket_launch', 17)} Launch ready</span>
                    </div>
                </div>
                <div class="hero-chip hero-chip-a">${icon('rocket_launch', 18)} New launch</div>
                <div class="hero-chip hero-chip-b">${icon('trending_up', 18)} +128 makers</div>
            </div>
        </div>
    </section>`;
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
        ['model', 'smart_toy', 'AI models'],
        ['launch', 'rocket_launch', 'Launches'],
        ['poll', 'bar_chart', 'Polls'],
        ['saved', 'bookmark', 'Saved'],
    ];
    return `<aside class="left-rail" aria-label="Community filters">
        ${state.currentUser ? `<button class="rail-user-card" data-action="open-my-profile">${avatar(state.currentUser.name, toneFor(state.currentUser.name), 'avatar-small', state.currentUser.avatarUrl)}<span><strong>${escapeHtml(state.currentUser.name)}</strong><small>@${escapeHtml(state.currentUser.username || 'member')}</small></span>${icon('open_in_new', 17)}</button>` : ''}
        <div class="rail-card rail-menu-card">
            <div class="rail-heading">Feed</div>
            <nav class="rail-menu">${menu.map(([filter, glyph, label]) => `<button class="rail-link ${state.filter === filter ? 'is-active' : ''}" data-action="filter" data-filter="${filter}"><span class="rail-icon">${icon(glyph, 20, '', state.filter === filter)}</span><span>${label}</span></button>`).join('')}</nav>
        </div>
        <div class="rail-card topics-card">
            <div class="rail-heading">Topics</div>
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
            <button data-action="open-compose" data-type="model">${icon('smart_toy', 19)}<span>AI model</span></button>
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

function renderModelPreview(post) {
    const safe = safeUrl(post.projectUrl);
    const access = ACCESS_META[post.modelAccess] || ACCESS_META.free;
    const provider = post.modelProvider || 'Community share';
    return `<div class="model-preview-card">
        <span class="model-tile">${icon('smart_toy', 26)}</span>
        <div class="model-preview-info">
            <span class="model-access-badge ${access.className}">${icon(access.icon, 14)} ${access.label}</span>
            <strong>${escapeHtml(provider)}</strong>
        </div>
        ${safe ? `<a class="launch-open" href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer" aria-label="Open model page">${icon('open_in_new', 19)}</a>` : ''}
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
        ? `<a class="post-avatar-link" href="${safeProfilePath}" data-action="open-profile" data-username="${escapeHtml(authorUsername)}">${avatar(authorName, post.tone || toneFor(authorName), 'avatar-post', post.author?.avatarUrl)}</a>`
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
            ${contentType === 'model' ? renderModelPreview(contentPost) : ''}
            ${contentType === 'poll' ? renderPoll(actionPost) : ''}
            ${imageUrl ? `<img class="post-image" src="${escapeHtml(imageUrl)}" alt="Image shared by ${escapeHtml(contentPost.authorName || 'a member')}" loading="lazy">` : ''}
            ${renderTagButtons(contentPost)}
        </div>
        ${renderCommentPreview(actionPost)}
        <div class="post-footer">
            <div class="post-actions">
                <button class="post-action ${actionPost.liked ? 'is-liked' : ''}" data-action="like" data-post-id="${escapeHtml(actionPost.id)}" aria-pressed="${actionPost.liked ? 'true' : 'false'}" aria-label="Like">${icon('favorite', 20, '', actionPost.liked)}<span>${Number(actionPost.likes || 0) || ''}</span></button>
                <button class="post-action reaction-action ${actionPost.myReaction === 'celebrate' ? 'is-selected' : ''}" data-action="react" data-reaction="celebrate" data-post-id="${escapeHtml(actionPost.id)}" aria-pressed="${actionPost.myReaction === 'celebrate'}" aria-label="Celebrate" title="Celebrate">${icon('celebration', 20)}<span>${Number(reactions.celebrate || 0) || ''}</span></button>
                <button class="post-action reaction-action ${actionPost.myReaction === 'helpful' ? 'is-selected' : ''}" data-action="react" data-reaction="helpful" data-post-id="${escapeHtml(actionPost.id)}" aria-pressed="${actionPost.myReaction === 'helpful'}" aria-label="Helpful" title="Helpful">${icon('check_circle', 20, '', actionPost.myReaction === 'helpful')}<span>${Number(reactions.helpful || 0) || ''}</span></button>
                <button class="post-action reaction-action ${actionPost.myReaction === 'support' ? 'is-selected' : ''}" data-action="react" data-reaction="support" data-post-id="${escapeHtml(actionPost.id)}" aria-pressed="${actionPost.myReaction === 'support'}" aria-label="Support" title="Support">${icon('group', 20)}<span>${Number(reactions.support || 0) || ''}</span></button>
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
    list.innerHTML = posts.map(renderPost).join('');
    if (empty) empty.hidden = posts.length > 0;
    if (clearTag) {
        clearTag.hidden = !state.tag;
        clearTag.innerHTML = state.tag ? `<span>#${escapeHtml(state.tag)}</span><button data-action="clear-filter" aria-label="Clear topic filter">${icon('close', 14)}</button>` : '';
    }
    document.querySelectorAll('[data-filter]').forEach((button) => button.classList.toggle('is-active', button.dataset.filter === state.filter));
}

function renderRightRail() {
    const featured = state.posts.find((post) => post.type === 'launch');
    const freeModels = state.posts.filter((post) => post.type === 'model' && post.modelAccess !== 'paid').length;
    return `<aside class="right-rail" aria-label="Community links">
        <div class="rail-card spotlight-card">
            <div class="spotlight-header"><div><div class="rail-heading">On the dock</div><h3>${featured ? escapeHtml(featured.title) : 'Share your project'}</h3></div><span class="spotlight-icon">${icon('rocket_launch', 20)}</span></div>
            <button class="spotlight-link" data-action="go-page" data-page="launches">Browse launches ${icon('arrow_forward', 16)}</button>
        </div>
        <div class="rail-card ranking-promo">
            <span class="ranking-promo-icon">${icon('smart_toy', 21)}</span>
            <strong>Free AI models</strong>
            <button class="spotlight-link" data-action="go-page" data-page="models">${freeModels} available ${icon('arrow_forward', 16)}</button>
        </div>
        <div class="right-footer"><button data-action="go-page" data-page="guidelines">Guidelines</button><button data-action="go-page" data-page="about">About</button><button data-action="go-page" data-page="privacy">Privacy</button><button data-action="go-page" data-page="terms">Terms</button></div>
    </aside>`;
}

function renderFeedSection() {
    const filters = [
        ['all', 'All'],
        ['discussion', 'Discussions'],
        ['question', 'Questions'],
        ['model', 'AI models'],
        ['launch', 'Launches'],
        ['poll', 'Polls'],
        ['saved', 'Saved'],
    ];
    return `<main class="feed-column" id="community-feed">
        <div class="feed-toolbar">
            <div class="feed-tabs" role="tablist" aria-label="Filter feed">${filters.map(([filter, label]) => `<button class="feed-tab ${state.filter === filter ? 'is-active' : ''}" role="tab" aria-selected="${state.filter === filter}" data-action="filter" data-filter="${filter}">${label}</button>`).join('')}</div>
            <label class="sort-control"><span class="visually-hidden">Sort posts</span><select data-sort aria-label="Sort posts"><option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Newest</option><option value="popular" ${state.sort === 'popular' ? 'selected' : ''}>Popular</option></select>${icon('expand_more', 16)}</label>
        </div>
        <div class="active-tag-filter" hidden></div>
        ${renderComposer()}
        <div class="feed-list"></div>
        <div class="feed-empty" hidden>${icon('search', 24)}<strong>Nothing here yet</strong><button class="btn btn-outline btn-small" data-action="clear-filter">Clear filters</button></div>
    </main>`;
}

function renderMain() {
    return `<section class="community-section" id="community">
        <div class="section-shell">
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
                ${Array.isArray(user.skills) && user.skills.length ? `<div class="profile-skills"><strong>Skills</strong><div>${user.skills.slice(0, 12).map((skill) => `<span>${escapeHtml(skill)}</span>`).join('')}</div></div>` : ''}
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
        <section class="page-intro"><div><span class="route-eyebrow">Showcase</span><h1>Launches</h1><p>Projects made by the community.</p></div><button class="btn btn-primary" data-action="open-compose" data-type="launch">${icon('add', 20)} Share a launch</button></section>
        <section class="launch-grid">${launches.length ? launches.map(renderPost).join('') : `<div class="route-empty compact">${icon('rocket_launch', 30)}<strong>No launches yet</strong><button class="btn btn-outline btn-small" data-action="open-compose" data-type="launch">Share a launch</button></div>`}</section>
    </main>`;
}

function renderModelsPage() {
    let models = state.posts.filter((post) => post.type === 'model' && !post.isHidden);
    if (state.freeModelsOnly) models = models.filter((post) => post.modelAccess !== 'paid');
    return `<main class="route-main models-page">
        <section class="page-intro"><div><span class="route-eyebrow">AI models</span><h1>AI models</h1><p>Newly released models shared by the community.</p></div><div class="page-intro-actions"><button class="chip-toggle ${state.freeModelsOnly ? 'is-active' : ''}" data-action="toggle-free-only" aria-pressed="${state.freeModelsOnly}">${icon('filter_alt', 17)} Free only</button><button class="btn btn-primary" data-action="open-compose" data-type="model">${icon('add', 20)} Share a model</button></div></section>
        <section class="launch-grid">${models.length ? models.map(renderPost).join('') : `<div class="route-empty compact">${icon('smart_toy', 30)}<strong>No models shared yet</strong><button class="btn btn-outline btn-small" data-action="open-compose" data-type="model">Share a model</button></div>`}</section>
    </main>`;
}

function localRankings() {
    const tools = state.posts.filter((post) => post.type === 'launch' && !post.isHidden && ['ai_tool', 'ai_app'].includes(post.launchCategory))
        .sort((a, b) => Number(b.upvotes || 0) - Number(b.downvotes || 0) - (Number(a.upvotes || 0) - Number(a.downvotes || 0)));
    const makers = new Map();
    state.posts.forEach((post) => {
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
    return `<main class="route-main rankings-page"><section class="page-intro"><div><span class="route-eyebrow">Rankings</span><h1>What makers are building</h1><p>Launch votes and engagement from the last 30 days.</p></div></section><div class="rankings-grid"><section class="ranking-panel"><header><span class="ranking-panel-icon">${icon('rocket_launch', 22)}</span><div><h2>AI tools and apps</h2><p>By community votes</p></div></header><div class="ranking-list">${tools.length ? tools.map(renderRankedLaunch).join('') : `<div class="route-empty compact"><strong>No AI launches yet</strong></div>`}</div></section><section class="ranking-panel"><header><span class="ranking-panel-icon">${icon('group', 22)}</span><div><h2>Engagement leaders</h2><p>Last 30 days</p></div></header><div class="ranking-list">${makers.length ? makers.map(renderLeaderRow).join('') : `<div class="route-empty compact"><strong>No makers ranked yet</strong></div>`}</div></section></div></main>`;
}

function renderCommunityChatPage() {
    if (!state.currentUser) {
        return `<main class="route-main"><section class="route-empty">${icon('group', 30)}<h1>Community chat</h1><button class="btn btn-primary" data-action="open-auth" data-mode="login">Sign in</button></section></main>`;
    }
    const messages = state.groupMessages || [];
    return `<main class="route-main community-chat-page"><section class="community-chat-shell"><header class="community-chat-heading"><div><h1>Community chat</h1><span class="chat-member-count">${icon('group', 16)} Everyone is welcome</span></div></header><div class="community-chat-transcript" id="community-chat-transcript" role="log" aria-live="polite"><div class="chat-date-label">Today</div>${messages.map((message) => `<article class="community-chat-message ${message.sentByMe ? 'mine' : ''}">${avatar(message.user?.name || 'Member', toneFor(message.user?.name || ''), 'chat-avatar', message.user?.avatarUrl)}<div class="community-chat-message-body"><div><strong>${escapeHtml(message.user?.name || 'Member')}</strong><span>${escapeHtml(message.createdAt || 'just now')}</span></div><p>${escapeHtml(message.body)}</p></div></article>`).join('')}</div><form class="community-chat-compose" data-form="community-chat"><label class="visually-hidden" for="community-chat-message">Write a message</label><textarea id="community-chat-message" name="body" rows="1" maxlength="500" placeholder="Write a message" required></textarea><button class="btn btn-primary" type="submit" aria-label="Send message">${icon('send', 21)}</button></form></section></main>`;
}

const infoContent = {
    about: { eyebrow: 'About', title: 'A place to make things', intro: 'VibeDock brings builders together to share ideas, learn in public, and launch projects.', sections: [['What you can do', 'Post a work in progress, ask a question, run a poll, share an AI model or launch, and meet other makers.'], ['Who it is for', 'Vibe coders, developers, and designers building with AI, code, and curiosity.']] },
    guidelines: { eyebrow: 'Guidelines', title: 'Build kindly', intro: 'Keep this a useful, welcoming place.', sections: [['Be generous', 'Offer clear feedback and credit the people and tools that helped.'], ['Be respectful', 'Critique the work, not the person. Harassment is not welcome.'], ['Be honest', 'Share real projects and disclose paid promotion or affiliate links.'], ['Keep it safe', 'No private information, harmful instructions, or content you do not have the right to share.']] },
    privacy: { eyebrow: 'Privacy', title: 'Your information', intro: 'This community stores the information needed to run accounts and community features.', sections: [['What is stored', 'Account details, profile information, posts, uploaded images, votes, reports, direct messages, and community chat messages. Passwords are stored as hashes.'], ['How it is used', 'To display profiles and community content, deliver messages, prevent abuse, and operate moderation tools.'], ['Your choices', 'You can edit your profile. Contact the site administrator for account removal or privacy questions.'], ['Retention', 'The site operator sets and publishes retention periods before launch.']] },
    terms: { eyebrow: 'Terms', title: 'Using VibeDock', intro: 'Use the community lawfully and treat members with care.', sections: [['Your content', 'You keep ownership of your work and give the service permission to host and display it as needed to run the community.'], ['Your account', 'Keep your sign in details private and use accurate contact information.'], ['Moderation', 'Administrators may hide content, review reports, or disable accounts to protect the community.']] },
};

function renderInfoPage() {
    const content = infoContent[state.page] || infoContent.about;
    return `<main class="route-main info-page"><header class="info-page-heading"><span class="route-eyebrow">${content.eyebrow}</span><h1>${content.title}</h1><p>${content.intro}</p></header><div class="info-page-sections">${content.sections.map(([title, body]) => `<section><h2>${title}</h2><p>${body}</p></section>`).join('')}</div><nav class="info-page-links" aria-label="More information"><button data-action="go-page" data-page="about">About</button><button data-action="go-page" data-page="guidelines">Guidelines</button><button data-action="go-page" data-page="privacy">Privacy</button><button data-action="go-page" data-page="terms">Terms</button></nav></main>`;
}

function renderAdminPage() {
    if (!state.currentUser) return `<main class="route-main"><section class="route-empty">${icon('lock', 30)}<h1>Admin access</h1><button class="btn btn-primary" data-action="open-auth" data-mode="login">Sign in</button></section></main>`;
    if (!state.currentUser.isAdmin) return `<main class="route-main"><section class="route-empty">${icon('lock', 30)}<h1>Admins only</h1><button class="btn btn-outline" data-action="go-page" data-page="home">Back to feed</button></section></main>`;
    return `<main class="route-main admin-preview-page"><header class="admin-preview-heading"><div><span class="route-eyebrow">Preview</span><h1>Admin panel</h1></div><a class="btn btn-outline btn-small" href="/admin">Open full panel</a></header><div class="admin-preview-stats"><div><strong>${state.posts.length}</strong><span>Posts</span></div><div><strong>${state.posts.filter((post) => post.type === 'launch').length}</strong><span>Launches</span></div><div><strong>${state.posts.filter((post) => post.type === 'model').length}</strong><span>AI models</span></div></div><section class="admin-preview-section"><h2>Recent posts</h2>${state.posts.slice(0, 10).map((post) => `<article class="admin-preview-row"><div><strong>${escapeHtml(post.title || post.body.slice(0, 70))}</strong><span>${escapeHtml(post.authorName || 'Member')} · ${escapeHtml(prettyType(post.type))}</span></div><button class="btn btn-outline btn-small" data-action="admin-hide-post" data-post-id="${escapeHtml(post.id)}">${post.isHidden ? 'Restore' : 'Hide'}</button></article>`).join('')}</section></main>`;
}

function renderMobileNav() {
    if (state.page === 'admin') return '';
    const items = [['home', 'home', 'Home'], ['models', 'smart_toy', 'Models'], ['launches', 'rocket_launch', 'Launches'], ['community-chat', 'group', 'Chat'], ['profile', 'person', 'Profile']];
    return `<nav class="mobile-bottom-nav" aria-label="Quick navigation">${items.map(([page, glyph, label]) => `<button class="${state.page === page ? 'is-active' : ''}" data-action="go-page" data-page="${page}" aria-label="${label}" aria-current="${state.page === page}">${icon(glyph, 23, '', state.page === page)}<span>${label}</span></button>`).join('')}</nav>`;
}

function renderMessagesPage() {
    const query = state.search.trim().toLowerCase();
    const conversations = state.conversations.filter((item) => `${item.user.name} ${item.user.username}`.toLowerCase().includes(query));
    const activeConversation = state.conversations.find((item) => String(item.user.id) === String(state.selectedMessageUser));
    const activeUser = state.messagePeer || activeConversation?.user || null;
    const requestMarkup = state.friendRequests.length ? `<section class="message-requests"><div class="route-section-heading"><h2>Friend requests</h2><span class="request-count">${state.friendRequests.length}</span></div>${state.friendRequests.map((request) => `<div class="message-request-row">${avatar(request.user.name, toneFor(request.user.name), 'avatar-small', request.user.avatarUrl)}<div><strong>${escapeHtml(request.user.name)}</strong><span>@${escapeHtml(request.user.username)}</span></div><button class="btn btn-primary btn-small" data-action="respond-friend" data-request-id="${escapeHtml(request.id)}" data-response="accept">Accept</button><button class="icon-button" aria-label="Decline request" data-action="respond-friend" data-request-id="${escapeHtml(request.id)}" data-response="decline">${icon('close', 20)}</button></div>`).join('')}</section>` : '';
    const conversationMarkup = activeUser ? `<section class="message-thread"><header class="thread-header">${avatar(activeUser.name, toneFor(activeUser.name), 'avatar-small', activeUser.avatarUrl)}<div><strong>${escapeHtml(activeUser.name)}</strong><a href="/u/${encodeURIComponent(activeUser.username)}" data-action="open-profile" data-username="${escapeHtml(activeUser.username)}">@${escapeHtml(activeUser.username)}</a></div></header><div class="thread-messages" id="thread-messages">${state.messagesLoading ? '<div class="route-loading">Loading…</div>' : state.messages.length ? state.messages.map((message) => `<div class="thread-message ${message.sentByMe ? 'mine' : ''}"><p>${escapeHtml(message.body)}</p><span>${escapeHtml(message.createdAt)}</span></div>`).join('') : '<div class="thread-empty">Say hello to start a conversation.</div>'}</div><form class="thread-compose" data-form="message" data-user-id="${escapeHtml(activeUser.id)}"><label class="visually-hidden" for="message-body">Write a message</label><textarea id="message-body" name="body" rows="1" maxlength="2000" placeholder="Write a message" required></textarea><button class="btn btn-primary" type="submit" aria-label="Send message">${icon('send', 21)}</button></form></section>` : `<section class="message-thread message-thread-empty"><div class="thread-empty-state">${icon('chat_bubble', 31)}<strong>Your messages</strong><p>Become friends to start a private chat.</p></div></section>`;

    return `<main class="route-main messages-page"><section class="messages-heading"><div><span class="route-eyebrow">Messages</span><h1>Messages</h1></div><button class="btn btn-outline btn-small" data-action="view-friend-requests">Requests${state.friendRequests.length ? ` <span class="request-count">${state.friendRequests.length}</span>` : ''}</button></section>${requestMarkup}<section class="messages-layout"><aside class="conversation-list"><div class="conversation-list-heading"><strong>Friends</strong><span>${conversations.length}</span></div>${conversations.length ? conversations.map((item) => `<button class="conversation-item ${String(item.user.id) === String(state.selectedMessageUser) ? 'is-active' : ''}" data-action="open-message-thread" data-user-id="${escapeHtml(item.user.id)}">${avatar(item.user.name, toneFor(item.user.name), 'avatar-message', item.user.avatarUrl)}<span class="conversation-copy"><strong>${escapeHtml(item.user.name)}</strong><small>${escapeHtml(item.latestMessage?.body || `@${item.user.username}`)}</small></span>${item.unreadCount ? `<span class="unread-badge">${item.unreadCount}</span>` : ''}</button>`).join('') : `<div class="conversation-empty"><span>No conversations yet.</span></div>`}</aside>${conversationMarkup}</section></main>`;
}

function renderFooter() {
    return `<footer class="site-footer"><div class="footer-shell">
        <div class="footer-main">
            <div class="footer-brand-block"><a class="brand footer-brand" href="/" data-action="go-page" data-page="home">${brandMark()}<span class="brand-word">vibe<span>dock</span></span></a><p>A community for vibe coders and makers.</p></div>
            <div class="footer-column"><strong>Explore</strong><button data-action="go-page" data-page="home">Feed</button><button data-action="go-page" data-page="models">AI models</button><button data-action="go-page" data-page="launches">Launches</button><button data-action="go-page" data-page="rankings">Rankings</button><button data-action="go-page" data-page="community-chat">Community chat</button></div>
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
    const titles = { discussion: 'Start a discussion', question: 'Ask a question', poll: 'Create a poll', launch: 'Share a launch', model: 'Share an AI model' };
    const options = type === 'poll' ? `<div class="field-label options-label">Options <span>2 to 5</span></div><div class="poll-option-fields"><label class="sr-only" for="poll-option-1">Option 1</label><input id="poll-option-1" name="options[]" maxlength="80" placeholder="Option 1" required><label class="sr-only" for="poll-option-2">Option 2</label><input id="poll-option-2" name="options[]" maxlength="80" placeholder="Option 2" required></div><button class="add-option" type="button" data-action="add-option">${icon('add', 15)} Add option</button>` : '';
    const launchUrl = type === 'launch' ? `<label class="field-label">Project link<input name="project_url" type="url" placeholder="https://your-project.com" required></label>` : '';
    const modelUrl = type === 'model' ? `<label class="field-label">Link<input name="project_url" type="url" placeholder="https://model-page.com"></label>` : '';
    const launchCategory = type === 'launch' ? `<label class="field-label">Project type<select name="launch_category" required><option value="ai_tool">AI tool</option><option value="ai_app">AI app</option><option value="app">App</option><option value="website">Website</option><option value="other">Other</option></select></label>` : '';
    const modelFields = type === 'model' ? `<label class="field-label">Provider<input name="model_provider" type="text" list="model-providers" maxlength="60" placeholder="OpenAI, Google, Meta…"><datalist id="model-providers">${MODEL_PROVIDERS.map((provider) => `<option value="${provider}">`).join('')}</datalist></label><label class="field-label">Access<select name="model_access"><option value="free">Free</option><option value="freemium">Freemium</option><option value="paid">Paid</option></select></label>` : '';
    const launchLogo = type === 'launch' ? `<label class="field-label image-upload-field">Logo <span class="image-upload-control">${icon('image', 20)}<input type="file" name="logo" accept=".svg,image/svg+xml,image/jpeg,image/png,image/webp"></span></label>` : '';
    const titleField = type !== 'discussion' ? `<label class="field-label">${type === 'launch' ? 'Project name' : type === 'model' ? 'Model name' : type === 'question' ? 'Your question' : 'Poll question'}<input name="title" type="text" maxlength="140" placeholder="${type === 'launch' ? 'Name your project' : type === 'model' ? 'e.g. OpenChat 70B' : type === 'question' ? 'What would you like help with?' : 'Ask something…'}" required></label>` : '';
    return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-dialog compose-dialog" role="dialog" aria-modal="true" aria-labelledby="compose-title">
        <button class="modal-close icon-button" data-action="close-modal" aria-label="Close">${icon('close', 20)}</button>
        <h2 id="compose-title">${titles[type]}</h2>
        <div class="compose-type-switch" role="tablist" aria-label="Choose a post type"><button class="${type === 'discussion' ? 'is-active' : ''}" data-action="compose-type" data-type="discussion">${icon('forum', 17)} Post</button><button class="${type === 'question' ? 'is-active' : ''}" data-action="compose-type" data-type="question">${icon('chat_bubble', 17)} Question</button><button class="${type === 'poll' ? 'is-active' : ''}" data-action="compose-type" data-type="poll">${icon('bar_chart', 17)} Poll</button><button class="${type === 'launch' ? 'is-active' : ''}" data-action="compose-type" data-type="launch">${icon('rocket_launch', 17)} Launch</button><button class="${type === 'model' ? 'is-active' : ''}" data-action="compose-type" data-type="model">${icon('smart_toy', 17)} Model</button></div>
        <form class="modal-form compose-form" data-form="compose" data-type="${type}">
            ${titleField}
            <label class="field-label">${type === 'launch' || type === 'model' ? 'Description' : type === 'poll' ? 'Context <span class="optional-label">Optional</span>' : type === 'question' ? 'Details' : 'Your post'}<textarea name="body" rows="4" maxlength="5000" placeholder="${type === 'launch' ? 'What does it do?' : type === 'model' ? 'What can it do, and what does it cost?' : type === 'poll' ? 'Add context…' : type === 'question' ? 'What have you tried?' : 'What are you making?'}" ${['discussion', 'question', 'launch', 'model'].includes(type) ? 'required' : ''}></textarea></label>
            ${options}
            ${launchLogo}
            ${type === 'launch' || type === 'model' ? '' : `<label class="field-label image-upload-field">Image <span class="image-upload-control">${icon('image', 20)}<input type="file" name="image" accept="image/jpeg,image/png,image/webp"></span></label>`}
            ${launchUrl}${modelUrl}${launchCategory}${modelFields}
            ${type !== 'launch' && type !== 'model' ? `<label class="field-label">Topic<select name="category"><option value="">None</option><option>AI models</option><option>Build in public</option><option>Promptcraft</option><option>Dev tools</option><option>Free tools</option></select></label>` : ''}
            <div class="form-message" data-form-message hidden></div>
            <div class="compose-submit-row"><button class="btn btn-primary" type="submit">${type === 'launch' ? 'Publish launch' : type === 'poll' ? 'Post poll' : type === 'model' ? 'Share model' : type === 'question' ? 'Post question' : 'Share post'}</button></div>
        </form>
    </section></div>`;
}

function renderAvatarPicker(user) {
    const selected = user.avatarUploaded ? 'keep' : (user.avatarChoice || 'neutral');
    const groups = ['Women', 'Men', 'Neutral'];
    return `<fieldset class="avatar-picker"><legend>Avatar</legend>
        ${user.avatarUploaded ? `<label class="avatar-current-choice"><input type="radio" name="avatar_choice" value="keep" ${selected === 'keep' ? 'checked' : ''}>${avatar(user.name || 'You', 'tone-neutral', 'avatar-choice-preview', user.avatarUrl)}<span>Keep photo</span></label>` : ''}
        <div class="avatar-picker-tools"><button type="button" class="btn btn-outline btn-small" data-action="random-avatar">${icon('shuffle', 16)} Random</button></div>
        ${groups.map((group) => `<div class="avatar-choice-group"><span>${group}</span><div class="avatar-choice-grid">${AVATAR_CHOICES.filter((choice) => choice.group === group).map((choice) => `<label class="avatar-choice ${selected === choice.key ? 'is-selected' : ''}" title="${choice.label}"><input type="radio" name="avatar_choice" value="${choice.key}" ${selected === choice.key ? 'checked' : ''}><img src="/avatars/${choice.key}.svg" alt="${choice.label}" loading="lazy"><span>${choice.label}</span></label>`).join('')}</div></div>`).join('')}
    </fieldset>`;
}

function renderCoverPicker(user) {
    const selected = user.coverChoice || 'aurora';
    return `<fieldset class="cover-picker"><legend>Cover</legend><div class="cover-choice-grid">${COVER_CHOICES.map((choice) => `<label class="cover-choice cover-swatch-${choice.key} ${selected === choice.key ? 'is-selected' : ''}" title="${choice.label}"><input type="radio" name="cover_choice" value="${choice.key}" ${selected === choice.key ? 'checked' : ''}><span class="visually-hidden">${choice.label}</span>${selected === choice.key ? icon('check', 18) : ''}</label>`).join('')}</div></fieldset>`;
}

function renderProfileModal() {
    const user = state.currentUser || {};
    const skills = Array.isArray(user.skills) ? user.skills.join(', ') : '';
    return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-dialog compose-dialog profile-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title"><button class="modal-close icon-button" data-action="close-modal" aria-label="Close">${icon('close', 21)}</button><h2 id="profile-edit-title">Edit profile</h2><form class="modal-form" data-form="profile"><label class="field-label">Name<input name="name" value="${escapeHtml(user.name || '')}" maxlength="80" minlength="2" required></label><label class="field-label">Username<input name="username" value="${escapeHtml(user.username || '')}" pattern="[A-Za-z0-9_]+" minlength="3" maxlength="24" required></label><label class="field-label">Profession<input name="profession" value="${escapeHtml(user.profession || '')}" maxlength="80" placeholder="Designer, developer, founder"></label><label class="field-label">Skills<input name="skills" value="${escapeHtml(skills)}" maxlength="420" placeholder="Python, React, product design"></label><label class="field-label">About you<textarea name="bio" rows="3" maxlength="280" placeholder="What are you making?">${escapeHtml(user.bio || '')}</textarea></label><label class="field-label">Website<input name="website" type="url" value="${escapeHtml(user.website || '')}" placeholder="https://your-site.com"></label>${renderCoverPicker(user)}${renderAvatarPicker(user)}<label class="field-label image-upload-field">Upload photo <span class="image-upload-control">${icon('photo_camera', 20)}<input type="file" name="avatar" accept="image/jpeg,image/png,image/webp"></span></label><div class="form-message" data-form-message hidden></div><div class="compose-submit-row"><button class="btn btn-primary" type="submit">Save profile</button></div></form></section></div>`;
}

function renderReportModal() {
    const post = state.posts.find((item) => item.id === String(state.reportPostId));
    return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-dialog compose-dialog report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-title"><button class="modal-close icon-button" data-action="close-modal" aria-label="Close">${icon('close', 21)}</button><h2 id="report-title">Report post</h2><form class="modal-form" data-form="report" data-post-id="${escapeHtml(post?.id || '')}"><label class="field-label">Reason<select name="reason" required><option value="">Choose a reason</option><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="misinformation">Misleading information</option><option value="unsafe">Unsafe content</option><option value="other">Something else</option></select></label><label class="field-label">Details <span class="optional-label">Optional</span><textarea name="details" rows="3" maxlength="1000" placeholder="Anything that may help moderators."></textarea></label><div class="form-message" data-form-message hidden></div><div class="compose-submit-row"><button class="btn btn-primary" type="submit">Send report</button></div></form></section></div>`;
}

function renderModal() {
    if (state.modal === 'auth') return renderAuthModal();
    if (state.modal === 'compose') return renderComposeModal();
    if (state.modal === 'profile') return renderProfileModal();
    if (state.modal === 'report') return renderReportModal();
    return '';
}

function renderPageContent() {
    if (state.page === 'launches') return renderLaunchPage();
    if (state.page === 'models') return renderModelsPage();
    if (state.page === 'rankings') return renderRankingsPage();
    if (state.page === 'community-chat') return renderCommunityChatPage();
    if (state.page === 'profile') return renderProfilePage();
    if (state.page === 'messages') return renderMessagesPage();
    if (state.page === 'admin') return renderAdminPage();
    if (['about', 'guidelines', 'privacy', 'terms'].includes(state.page)) return renderInfoPage();
    return `${renderHero()}${renderMain()}`;
}

function renderApp() {
    if (!root) return;
    root.innerHTML = `${renderHeader()}${renderPageContent()}${renderFooter()}${renderMobileNav()}${renderModal()}`;
    if (state.page === 'home') renderFeed();
    const title = ({ home: 'Discover', models: 'AI models', launches: 'Launches', rankings: 'Rankings', 'community-chat': 'Community chat', messages: 'Messages', admin: 'Admin panel', about: 'About', guidelines: 'Guidelines', privacy: 'Privacy', terms: 'Terms', profile: state.profileData?.user?.name || 'Profile' })[state.page] || 'VibeDock';
    document.title = `${title} | VibeDock`;
    document.body.classList.toggle('has-modal', Boolean(state.modal));
    if (state.modal === 'auth') {
        window.requestAnimationFrame(() => root.querySelector('.modal-dialog input')?.focus());
    } else if (state.modal === 'compose' || state.modal === 'profile' || state.modal === 'report') {
        window.requestAnimationFrame(() => root.querySelector('.modal-dialog input, .modal-dialog select, .modal-dialog textarea')?.focus());
    }
    if (state.page === 'profile' && state.profileUsername && state.profileLoadedFor !== state.profileUsername && !state.profileLoading) {
        void loadProfile(state.profileUsername);
    }
    if (state.page === 'messages' && !state.conversationsLoaded) {
        void loadConversations();
    }
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
    state.composeType = ['discussion', 'question', 'poll', 'launch', 'model'].includes(type) ? type : 'discussion';
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
    if (!apiEnabled) return;
    try {
        const response = await apiRequest('/api/feed');
        if (Array.isArray(response.data)) {
            state.posts = response.data.map(normalizePost);
            renderApp();
        }
    } catch {
        // The sample feed stays visible while the database is being set up.
    }
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
    state.groupChatLoading = true;
    if (!apiEnabled) {
        state.groupChatLoaded = true;
        state.groupChatLoading = false;
        renderApp();
        return;
    }
    const transcript = document.querySelector('#community-chat-transcript');
    const shouldStickToBottom = !isPolling || !transcript || transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight < 100;
    const lastMessage = state.groupMessages[state.groupMessages.length - 1];
    const afterId = isPolling ? Number(lastMessage?.id || 0) : 0;
    try {
        const result = await apiRequest(`/api/community-chat${afterId ? `?after_id=${afterId}` : ''}`);
        const data = Array.isArray(result.data) ? result.data : [];
        if (isPolling) {
            const existing = new Set(state.groupMessages.map((message) => String(message.id)));
            state.groupMessages.push(...data.filter((message) => !existing.has(String(message.id))));
        } else {
            state.groupMessages = data;
            state.groupChatLoaded = true;
        }
        if (data.length || !isPolling) {
            const page = document.querySelector('.community-chat-transcript');
            if (page) {
                page.innerHTML = `<div class="chat-date-label">Today</div>${state.groupMessages.map((message) => `<article class="community-chat-message ${message.sentByMe ? 'mine' : ''}">${avatar(message.user?.name || 'Member', toneFor(message.user?.name || ''), 'chat-avatar', message.user?.avatarUrl)}<div class="community-chat-message-body"><div><strong>${escapeHtml(message.user?.name || 'Member')}</strong><span>${escapeHtml(message.createdAt || 'just now')}</span></div><p>${escapeHtml(message.body)}</p></div></article>`).join('')}`;
                if (shouldStickToBottom) page.scrollTop = page.scrollHeight;
            }
        }
    } catch (error) {
        if (!isPolling) showToast(error.message);
        state.groupChatLoaded = true;
    } finally {
        state.groupChatLoading = false;
    }
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
        skills: author.skills || [],
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
    return { user, relationship: { isSelf: own, isFollowing: false, isFriend: false }, posts: authoredPosts };
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

async function loadThread(userOrId) {
    if (!state.currentUser) return;
    const user = typeof userOrId === 'object'
        ? userOrId
        : state.conversations.find((item) => String(item.user.id) === String(userOrId))?.user || state.messagePeer;
    if (!user?.id) return;
    state.selectedMessageUser = String(user.id);
    state.messagePeer = user;
    state.messages = [];
    state.messagesLoading = true;
    renderApp();
    try {
        if (apiEnabled) {
            const result = await apiRequest(`/api/messages/${encodeURIComponent(user.id)}`);
            state.messagePeer = result.user || user;
            state.messages = Array.isArray(result.data) ? result.data : [];
        }
    } catch (error) {
        showToast(error.message);
    } finally {
        state.messagesLoading = false;
        renderApp();
        const thread = document.querySelector('#thread-messages');
        if (thread) thread.scrollTop = thread.scrollHeight;
    }
}

async function loadConversations() {
    state.conversationsLoaded = true;
    state.friendRequestsLoaded = true;
    if (!apiEnabled || !state.currentUser) {
        state.conversations = [];
        state.friendRequests = [];
        return;
    }
    try {
        const [conversationsResult, requestsResult] = await Promise.all([
            apiRequest('/api/messages'),
            apiRequest('/api/friend-requests'),
        ]);
        state.conversations = Array.isArray(conversationsResult.data) ? conversationsResult.data : [];
        state.friendRequests = Array.isArray(requestsResult.data) ? requestsResult.data : [];
        if (!state.selectedMessageUser && state.conversations.length) {
            state.selectedMessageUser = String(state.conversations[0].user.id);
            state.messagePeer = state.conversations[0].user;
            await loadThread(state.conversations[0].user);
            return;
        }
        if (state.selectedMessageUser && !state.messagePeer) {
            await loadThread(state.selectedMessageUser);
            return;
        }
    } catch (error) {
        showToast(error.message);
    }
    renderApp();
}

async function openMessageThread(userOrId) {
    if (!state.currentUser) return openAuth('register');
    const user = typeof userOrId === 'object'
        ? userOrId
        : state.conversations.find((item) => String(item.user.id) === String(userOrId))?.user
            || (state.profileData?.user && String(state.profileData.user.id) === String(userOrId) ? state.profileData.user : null);
    if (!user) return showToast('Find this person through a profile first.');
    state.page = 'messages';
    state.profileUsername = null;
    state.initialPostId = null;
    state.selectedMessageUser = String(user.id);
    state.messagePeer = user;
    state.conversationsLoaded = false;
    window.history.pushState({}, '', '/messages');
    renderApp();
    await loadThread(user);
}

function navigateTo(page, username = null) {
    const allowed = ['home', 'models', 'launches', 'rankings', 'community-chat', 'messages', 'profile', 'admin', 'about', 'guidelines', 'privacy', 'terms'];
    const nextPage = allowed.includes(page) ? page : 'home';
    if (nextPage === 'admin' && apiEnabled) {
        window.location.assign('/admin');
        return;
    }
    if (['messages', 'community-chat'].includes(nextPage) && !state.currentUser) return openAuth('login');
    const nextUsername = nextPage === 'profile' ? (username || state.currentUser?.username || '') : null;
    if (nextPage === 'profile' && !nextUsername) return openAuth('login');
    state.page = nextPage;
    state.mobileMenu = false;
    state.modal = null;
    state.initialPostId = null;
    if (nextPage === 'profile') {
        if (state.profileUsername !== nextUsername) state.profileData = null;
        state.profileUsername = nextUsername;
    } else {
        state.profileUsername = null;
    }
    if (nextPage === 'community-chat' && !apiEnabled) state.groupChatLoaded = true;
    const path = nextPage === 'home' ? '/' : nextPage === 'profile' ? `/u/${encodeURIComponent(nextUsername)}` : `/${nextPage}`;
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
    if (state.page !== 'home') {
        state.page = 'home';
        state.profileUsername = null;
        state.initialPostId = null;
        window.history.pushState({}, '', '/');
    }
    state.filter = ['all', 'discussion', 'question', 'model', 'poll', 'launch', 'saved'].includes(filter) ? filter : 'all';
    state.tag = '';
    state.mobileMenu = false;
    renderHeaderAndFeedState();
}

function renderHeaderAndFeedState() {
    if (state.page !== 'home') {
        renderApp();
        return;
    }
    const header = document.querySelector('.site-header');
    if (header) header.outerHTML = renderHeader();
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
                'demo@vibedock.test': { password: 'VibeDockDemo2026!', name: 'Demo Maker', username: 'demomaker', avatarChoice: 'female-violet', coverChoice: 'blossom', isAdmin: false, profession: 'Independent maker', skills: ['Prototyping', 'AI tools', 'Product design'] },
                'admin@vibedock.test': { password: 'VibeDockAdmin2026!', name: 'Demo Admin', username: 'demoadmin', avatarChoice: 'male-indigo', coverChoice: 'ocean', isAdmin: true, profession: 'Community moderator', skills: ['Community building'] },
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
        state.modal = null;
        persistDemo();
        renderApp();
        showToast('Welcome!');
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
        model_provider: String(formData.get('model_provider') || '').trim(),
        model_access: String(formData.get('model_access') || 'free'),
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
                category: type === 'model' ? 'AI models' : payload.category,
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
                tags: type === 'model' ? ['AI models'] : (payload.category ? [payload.category] : []),
                options: type === 'poll' ? options : [],
                votes: type === 'poll' ? options.map(() => 0) : [],
                votedOption: null,
            });
            state.posts.unshift(post);
        }
        state.page = type === 'launch' ? 'launches' : type === 'model' ? 'models' : 'home';
        if (type === 'launch') state.rankingsLoaded = false;
        state.initialPostId = null;
        state.profileUsername = null;
        state.filter = type;
        state.tag = '';
        state.modal = null;
        window.history.pushState({}, '', type === 'launch' ? '/launches' : type === 'model' ? '/models' : '/');
        persistDemo();
        renderApp();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast(type === 'launch' ? 'Launch published!' : type === 'model' ? 'Model shared!' : type === 'poll' ? 'Poll posted!' : 'Posted!');
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
    if (state.page === 'home') {
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
        if (state.page !== 'home') {
            state.page = 'home';
            state.initialPostId = null;
            window.history.pushState({}, '', '/');
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
            const keepPhoto = avatarChoice === 'keep' && !hasAvatar && state.currentUser.avatarUploaded;
            const chosenAvatar = avatarChoice === 'keep' ? (state.currentUser.avatarChoice || 'neutral') : avatarChoice;
            state.currentUser = {
                ...state.currentUser,
                ...values,
                avatarChoice: chosenAvatar,
                coverChoice,
                avatarUploaded: hasAvatar || keepPhoto,
                avatarUrl: uploadedAvatar || (keepPhoto ? state.currentUser.avatarUrl : `/avatars/${chosenAvatar}.svg`),
            };
            writeStorage(STORAGE.user, state.currentUser);
        }
        state.profileUsername = state.currentUser.username;
        state.profileData = null;
        state.profileLoadedFor = null;
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
    const userId = String(form.dataset.userId || state.selectedMessageUser || '');
    const body = String(new FormData(form).get('body') || '').trim();
    if (!body || !userId) return;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
        if (apiEnabled) {
            const result = await apiRequest(`/api/messages/${encodeURIComponent(userId)}`, 'POST', { body });
            state.messages.push(result.message);
        } else {
            state.messages.push({ id: `local-${Date.now()}`, body, sentByMe: true, createdAt: 'just now' });
        }
        if (state.page === 'messages') renderApp();
        const thread = document.querySelector('#thread-messages');
        if (thread) thread.scrollTop = thread.scrollHeight;
    } catch (error) {
        showToast(error.message);
    } finally {
        if (submit.isConnected) submit.disabled = false;
    }
}

async function submitCommunityChat(form) {
    const body = String(new FormData(form).get('body') || '').trim();
    if (!body || !state.currentUser) return;
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    try {
        let message;
        if (apiEnabled) {
            const result = await apiRequest('/api/community-chat', 'POST', { body });
            message = result.message;
        } else {
            message = {
                id: `local-${Date.now()}`,
                body,
                createdAt: 'just now',
                sentByMe: true,
                user: { ...state.currentUser },
            };
        }
        state.groupMessages.push(message);
        if (!apiEnabled) writeStorage('vibedock-preview-chat', state.groupMessages);
        state.groupChatLoaded = true;
        renderApp();
        const transcript = document.querySelector('#community-chat-transcript');
        if (transcript) transcript.scrollTop = transcript.scrollHeight;
    } catch (error) {
        showToast(error.message);
    } finally {
        if (submit?.isConnected) submit.disabled = false;
    }
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
        state.page = 'home';
        state.profileUsername = null;
        state.initialPostId = String(target.dataset.postId || '');
        state.filter = 'all';
        window.history.pushState({}, '', `/posts/${encodeURIComponent(state.initialPostId)}`);
        renderApp();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    if (action === 'open-my-profile') return navigateTo('profile', state.currentUser?.username);
    if (action === 'edit-profile') {
        state.modal = 'profile';
        return renderApp();
    }
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
    if (action === 'toggle-free-only') {
        state.freeModelsOnly = !state.freeModelsOnly;
        const main = root.querySelector('.route-main');
        if (main) main.outerHTML = renderPageContent();
        return;
    }
    if (action === 'tag') {
        if (state.page !== 'home') {
            state.page = 'home';
            window.history.pushState({}, '', '/');
        }
        state.filter = 'all';
        state.initialPostId = null;
        state.tag = target.dataset.tag || '';
        renderHeaderAndFeedState();
        return;
    }
    if (action === 'clear-filter') {
        if (state.page !== 'home') {
            state.page = 'home';
            window.history.pushState({}, '', '/');
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
        if (header) header.outerHTML = renderHeader();
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
    if (event.target.matches('[data-search]')) {
        state.search = event.target.value;
        scheduleSearch(state.search);
        if (state.page === 'home') renderFeed();
    }
    if (event.target.matches('.thread-compose textarea, .community-chat-compose textarea')) {
        const field = event.target;
        field.style.height = 'auto';
        field.style.height = `${Math.min(field.scrollHeight, 140)}px`;
    }
});

root.addEventListener('change', (event) => {
    if (event.target.matches('[data-sort]')) {
        state.sort = event.target.value;
        renderFeed();
    }
    if (event.target.matches('input[name="avatar_choice"]')) {
        const form = event.target.closest('form');
        if (form) form.querySelectorAll('.avatar-choice').forEach((element) => element.classList.toggle('is-selected', element.contains(event.target)));
    }
    if (event.target.matches('input[name="cover_choice"]')) {
        const form = event.target.closest('form');
        if (form) form.querySelectorAll('.cover-choice').forEach((element) => element.classList.toggle('is-selected', element.contains(event.target)));
    }
});

root.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!form.matches('form[data-form]')) return;
    event.preventDefault();
    if (form.dataset.form === 'auth') await createAuth(form);
    if (form.dataset.form === 'compose') await createPost(form);
    if (form.dataset.form === 'comment') await submitComment(form);
    if (form.dataset.form === 'profile') await submitProfile(form);
    if (form.dataset.form === 'report') await submitReport(form);
    if (form.dataset.form === 'message') await submitMessage(form);
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
    if (state.modal) {
        closeModal();
        return;
    }
    if (state.menuPostId) {
        state.menuPostId = null;
        refreshPostView();
    }
    closeSearchDropdown();
});

document.addEventListener('click', (event) => {
    if (state.menuPostId && !event.target.closest('.post-more-wrap')) {
        state.menuPostId = null;
        refreshPostView();
    }
    if (!event.target.closest('.nav-search')) closeSearchDropdown();
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
    if (page === 'messages') state.conversationsLoaded = false;
    renderApp();
});

renderApp();
loadServerFeed();
