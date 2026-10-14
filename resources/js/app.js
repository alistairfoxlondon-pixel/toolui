import '../css/app.css';

const root = document.querySelector('#app');
const config = window.VibeDockConfig || { apiEnabled: false, currentUser: null };
const apiEnabled = config.apiEnabled === true;
const STORAGE = {
    user: 'vibedock-preview-user',
    posts: 'vibedock-preview-posts',
};

const seedPosts = [
    {
        id: 'seed-1',
        type: 'discussion',
        title: 'I finally shared my first draft',
        body: 'I almost kept polishing. I posted the rough version instead and got useful feedback that afternoon. What helps you share earlier?',
        authorName: 'Maya Chen',
        author: { id: 'demo-mayachen', name: 'Maya Chen', username: 'mayachen', avatarUrl: null },
        role: 'Product designer · building in public',
        tone: 'tone-coral',
        createdAt: '38 min ago',
        category: 'Build in public',
        tags: ['Build in public', 'First launch'],
        likes: 24,
        liked: false,
        commentsCount: 8,
        comments: [],
    },
    {
        id: 'seed-2',
        type: 'launch',
        title: 'Goodside, a slower kind of city guide',
        body: 'A small guide to independent places in your neighborhood. Built with a little AI help.',
        authorName: 'Ravi Patel',
        author: { id: 'demo-ravipatel', name: 'Ravi Patel', username: 'ravipatel', avatarUrl: null },
        role: 'Weekend maker',
        tone: 'tone-mint',
        createdAt: '2 hours ago',
        category: 'First launch',
        launchCategory: 'ai_app',
        tags: ['First launch', 'Local discovery'],
        likes: 37,
        upvotes: 18,
        downvotes: 2,
        launchVote: null,
        logoUrl: null,
        liked: false,
        commentsCount: 11,
        projectUrl: '',
        art: 'goodside',
        comments: [],
    },
    {
        id: 'seed-3',
        type: 'poll',
        title: 'What takes the most energy when you start?',
        body: 'Picking a direction can be harder than building the first version.',
        authorName: 'Noah Williams',
        author: { id: 'demo-noahbuilds', name: 'Noah Williams', username: 'noahbuilds', avatarUrl: null },
        role: 'Creative technologist',
        tone: 'tone-lilac',
        createdAt: '4 hours ago',
        category: 'Quick poll',
        tags: ['Process', 'Promptcraft'],
        options: ['Getting the first version out', 'Choosing what to build', 'Finding my first users', 'Knowing when to stop polishing'],
        votes: [0, 0, 0, 0],
        votedOption: null,
        likes: 6,
        liked: false,
        commentsCount: 14,
        comments: [],
    },
    {
        id: 'seed-4',
        type: 'discussion',
        title: 'A reminder for the messy middle',
        body: 'You can make something useful while you are still learning. Test it, ask for help, and keep going.',
        authorName: 'Ari Morgan',
        author: { id: 'demo-arimorgan', name: 'Ari Morgan', username: 'arimorgan', avatarUrl: null },
        role: 'Community member',
        tone: 'tone-sky',
        createdAt: 'yesterday',
        category: 'Encouragement',
        tags: ['Vibe coding', 'Learning out loud'],
        likes: 51,
        liked: false,
        commentsCount: 6,
        comments: [],
    },
];

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
        // The community remains usable if browser storage is unavailable.
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
        role: post.role || post.author?.profession || 'Community member',
        createdAt: post.createdAt || post.created_at || 'just now',
        category,
        tags: Array.isArray(post.tags) ? post.tags : (category ? [category] : []),
        projectUrl: post.projectUrl || post.project_url || '',
        launchCategory: post.launchCategory || post.launch_category || '',
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
    launches: 'launches', rankings: 'rankings', 'community-chat': 'community-chat',
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
    groupMessages: apiEnabled ? [] : readStorage('vibedock-preview-chat', [{ id: 1, body: 'Welcome to the community chat. What are you making today?', sentByMe: false, createdAt: 'today', user: { id: 'demo-mayachen', name: 'Maya Chen', username: 'mayachen', avatarUrl: '/avatars/female-rose.svg' } }]),
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
    modal: config.initialAuthMode ? 'auth' : null,
    authMode: config.initialAuthMode || 'register',
    flashMessage: config.flashMessage || '',
    composeType: 'discussion',
    reportPostId: null,
    mobileMenu: false,
    commentingId: null,
};

const icons = {
    search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4.3 4.3"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowUpRight: '<path d="M7 17 17 7M7 7h10v10"/>',
    arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    arrowDown: '<path d="M12 5v14M18 13l-6 6-6-6"/>',
    chart: '<path d="M4 19V5M4 19h17M8 15l4-4 3 2 5-6"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.7 8.3-2.1 5.3-5.3 2.1 2.1-5.3 5.3-2.1Z"/>',
    rocket: '<path d="M4.5 15.5c-1.2 1-1.4 4-1.4 4s3-.2 4-1.4l2-2-2.6-2.6-2 2Z"/><path d="M10 13.5c2.3-2.7 3.9-6.2 4.6-10.2 4 .7 7.4 2.3 10.2 4.6-.6 3.5-2.4 6.8-5.1 9.3-2.5 2.3-6.3 3.7-9.7 4.4l-.7-8.1Z"/><circle cx="16.2" cy="9.8" r="1.7"/>',
    chat: '<path d="M20 11.5a7.3 7.3 0 0 1-7.7 7.3 8.4 8.4 0 0 1-3.2-.7L4 20l1.4-4.5a7.2 7.2 0 1 1 14.6-4Z"/>',
    poll: '<path d="M5 19V9M12 19V5M19 19v-7"/><path d="M3 19h18"/>',
    heart: '<path d="M20.8 8.8c0 5.2-8.8 10-8.8 10S3.2 14 3.2 8.8A4.6 4.6 0 0 1 12 6.2a4.6 4.6 0 0 1 8.8 2.6Z"/>',
    message: '<path d="M20.5 11.4a7.2 7.2 0 0 1-7.6 7.2 8.3 8.3 0 0 1-3.1-.7L4 19.8l1.4-4.4a7.1 7.1 0 1 1 15.1-4Z"/><path d="M8.5 11.5h.01M12.2 11.5h.01M15.9 11.5h.01"/>',
    bookmark: '<path d="M6.5 4.5h11a1 1 0 0 1 1 1v15l-6.5-4-6.5 4v-15a1 1 0 0 1 1-1Z"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M7.5 3v4M16.5 3v4M3.5 9.5h17"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3.5 12h17M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3Z"/>',
    send: '<path d="m21 3-7.5 18-3.8-7.7L2 9.5 21 3Z"/><path d="M9.7 13.3 21 3"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    lock: '<rect x="4.5" y="10" width="15" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3"/>',
    users: '<path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 11a3 3 0 1 0-.1-6M21 20v-1.5a4 4 0 0 0-3-3.9"/>',
    tag: '<path d="M20 13 13 20l-9-9V4h7l9 9Z"/><circle cx="8" cy="8" r="1"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
    hands: '<path d="M8 12V7a2 2 0 0 1 4 0v5M12 11V5a2 2 0 0 1 4 0v8M16 12V8a2 2 0 0 1 4 0v7a7 7 0 0 1-7 7h-1a7 7 0 0 1-5-2l-3-3a2 2 0 0 1 3-3l2 2"/>',
    flag: '<path d="M5 21V4M5 4c5-3 9 3 14 0v11c-5 3-9-3-14 0"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.2 2-2 3.4-2.3-.5a8 8 0 0 1-1.4.8l-.8 2.2h-4l-.8-2.2a8 8 0 0 1-1.4-.8l-2.3.5-2-3.4 1.2-2a8 8 0 0 1 0-1.6l-1.2-2 2-3.4 2.3.5a8 8 0 0 1 1.4-.8L10 5.5h4l.8 2.2a8 8 0 0 1 1.4.8l2.3-.5 2 3.4-1.2 2a8 8 0 0 1 .1 1.6Z"/>',
};

function icon(name, size = 21, className = '') {
    return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.compass}</svg>`;
}

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

function initials(name = 'Vibe maker') {
    return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'V';
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
    return ({ discussion: 'Conversation', question: 'Question', poll: 'Quick poll', launch: 'Product launch', repost: 'Shared post' })[type] || 'Community post';
}

function typeIcon(type) {
    return ({ discussion: 'chat', question: 'chat', poll: 'poll', launch: 'rocket', repost: 'repeat' })[type] || 'compass';
}

function brandMark() {
    return `<span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 38 38" fill="none"><rect x="1" y="1" width="36" height="36" rx="8" fill="currentColor"/><path d="m10 12 8.2 15L27 12" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
}

function renderSearchResults() {
    const query = state.search.trim();
    if (!query) return '';
    if (query.length < 2) return `<div class="search-results" id="community-search-results"><p class="search-hint">Type at least 2 characters to search.</p></div>`;
    if (state.searchResultsLoading) return `<div class="search-results" id="community-search-results"><p class="search-hint">Searching the community</p></div>`;
    const users = state.searchResults.users || [];
    const posts = state.searchResults.posts || [];
    if (!users.length && !posts.length) return `<div class="search-results" id="community-search-results"><p class="search-hint">No matches. Try another search.</p></div>`;
    return `<div class="search-results" id="community-search-results" role="listbox">${users.length ? `<span class="search-results-label">People</span>${users.map((user) => `<button class="search-result" role="option" data-action="open-profile" data-username="${escapeHtml(user.username)}">${avatar(user.name, toneFor(user.name), 'avatar-search', user.avatarUrl)}<span><strong>${escapeHtml(user.name)}</strong><small>@${escapeHtml(user.username)}</small></span>${icon('arrowUpRight', 17)}</button>`).join('')}` : ''}${posts.length ? `<span class="search-results-label">Posts and projects</span>${posts.map((post) => `<button class="search-result" role="option" data-action="open-post" data-post-id="${escapeHtml(post.id)}"><span class="search-result-type">${icon(typeIcon(post.type), 18)}</span><span><strong>${escapeHtml(post.title)}</strong><small>${escapeHtml(post.authorName || post.username || 'Community member')}</small></span>${icon('arrowUpRight', 17)}</button>`).join('')}` : ''}</div>`;
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

function renderHeader() {
    const profileName = state.currentUser?.username || '';
    const userArea = state.currentUser
        ? `<div class="signed-in-actions"><button class="btn btn-primary btn-small header-share" data-action="open-compose" data-type="discussion">${icon('plus', 18)}<span>Share a post</span></button><button class="header-icon-link" data-action="go-page" data-page="messages" aria-label="Open direct messages">${icon('message', 21)}</button><button class="user-pill" data-action="open-my-profile" title="View your profile">${avatar(state.currentUser.name, toneFor(state.currentUser.name), 'avatar-small', state.currentUser.avatarUrl)}<span class="user-pill-name">@${escapeHtml(profileName || state.currentUser.name.split(' ')[0])}</span></button>${state.currentUser.isAdmin ? `<a class="admin-shortcut" href="/admin">Admin</a>` : ''}<button class="sign-out-link" data-action="logout">Sign out</button></div>`
        : `<div class="signed-out-actions"><button class="text-button" data-action="open-auth" data-mode="login">Sign in</button><button class="btn btn-primary btn-small" data-action="open-auth" data-mode="register">Join free</button></div>`;

    const pages = [
        ['home', 'Discover'], ['launches', 'Launches'], ['rankings', 'Rankings'], ['community-chat', 'Community chat'],
    ];
    if (state.currentUser) pages.push(['messages', 'Messages']);

    return `<header class="site-header">
        <div class="nav-shell">
            <a class="brand" href="/" aria-label="VibeDock home" data-action="go-page" data-page="home">${brandMark()}<span class="brand-word">vibe<span>dock</span></span></a>
            <nav class="desktop-nav" aria-label="Main navigation">${pages.map(([page, label]) => `<button class="nav-link ${state.page === page ? 'is-active' : ''}" data-action="go-page" data-page="${page}">${label}</button>`).join('')}</nav>
            <div class="nav-search">
                ${icon('search', 21)}
                <input type="search" aria-label="Search community" placeholder="Search people and projects" value="${escapeHtml(state.search)}" data-search autocomplete="off" aria-controls="community-search-results">
                ${renderSearchResults()}
            </div>
            <div class="nav-actions">${userArea}<button class="mobile-menu-toggle icon-button" aria-label="Toggle navigation" aria-expanded="${state.mobileMenu}" data-action="toggle-menu">${icon(state.mobileMenu ? 'close' : 'menu', 22)}</button></div>
        </div>
        ${state.mobileMenu ? `<nav class="mobile-nav" aria-label="Mobile navigation">${pages.map(([page, label]) => `<button data-action="go-page" data-page="${page}">${icon(page === 'home' ? 'compass' : page === 'launches' ? 'rocket' : page === 'rankings' ? 'chart' : page === 'community-chat' ? 'users' : 'message', 21)} ${label}</button>`).join('')}${state.currentUser ? `<button data-action="open-my-profile">${icon('user', 21)} Your profile</button><button data-action="logout">${icon('close', 21)} Sign out</button>` : ''}</nav>` : ''}
    </header>`;
}

function renderHero() {
    return `<section class="hero" id="top">
        <div class="hero-shell">
            <div class="hero-copy">
                <div class="hero-eyebrow">A COMMUNITY FOR MAKERS</div>
                <h1>Build ideas.<br><span>Grow together.</span></h1>
                <p>Share early work, get feedback, and meet fellow makers.</p>
                <div class="hero-actions">
                    <button class="btn btn-light" data-action="open-auth" data-mode="register">Join the community ${icon('arrow', 19)}</button>
                    <button class="hero-secondary" data-action="go-page" data-page="launches">Explore launches ${icon('arrowUpRight', 18)}</button>
                </div>
            </div>
            <div class="hero-visual">
                <img class="hero-maker-image" src="/images/hero-maker.png" alt="A maker working at a laptop" width="711" height="848" fetchpriority="high">
            </div>
        </div>
    </section>`;
}

const popularTopics = ['Build in public', 'Promptcraft', 'First launch', 'No code', 'Learning out loud'];

function renderLeftRail() {
    const menu = [
        ['all', 'compass', 'For you'],
        ['discussion', 'chat', 'Discussions'],
        ['question', 'message', 'Questions'],
        ['launch', 'rocket', 'Launches'],
        ['poll', 'poll', 'Polls'],
        ['saved', 'bookmark', 'Saved posts'],
    ];
    return `<aside class="left-rail" aria-label="Community filters">
        ${state.currentUser ? `<button class="rail-user-card" data-action="open-my-profile">${avatar(state.currentUser.name, toneFor(state.currentUser.name), 'avatar-small', state.currentUser.avatarUrl)}<span><strong>${escapeHtml(state.currentUser.name)}</strong><small>@${escapeHtml(state.currentUser.username || 'member')}</small></span>${icon('arrowUpRight', 18)}</button>` : ''}
        <div class="rail-card rail-menu-card">
            <div class="rail-heading">YOUR COMMUNITY</div>
            <nav class="rail-menu">${menu.map(([filter, glyph, label]) => `<button class="rail-link ${state.filter === filter ? 'is-active' : ''}" data-action="filter" data-filter="${filter}"><span class="rail-icon">${icon(glyph, 20)}</span><span>${label}</span></button>`).join('')}</nav>
        </div>
        <div class="rail-card topics-card">
            <div class="rail-heading">POPULAR TOPICS</div>
            <div class="topic-list">${popularTopics.slice(0, 4).map((topic) => `<button class="topic-link" data-action="tag" data-tag="${escapeHtml(topic)}"><span class="topic-hash">#</span><span>${escapeHtml(topic)}</span></button>`).join('')}</div>
            <button class="topic-more" data-action="clear-filter">Clear topic filters ${icon('arrow', 16)}</button>
        </div>
        <div class="preview-note">${apiEnabled ? 'A place to build together.' : 'Preview changes stay in this browser.'}</div>
    </aside>`;
}

function renderComposer() {
    const name = state.currentUser?.name || 'you';
    return `<div class="composer-card">
        <div class="composer-main">${avatar(state.currentUser?.name || 'You', state.currentUser ? toneFor(state.currentUser.name) : 'tone-neutral', 'avatar-composer')}<button class="composer-prompt" data-action="open-compose" data-type="discussion">Hey ${escapeHtml(name.split(' ')[0])}, what are you making today?</button><button class="composer-open icon-button" aria-label="Start a post" data-action="open-compose" data-type="discussion">${icon('plus', 19)}</button></div>
        <div class="composer-divider"></div>
        <div class="composer-shortcuts"><button data-action="open-compose" data-type="discussion">${icon('chat', 19)}<span>Start a discussion</span></button><button data-action="open-compose" data-type="question">${icon('message', 19)}<span>Ask a question</span></button><button data-action="open-compose" data-type="poll">${icon('poll', 19)}<span>Create a poll</span></button><button data-action="open-compose" data-type="launch">${icon('rocket', 19)}<span>Share a launch</span></button></div>
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
    const category = labels[post.launchCategory] || 'Community launch';
    const upvotes = Number(post.upvotes || 0);
    const downvotes = Number(post.downvotes || 0);
    return `<div class="launch-preview-card">
        <div class="launch-brand-tile">${logo ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(post.title)} logo" loading="lazy">` : icon('rocket', 27)}</div>
        <div class="launch-preview-info"><span class="launch-overline">${escapeHtml(category)}</span><strong>${escapeHtml(domain)}</strong></div>
        ${safe ? `<a class="launch-open" href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer" aria-label="Visit ${escapeHtml(post.title)}">${icon('arrowUpRight', 20)}</a>` : ''}
        <div class="launch-vote-controls" role="group" aria-label="Vote on ${escapeHtml(post.title)}">
            <button class="launch-vote-button ${post.launchVote === 1 ? 'is-selected' : ''}" data-action="launch-vote" data-post-id="${escapeHtml(post.id)}" data-vote="1" aria-label="Upvote ${escapeHtml(post.title)}" aria-pressed="${post.launchVote === 1}">${icon('arrowUp', 19)}<span>${upvotes}</span></button>
            <button class="launch-vote-button ${post.launchVote === -1 ? 'is-selected' : ''}" data-action="launch-vote" data-post-id="${escapeHtml(post.id)}" data-vote="-1" aria-label="Downvote ${escapeHtml(post.title)}" aria-pressed="${post.launchVote === -1}">${icon('arrowDown', 19)}<span>${downvotes}</span></button>
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
                ${hasVoted ? '<span class="poll-progress-bar"></span>' : ''}
            </button>`;
        }).join('')}</div>
        <div class="poll-footnote">${total ? `${total} ${total === 1 ? 'vote' : 'votes'}` : 'Be the first to vote'} <span>·</span> ${hasVoted ? 'Thanks for weighing in' : 'Cast your vote to see the results'}</div>
    </div>`;
}

function renderCommentPreview(post) {
    if (!post.latestComment) return '';
    return `<div class="latest-comment">${avatar(post.latestComment.authorName, toneFor(post.latestComment.authorName), 'avatar-mini')}<p><strong>${escapeHtml(post.latestComment.authorName)}</strong> ${escapeHtml(post.latestComment.body)}</p></div>`;
}

function renderCommentForm(post) {
    return `<form class="comment-form" data-form="comment" data-post-id="${escapeHtml(post.id)}">${avatar(state.currentUser?.name || 'You', toneFor(state.currentUser?.name || 'You'), 'avatar-mini')}<label class="visually-hidden" for="comment-${escapeHtml(post.id)}">Write a reply</label><input id="comment-${escapeHtml(post.id)}" name="body" maxlength="2000" placeholder="Add something kind or useful…" required><button type="submit" aria-label="Post reply">${icon('send', 17)}</button></form>`;
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
    const actionMenu = `<div class="post-more-wrap"><button class="post-more icon-button" aria-label="More options" aria-expanded="${menuOpen}" data-action="post-menu" data-post-id="${escapeHtml(post.id)}">${icon('more', 21)}</button>${menuOpen ? `<div class="post-menu" role="menu"><button role="menuitem" data-action="save-post" data-post-id="${escapeHtml(post.id)}">${icon('bookmark', 17)} ${state.savedIds.includes(post.id) ? 'Remove saved post' : 'Save for later'}</button><button role="menuitem" data-action="share" data-post-id="${escapeHtml(post.id)}">${icon('send', 17)} Copy post link</button>${canReport ? `<button role="menuitem" data-action="report-post" data-post-id="${escapeHtml(actionPost.id)}">${icon('flag', 17)} Report this post</button>` : ''}</div>` : ''}</div>`;
    const authorLink = authorUsername
        ? `<a class="post-avatar-link" href="${safeProfilePath}" data-action="open-profile" data-username="${escapeHtml(authorUsername)}">${avatar(authorName, post.tone || toneFor(authorName), 'avatar-post', post.author?.avatarUrl)}</a>`
        : avatar(authorName, post.tone || toneFor(authorName), 'avatar-post', post.author?.avatarUrl);
    const sourceAuthor = contentPost.author?.username
        ? `<a href="/u/${encodeURIComponent(contentPost.author.username)}" data-action="open-profile" data-username="${escapeHtml(contentPost.author.username)}">${escapeHtml(contentPost.authorName || contentPost.author?.name || 'Community member')}</a>`
        : `<strong>${escapeHtml(contentPost.authorName || 'Community member')}</strong>`;
    const originalContent = type === 'repost'
        ? `<div class="repost-source-label">Original post by ${sourceAuthor}</div>`
        : '';

    return `<article class="post-card" data-post="${escapeHtml(post.id)}">
        ${type === 'repost' ? `<div class="repost-label">${icon('repeat', 17)} ${escapeHtml(authorName)} shared a post</div>` : ''}
        <div class="post-header">
            ${authorLink}
            <div class="post-author"><div class="author-line"><a class="author-name" href="${safeProfilePath}" data-action="${authorUsername ? 'open-profile' : 'noop'}" data-username="${escapeHtml(authorUsername)}">${escapeHtml(authorName)}</a>${post.isFeatured ? '<span class="author-badge">Community pick</span>' : ''}</div><div class="author-meta">${escapeHtml(post.role || 'Vibe coder')} <span>·</span> ${escapeHtml(post.createdAt || 'just now')}</div></div>
            <span class="post-type type-${escapeHtml(type)}">${icon(typeIcon(type), 17)}${escapeHtml(prettyType(type))}</span>
            ${actionMenu}
        </div>
        <div class="post-content">
            ${type === 'repost' && post.body ? `<p class="repost-note">${escapeHtml(post.body)}</p>` : ''}
            ${originalContent}
            ${contentPost.title ? `<h3>${escapeHtml(contentPost.title)}</h3>` : ''}
            ${contentPost.body ? `<p>${escapeHtml(contentPost.body)}</p>` : ''}
            ${contentType === 'launch' ? renderLaunchPreview(contentPost) : ''}
            ${contentType === 'poll' ? renderPoll(actionPost) : ''}
            ${imageUrl ? `<img class="post-image" src="${escapeHtml(imageUrl)}" alt="Image shared by ${escapeHtml(contentPost.authorName || 'a community member')}" loading="lazy">` : ''}
            ${renderTagButtons(contentPost)}
        </div>
        ${renderCommentPreview(actionPost)}
        <div class="post-footer">
            <div class="post-actions">
                <button class="post-action ${actionPost.liked ? 'is-liked' : ''}" data-action="like" data-post-id="${escapeHtml(actionPost.id)}" aria-pressed="${actionPost.liked ? 'true' : 'false'}">${icon('heart', 20)}<span>${Number(actionPost.likes || 0) || 'Like'}</span></button>
                <button class="post-action reaction-action ${actionPost.myReaction === 'celebrate' ? 'is-selected' : ''}" data-action="react" data-reaction="celebrate" data-post-id="${escapeHtml(actionPost.id)}" aria-pressed="${actionPost.myReaction === 'celebrate'}">${icon('hands', 20)}<span>Celebrate ${Number(reactions.celebrate || 0) || ''}</span></button>
                <button class="post-action reaction-action ${actionPost.myReaction === 'helpful' ? 'is-selected' : ''}" data-action="react" data-reaction="helpful" data-post-id="${escapeHtml(actionPost.id)}" aria-pressed="${actionPost.myReaction === 'helpful'}">${icon('check', 20)}<span>Helpful ${Number(reactions.helpful || 0) || ''}</span></button>
                <button class="post-action reaction-action ${actionPost.myReaction === 'support' ? 'is-selected' : ''}" data-action="react" data-reaction="support" data-post-id="${escapeHtml(actionPost.id)}" aria-pressed="${actionPost.myReaction === 'support'}">${icon('users', 20)}<span>Support ${Number(reactions.support || 0) || ''}</span></button>
                <button class="post-action" data-action="comment-toggle" data-post-id="${escapeHtml(actionPost.id)}" aria-expanded="${state.commentingId === actionPost.id}">${icon('message', 20)}<span>${comments || 'Comment'}</span></button>
                <button class="post-action" data-action="repost" data-post-id="${escapeHtml(actionPost.id)}">${icon('repeat', 20)}<span>Repost ${Number(actionPost.repostsCount || 0) || ''}</span></button>
                <button class="post-action share-action" data-action="share" data-post-id="${escapeHtml(post.id)}">${icon('send', 19)}<span>Share</span></button>
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
    if (state.filter === 'all' && state.sort === 'popular') posts.sort((a, b) => Number(b.likes || 0) - Number(a.likes || 0));
    return posts;
}

function renderFeed() {
    const list = document.querySelector('.feed-list');
    const count = document.querySelector('.feed-result-count');
    const empty = document.querySelector('.feed-empty');
    const clearTag = document.querySelector('.active-tag-filter');
    if (!list) return;
    const posts = filteredPosts();
    list.innerHTML = posts.map(renderPost).join('');
    if (count) count.textContent = `${posts.length} ${posts.length === 1 ? 'post' : 'posts'}`;
    if (empty) empty.hidden = posts.length > 0;
    if (clearTag) {
        clearTag.hidden = !state.tag;
        clearTag.innerHTML = state.tag ? `Showing <strong>#${escapeHtml(state.tag)}</strong><button data-action="clear-filter" aria-label="Clear topic filter">${icon('close', 14)}</button>` : '';
    }
    document.querySelectorAll('[data-filter]').forEach((button) => button.classList.toggle('is-active', button.dataset.filter === state.filter));
}

function renderRightRail() {
    const featured = state.posts.find((post) => post.type === 'launch');
    return `<aside class="right-rail" aria-label="Community links">
        <div class="rail-card spotlight-card">
            <div class="spotlight-header"><div><span class="rail-heading">ON THE DOCK</span><h3>${featured ? escapeHtml(featured.title) : 'Your next idea could be here.'}</h3></div><span class="spotlight-icon">${icon('rocket', 20)}</span></div>
            <button class="spotlight-link" data-action="go-page" data-page="launches">Browse launches ${icon('arrow', 16)}</button>
        </div>
        <div class="rail-card ranking-promo">
            <span class="ranking-promo-icon">${icon('chart', 21)}</span>
            <strong>Meet this week's makers</strong>
            <button class="spotlight-link" data-action="go-page" data-page="rankings">View community rankings ${icon('arrow', 16)}</button>
        </div>
        <div class="right-footer"><button data-action="go-page" data-page="guidelines">Guidelines</button><button data-action="go-page" data-page="about">About</button><button data-action="go-page" data-page="privacy">Privacy</button></div>
    </aside>`;
}

function renderFeedSection() {
    const filters = [
        ['all', 'All activity'],
        ['discussion', 'Discussions'],
        ['question', 'Questions'],
        ['launch', 'Launches'],
        ['poll', 'Polls'],
        ['saved', 'Saved'],
    ];
    return `<main class="feed-column" id="community-feed">
        <div class="feed-toolbar">
            <div class="feed-tabs" role="tablist" aria-label="Filter community feed">${filters.map(([filter, label]) => `<button class="feed-tab ${state.filter === filter ? 'is-active' : ''}" role="tab" aria-selected="${state.filter === filter}" data-action="filter" data-filter="${filter}">${label}</button>`).join('')}</div>
            <label class="sort-control"><span class="visually-hidden">Sort posts</span><select data-sort aria-label="Sort posts"><option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Newest</option><option value="popular" ${state.sort === 'popular' ? 'selected' : ''}>Popular</option></select>${icon('arrow', 14)}</label>
        </div>
        <div class="active-tag-filter" hidden></div>
        ${renderComposer()}
        <div class="feed-list" aria-live="polite"></div>
        <div class="feed-empty" hidden><span class="empty-icon">${icon('search', 22)}</span><strong>Nothing here just yet</strong><p>Try another search, or be the first to start this conversation.</p><button class="btn btn-outline btn-small" data-action="clear-filter">Clear filters</button></div>
        <div class="feed-bottom-note"><span class="feed-note-dot"></span> You're all caught up. Go make something good.</div>
    </main>`;
}

function renderMain() {
    return `<section class="community-section" id="community">
        <div class="section-shell">
            <div class="section-intro">
                <div><div class="section-eyebrow">COMMUNITY FEED</div><h2>Ideas in progress</h2></div>
                ${state.currentUser ? `<button class="btn btn-outline" data-action="open-compose" data-type="discussion">${icon('plus', 19)} Share an idea</button>` : ''}
            </div>
            <div class="community-grid">${renderLeftRail()}${renderFeedSection()}${renderRightRail()}</div>
        </div>
    </section>`;
}

function renderProfilePage() {
    const data = state.profileData;
    if (state.profileLoading) return `<main class="route-main"><div class="route-loading">Loading this profile</div></main>`;
    if (!data?.user) return `<main class="route-main"><section class="route-empty"><span class="route-empty-icon">${icon('user', 30)}</span><h1>We could not find that profile</h1><p>Check the username or head back to the community feed.</p><button class="btn btn-primary" data-action="go-page" data-page="home">Back to the community</button></section></main>`;

    const user = data.user;
    const relation = data.relationship || {};
    const isSelf = Boolean(relation.isSelf);
    const safeWebsite = safeUrl(user.website || '');
    const profilePosts = (data.posts || []).map(normalizePost).filter((post) => !state.search || `${post.title} ${post.body} ${post.category}`.toLowerCase().includes(state.search.toLowerCase()));
    let relationActions = '';
    if (isSelf) {
        relationActions = `<button class="btn btn-outline" data-action="edit-profile">${icon('settings', 18)} Edit profile</button><button class="btn btn-primary" data-action="view-friend-requests">Friend requests${state.friendRequests.length ? `<span class="request-count">${state.friendRequests.length}</span>` : ''}</button>`;
    } else if (relation.isFriend) {
        relationActions = `<button class="btn btn-primary" data-action="start-message" data-user-id="${escapeHtml(user.id)}">${icon('message', 18)} Message</button><button class="btn btn-outline" data-action="remove-friend" data-user-id="${escapeHtml(user.id)}">Friends</button>`;
    } else if (relation.friendRequestDirection === 'incoming') {
        relationActions = `<button class="btn btn-primary" data-action="respond-friend" data-request-id="${escapeHtml(relation.friendRequestId)}" data-response="accept">Accept request</button><button class="btn btn-outline" data-action="respond-friend" data-request-id="${escapeHtml(relation.friendRequestId)}" data-response="decline">Not now</button>`;
    } else if (relation.friendRequestDirection === 'outgoing') {
        relationActions = `<button class="btn btn-outline" disabled>Request sent</button>`;
    } else if (state.currentUser) {
        relationActions = `<button class="btn btn-primary" data-action="send-friend-request" data-user-id="${escapeHtml(user.id)}">${icon('users', 18)} Add friend</button>`;
    } else {
        relationActions = `<button class="btn btn-primary" data-action="open-auth" data-mode="register">Join to connect</button>`;
    }
    const followButton = !isSelf ? `<button class="btn btn-outline follow-button ${relation.isFollowing ? 'is-following' : ''}" data-action="toggle-follow" data-user-id="${escapeHtml(user.id)}">${relation.isFollowing ? 'Following' : 'Follow'}</button>` : '';

    return `<main class="route-main profile-page">
        <section class="profile-card">
            <div class="profile-cover"><span>MAKING THINGS, TOGETHER</span></div>
            <div class="profile-detail">
                <div class="profile-avatar-wrap">${avatar(user.name, toneFor(user.name), 'avatar-profile-hero', user.avatarUrl)}</div>
                <div class="profile-heading-row"><div><h1>${escapeHtml(user.name)}</h1><span class="profile-handle">@${escapeHtml(user.username)}</span></div><div class="profile-actions">${relationActions}${followButton}</div></div>
                ${user.bio ? `<p class="profile-bio">${escapeHtml(user.bio)}</p>` : isSelf ? `<p class="profile-bio muted">Add a short introduction.</p>` : ''}
                ${user.profession ? `<p class="profile-profession">${icon('user', 18)} ${escapeHtml(user.profession)}</p>` : ''}
                <div class="profile-meta">${safeWebsite ? `<a href="${escapeHtml(safeWebsite)}" target="_blank" rel="noopener noreferrer">${icon('globe', 18)} ${escapeHtml(new URL(safeWebsite).hostname.replace(/^www\./, ''))}</a>` : ''}</div>
                ${Array.isArray(user.skills) && user.skills.length ? `<div class="profile-skills"><strong>Skills</strong><div>${user.skills.slice(0, 12).map((skill) => `<span>${escapeHtml(skill)}</span>`).join('')}</div></div>` : ''}
                <div class="profile-stats"><div><strong>${Number(user.postsCount || 0)}</strong><span>Posts</span></div><div><strong>${Number(user.followersCount || 0)}</strong><span>Followers</span></div><div><strong>${Number(user.followingCount || 0)}</strong><span>Following</span></div><div><strong>${Number(user.friendsCount || 0)}</strong><span>Friends</span></div></div>
            </div>
        </section>
        ${isSelf && state.friendRequests.length ? `<section class="friend-request-strip"><div><strong>Friend requests</strong><span>${state.friendRequests.length} ${state.friendRequests.length === 1 ? 'person is' : 'people are'} hoping to connect</span></div>${state.friendRequests.slice(0, 3).map((request) => `<div class="friend-request-chip">${avatar(request.user.name, toneFor(request.user.name), 'avatar-small', request.user.avatarUrl)}<span>@${escapeHtml(request.user.username)}</span><button data-action="respond-friend" data-request-id="${escapeHtml(request.id)}" data-response="accept">Accept</button></div>`).join('')}</section>` : ''}
        <section class="profile-posts"><div class="route-section-heading"><div><span class="route-eyebrow">MAKER NOTES</span><h2>${isSelf ? 'Your posts' : `${escapeHtml(user.name)}'s posts`}</h2></div>${isSelf ? `<button class="btn btn-primary btn-small" data-action="open-compose" data-type="discussion">${icon('plus', 17)} Share a post</button>` : ''}</div><div class="profile-post-list">${profilePosts.length ? profilePosts.map(renderPost).join('') : `<div class="route-empty compact"><strong>No posts yet</strong><p>New posts from this profile will appear here.</p></div>`}</div></section>
    </main>`;
}

function renderLaunchPage() {
    const query = state.search.trim().toLowerCase();
    const launches = state.posts.filter((post) => post.type === 'launch' && !post.isHidden && (!query || `${post.title} ${post.body} ${post.authorName} ${post.category}`.toLowerCase().includes(query)));
    return `<main class="route-main launch-page">
        <section class="launch-page-intro"><div><span class="route-eyebrow">COMMUNITY SHOWCASE</span><h1>New launches</h1><p>Discover tools and projects made by community members.</p></div><button class="btn btn-primary" data-action="open-compose" data-type="launch">${icon('plus', 20)} Share a launch</button></section>
        <div class="launch-page-toolbar"><div><h2>Recently shared</h2><span>${launches.length} projects</span></div><button class="text-button" data-action="go-page" data-page="rankings">View rankings ${icon('arrow', 17)}</button></div>
        <section class="launch-grid">${launches.length ? launches.map(renderPost).join('') : `<div class="route-empty compact"><span class="route-empty-icon">${icon('rocket', 30)}</span><strong>No launches yet</strong><p>Be the first to share a project.</p><button class="btn btn-outline btn-small" data-action="open-compose" data-type="launch">Share a launch</button></div>`}</section>
    </main>`;
}

function localRankings() {
    const tools = state.posts.filter((post) => post.type === 'launch' && !post.isHidden && ['ai_tool', 'ai_app'].includes(post.launchCategory))
        .sort((a, b) => Number(b.upvotes || 0) - Number(b.downvotes || 0) - (Number(a.upvotes || 0) - Number(a.downvotes || 0)));
    const makers = new Map();
    state.posts.forEach((post) => {
        const author = post.author || {};
        const key = String(author.id || author.username || post.authorName);
        const item = makers.get(key) || { id: key, username: author.username || '', name: author.name || post.authorName || 'Community member', profession: author.profession || post.role || 'Maker', avatarUrl: author.avatarUrl || null, postsCount: 0, likesReceived: 0, commentsReceived: 0, score: 0 };
        item.postsCount += 1;
        item.likesReceived += Number(post.likes || 0);
        item.commentsReceived += Number(post.commentsCount || 0);
        item.score = item.postsCount + item.likesReceived * 2 + item.commentsReceived * 3;
        makers.set(key, item);
    });
    if (state.currentUser) {
        const key = String(state.currentUser.id || state.currentUser.username);
        if (!makers.has(key)) makers.set(key, { id: key, username: state.currentUser.username, name: state.currentUser.name, profession: state.currentUser.profession || 'Community member', avatarUrl: state.currentUser.avatarUrl, postsCount: 0, likesReceived: 0, commentsReceived: 0, score: 0 });
    }
    return {
        tools,
        leaderboard: [...makers.values()].sort((a, b) => b.score - a.score).slice(0, 20).map((user, index) => ({ ...user, rank: index + 1 })),
    };
}

function renderRankedLaunch(post, index) {
    const logo = post.logoUrl ? safeImageUrl(post.logoUrl) : '';
    const url = safeUrl(post.projectUrl);
    return `<article class="ranking-launch-row"><span class="ranking-number">${String(index + 1).padStart(2, '0')}</span><div class="ranking-launch-logo">${logo ? `<img src="${escapeHtml(logo)}" alt="" loading="lazy">` : icon('rocket', 22)}</div><div class="ranking-launch-copy"><strong>${escapeHtml(post.title)}</strong><span>by ${escapeHtml(post.authorName || post.author?.name || 'Community member')}</span></div>${url ? `<a class="ranking-launch-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" aria-label="Visit ${escapeHtml(post.title)}">${icon('arrowUpRight', 18)}</a>` : ''}<div class="ranking-vote-buttons"><button class="launch-vote-button ${post.launchVote === 1 ? 'is-selected' : ''}" data-action="launch-vote" data-post-id="${escapeHtml(post.id)}" data-vote="1" aria-label="Upvote ${escapeHtml(post.title)}" aria-pressed="${post.launchVote === 1}">${icon('arrowUp', 18)}<span>${Number(post.upvotes || 0)}</span></button><button class="launch-vote-button ${post.launchVote === -1 ? 'is-selected' : ''}" data-action="launch-vote" data-post-id="${escapeHtml(post.id)}" data-vote="-1" aria-label="Downvote ${escapeHtml(post.title)}" aria-pressed="${post.launchVote === -1}">${icon('arrowDown', 18)}<span>${Number(post.downvotes || 0)}</span></button></div></article>`;
}

function renderLeaderRow(user, index) {
    const profile = user.username ? `<button class="leader-profile-link" data-action="open-profile" data-username="${escapeHtml(user.username)}">${escapeHtml(user.name)}</button>` : `<strong>${escapeHtml(user.name)}</strong>`;
    return `<article class="leader-row"><span class="ranking-number">${String(user.rank || index + 1).padStart(2, '0')}</span>${avatar(user.name, toneFor(user.name), 'leader-avatar', user.avatarUrl)}<div class="leader-copy">${profile}<span>${escapeHtml(user.profession || 'Community member')}</span></div><div class="leader-score"><strong>${Number(user.score || 0)}</strong><span>points</span></div></article>`;
}

function renderRankingsPage() {
    const rankingData = state.rankings || localRankings();
    const tools = (rankingData.tools || []).map(normalizePost);
    const makers = rankingData.leaderboard || [];
    return `<main class="route-main rankings-page"><section class="rankings-intro"><div><span class="route-eyebrow">COMMUNITY RANKINGS</span><h1>What makers are building</h1></div><p>Launch votes and community engagement, updated across the last 30 days.</p></section><div class="rankings-grid"><section class="ranking-panel"><header><span class="ranking-panel-icon">${icon('rocket', 22)}</span><div><h2>AI tools and apps</h2><p>Sorted by community votes</p></div></header><div class="ranking-list">${tools.length ? tools.map(renderRankedLaunch).join('') : `<div class="route-empty compact"><strong>No AI launches yet</strong><p>Share a new tool or app to start the list.</p><button class="btn btn-outline btn-small" data-action="open-compose" data-type="launch">Share a launch</button></div>`}</div></section><section class="ranking-panel"><header><span class="ranking-panel-icon">${icon('users', 22)}</span><div><h2>Engagement leaders</h2><p>Activity from the last 30 days</p></div></header><div class="ranking-list">${makers.length ? makers.map(renderLeaderRow).join('') : `<div class="route-empty compact"><strong>No makers ranked yet</strong><p>Posts and helpful conversations will appear here.</p></div>`}</div></section></div></main>`;
}

function renderCommunityChatPage() {
    if (!state.currentUser) {
        return `<main class="route-main"><section class="route-empty chat-join"><span class="route-empty-icon">${icon('users', 30)}</span><h1>Community chat</h1><p>Sign in to join the conversation.</p><button class="btn btn-primary" data-action="open-auth" data-mode="login">Sign in</button></section></main>`;
    }
    const messages = state.groupMessages || [];
    return `<main class="route-main community-chat-page"><section class="community-chat-shell"><header class="community-chat-heading"><div><span class="route-eyebrow">VIBEDOCK COMMUNITY</span><h1>Community chat</h1></div><span class="chat-refresh-note">${apiEnabled ? 'Updates every 12 seconds' : 'Local preview chat'}</span></header><div class="community-chat-transcript" id="community-chat-transcript" role="log" aria-live="polite" aria-relevant="additions"><div class="chat-date-label">Today</div>${messages.map((message) => `<article class="community-chat-message ${message.sentByMe ? 'mine' : ''}">${avatar(message.user?.name || 'Community member', toneFor(message.user?.name || ''), 'chat-avatar', message.user?.avatarUrl)}<div class="community-chat-message-body"><div><strong>${escapeHtml(message.user?.name || 'Community member')}</strong><span>${escapeHtml(message.createdAt || 'just now')}</span></div><p>${escapeHtml(message.body)}</p></div></article>`).join('')}</div><form class="community-chat-compose" data-form="community-chat"><label class="visually-hidden" for="community-chat-message">Write a community message</label><textarea id="community-chat-message" name="body" rows="1" maxlength="500" placeholder="Write a message" required></textarea><button class="btn btn-primary" type="submit" aria-label="Send community message">${icon('send', 21)}</button></form></section></main>`;
}

const infoContent = {
    about: { eyebrow: 'ABOUT VIBEDOCK', title: 'A place to make things', intro: 'VibeDock brings curious builders together to share ideas, learn in public, and launch useful projects.', sections: [['What you can do', 'Post a work in progress, ask a question, run a poll, share a launch, or meet other makers.'], ['Who it is for', 'People building with AI, code, design tools, and a healthy dose of curiosity.']] },
    guidelines: { eyebrow: 'COMMUNITY GUIDELINES', title: 'Build kindly', intro: 'Make this a useful, welcoming place for everyone.', sections: [['Be generous', 'Offer clear feedback and credit the people and tools that helped.'], ['Be respectful', 'Critique the work, not the person. Harassment and discrimination are not welcome.'], ['Be honest', 'Share real projects and disclose paid promotion or affiliate links.'], ['Keep it safe', 'Do not post private information, harmful instructions, or content you do not have the right to share.']] },
    privacy: { eyebrow: 'PRIVACY', title: 'Your information', intro: 'This community stores the information needed to run accounts and community features.', sections: [['What is stored', 'Account details, profile information, posts, uploaded images, votes, reports, direct messages, and community chat messages are stored in the site database. Passwords are stored as hashes.'], ['How it is used', 'Information is used to display profiles and community content, deliver messages, prevent abuse, and operate moderation tools.'], ['Your choices', 'You can edit your profile. For account removal or privacy questions, contact the site administrator before sharing sensitive information.'], ['Retention', 'The site operator is responsible for setting and publishing retention periods before launch.']] },
    terms: { eyebrow: 'TERMS', title: 'Using VibeDock', intro: 'Use the community lawfully and treat other members with care.', sections: [['Your content', 'You keep ownership of your work and give the service permission to host and display it as needed to operate the community.'], ['Your account', 'Keep your sign in details private and use accurate contact information.'], ['Moderation', 'Administrators may hide content, review reports, or disable accounts when needed to protect the community.'], ['Before launch', 'The site operator should have these terms reviewed for the laws that apply to the service.']] },
};

function renderInfoPage() {
    const content = infoContent[state.page] || infoContent.about;
    return `<main class="route-main info-page"><header class="info-page-heading"><span class="route-eyebrow">${content.eyebrow}</span><h1>${content.title}</h1><p>${content.intro}</p></header><div class="info-page-sections">${content.sections.map(([title, body]) => `<section><h2>${title}</h2><p>${body}</p></section>`).join('')}</div><nav class="info-page-links" aria-label="More information"><button data-action="go-page" data-page="about">About</button><button data-action="go-page" data-page="guidelines">Guidelines</button><button data-action="go-page" data-page="privacy">Privacy</button><button data-action="go-page" data-page="terms">Terms</button></nav></main>`;
}

function renderAdminPage() {
    if (!state.currentUser) return `<main class="route-main"><section class="route-empty"><span class="route-empty-icon">${icon('lock', 30)}</span><h1>Admin access</h1><p>Sign in with the local admin account to preview moderation tools.</p><button class="btn btn-primary" data-action="open-auth" data-mode="login">Sign in</button></section></main>`;
    if (!state.currentUser.isAdmin) return `<main class="route-main"><section class="route-empty"><span class="route-empty-icon">${icon('lock', 30)}</span><h1>Admin access only</h1><p>This page is for community administrators.</p><button class="btn btn-outline" data-action="go-page" data-page="home">Back to the community</button></section></main>`;
    const members = [state.currentUser, { id: 'demo-member', name: 'Demo Maker', username: 'demomaker', isAdmin: false }];
    return `<main class="route-main admin-preview-page"><header class="admin-preview-heading"><div><span class="route-eyebrow">LOCAL PREVIEW</span><h1>Admin panel</h1></div><button class="btn btn-outline btn-small" data-action="go-page" data-page="home">Back to community</button></header><div class="admin-preview-stats"><div><strong>${state.posts.length}</strong><span>Posts</span></div><div><strong>${state.posts.filter((post) => post.type === 'launch').length}</strong><span>Launches</span></div><div><strong>${members.length}</strong><span>Members</span></div></div><section class="admin-preview-section"><h2>Recent posts</h2>${state.posts.slice(0, 10).map((post) => `<article class="admin-preview-row"><div><strong>${escapeHtml(post.title || post.body.slice(0, 70))}</strong><span>${escapeHtml(post.authorName || 'Member')} · ${escapeHtml(prettyType(post.type))}</span></div><button class="btn btn-outline btn-small" data-action="admin-hide-post" data-post-id="${escapeHtml(post.id)}">${post.isHidden ? 'Restore' : 'Hide'}</button></article>`).join('')}</section><p class="admin-preview-note">This standalone preview uses browser data. The Laravel admin panel applies changes to the database.</p></main>`;
}

function renderMobileNav() {
    if (state.page === 'admin') return '';
    const items = [['home', 'compass', 'Home'], ['launches', 'rocket', 'Launches'], ['rankings', 'chart', 'Rankings'], ['community-chat', 'users', 'Chat'], ['profile', 'user', 'Profile']];
    return `<nav class="mobile-bottom-nav" aria-label="Quick navigation">${items.map(([page, glyph, label]) => `<button class="${state.page === page ? 'is-active' : ''}" data-action="go-page" data-page="${page}" aria-label="${label}">${icon(glyph, 22)}<span>${label}</span></button>`).join('')}</nav>`;
}

function renderMessagesPage() {
    const query = state.search.trim().toLowerCase();
    const conversations = state.conversations.filter((item) => `${item.user.name} ${item.user.username}`.toLowerCase().includes(query));
    const activeConversation = state.conversations.find((item) => String(item.user.id) === String(state.selectedMessageUser));
    const activeUser = state.messagePeer || activeConversation?.user || null;
    const requestMarkup = state.friendRequests.length ? `<section class="message-requests"><div class="route-section-heading"><div><span class="route-eyebrow">NEW CONNECTIONS</span><h2>Friend requests</h2></div><span class="request-count">${state.friendRequests.length}</span></div>${state.friendRequests.map((request) => `<div class="message-request-row">${avatar(request.user.name, toneFor(request.user.name), 'avatar-small', request.user.avatarUrl)}<div><strong>${escapeHtml(request.user.name)}</strong><span>@${escapeHtml(request.user.username)}</span></div><button class="btn btn-primary btn-small" data-action="respond-friend" data-request-id="${escapeHtml(request.id)}" data-response="accept">Accept</button><button class="icon-button" aria-label="Decline request" data-action="respond-friend" data-request-id="${escapeHtml(request.id)}" data-response="decline">${icon('close', 20)}</button></div>`).join('')}</section>` : '';
    const conversationMarkup = activeUser ? `<section class="message-thread"><header class="thread-header">${avatar(activeUser.name, toneFor(activeUser.name), 'avatar-small', activeUser.avatarUrl)}<div><strong>${escapeHtml(activeUser.name)}</strong><a href="/u/${encodeURIComponent(activeUser.username)}" data-action="open-profile" data-username="${escapeHtml(activeUser.username)}">@${escapeHtml(activeUser.username)}</a></div></header><div class="thread-messages" id="thread-messages">${state.messagesLoading ? '<div class="route-loading">Loading messages</div>' : state.messages.length ? state.messages.map((message) => `<div class="thread-message ${message.sentByMe ? 'mine' : ''}"><p>${escapeHtml(message.body)}</p><span>${escapeHtml(message.createdAt)}</span></div>`).join('') : '<div class="thread-empty">Say hello to start a conversation.</div>'}</div><form class="thread-compose" data-form="message" data-user-id="${escapeHtml(activeUser.id)}"><label class="visually-hidden" for="message-body">Write a message</label><textarea id="message-body" name="body" rows="1" maxlength="2000" placeholder="Write a message" required></textarea><button class="btn btn-primary" type="submit" aria-label="Send message">${icon('send', 21)}</button></form></section>` : `<section class="message-thread message-thread-empty"><div class="thread-empty-state"><span class="route-empty-icon">${icon('message', 31)}</span><strong>Your messages</strong><p>Become friends to start a private chat.</p><button class="btn btn-outline btn-small" data-action="go-page" data-page="home">Meet the community</button></div></section>`;

    return `<main class="route-main messages-page"><section class="messages-heading"><div><span class="route-eyebrow">PRIVATE CHAT</span><h1>Messages</h1></div><button class="btn btn-outline btn-small" data-action="view-friend-requests">${icon('users', 19)} Friend requests${state.friendRequests.length ? ` <span class="request-count">${state.friendRequests.length}</span>` : ''}</button></section>${requestMarkup}<section class="messages-layout"><aside class="conversation-list"><div class="conversation-list-heading"><strong>Your friends</strong><span>${conversations.length}</span></div>${conversations.length ? conversations.map((item) => `<button class="conversation-item ${String(item.user.id) === String(state.selectedMessageUser) ? 'is-active' : ''}" data-action="open-message-thread" data-user-id="${escapeHtml(item.user.id)}">${avatar(item.user.name, toneFor(item.user.name), 'avatar-message', item.user.avatarUrl)}<span class="conversation-copy"><strong>${escapeHtml(item.user.name)}</strong><small>${escapeHtml(item.latestMessage?.body || `@${item.user.username}`)}</small></span>${item.unreadCount ? `<span class="unread-badge">${item.unreadCount}</span>` : ''}</button>`).join('') : `<div class="conversation-empty"><span>No conversations yet.</span><p>Visit a profile to send a friend request.</p></div>`}</aside>${conversationMarkup}</section></main>`;
}

function renderFooter() {
    return `<footer class="site-footer"><div class="footer-shell"><div class="footer-main"><div class="footer-brand-block"><a class="brand footer-brand" href="/" data-action="go-page" data-page="home">${brandMark()}<span class="brand-word">vibe<span>dock</span></span></a><p>A community for people who make things.</p></div><div class="footer-column"><strong>Explore</strong><button data-action="go-page" data-page="home">Community feed</button><button data-action="go-page" data-page="launches">Launches</button><button data-action="go-page" data-page="rankings">Rankings</button><button data-action="go-page" data-page="community-chat">Community chat</button></div><div class="footer-column"><strong>Information</strong><button data-action="go-page" data-page="about">About</button><button data-action="go-page" data-page="guidelines">Guidelines</button><button data-action="go-page" data-page="privacy">Privacy</button><button data-action="go-page" data-page="terms">Terms</button></div><div class="footer-column"><strong>Your account</strong>${state.currentUser ? `<button data-action="open-my-profile">Your profile</button><button data-action="go-page" data-page="messages">Messages</button>${state.currentUser.isAdmin ? `<a href="/admin">Admin panel</a>` : ''}<button data-action="logout">Sign out</button>` : `<button data-action="open-auth" data-mode="register">Join the community</button><button data-action="open-auth" data-mode="login">Sign in</button>`}</div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} VibeDock</span><span>Made for makers.</span></div></div></footer>`;
}

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
        : `<section class="demo-credentials"><strong>Local preview accounts</strong><div><code>demo@vibedock.test</code><code>VibeDockDemo2026!</code><button type="button" data-action="fill-demo-account" data-demo-account="member">Use maker account</button></div><div><code>admin@vibedock.test</code><code>VibeDockAdmin2026!</code><button type="button" data-action="fill-demo-account" data-demo-account="admin">Use admin account</button></div></section>`;
    return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-dialog auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button class="modal-close icon-button" data-action="close-modal" aria-label="Close dialog">${icon('close', 21)}</button>
        <div class="modal-brand">${brandMark()}<span class="brand-word">vibe<span>dock</span></span></div>
        <h2 id="auth-title">${isLogin ? 'Welcome back' : 'Join the community'}</h2>
        ${socialOptions}
        <div class="auth-switch" role="tablist"><button class="${!isLogin ? 'is-active' : ''}" data-action="auth-mode" data-mode="register" role="tab" aria-selected="${!isLogin}">Create account</button><button class="${isLogin ? 'is-active' : ''}" data-action="auth-mode" data-mode="login" role="tab" aria-selected="${isLogin}">Sign in</button></div>
        <form class="modal-form" data-form="auth" data-mode="${isLogin ? 'login' : 'register'}">
            ${!isLogin ? `<label class="field-label">Your name<input name="name" type="text" autocomplete="name" minlength="2" maxlength="80" placeholder="Your name" required></label><label class="field-label">Username<input name="username" type="text" autocomplete="username" minlength="3" maxlength="24" pattern="[A-Za-z0-9_]+" placeholder="yourname" required><span class="field-help">Letters, numbers, and underscores.</span></label>` : ''}
            <label class="field-label">Email address<input name="email" type="email" autocomplete="email" placeholder="you@example.com" required></label>
            <label class="field-label">Password<input name="password" type="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" minlength="8" placeholder="At least 8 characters" required></label>
            <div class="form-message" data-form-message hidden></div>
            <button class="btn btn-primary modal-submit" type="submit">${isLogin ? 'Sign in' : 'Create account'} ${icon('arrow', 18)}</button>
        </form>
        <p class="modal-terms">${isLogin ? 'New here? ' : 'By joining, you agree to our guidelines.'}${isLogin ? `<button data-action="auth-mode" data-mode="register">Create an account</button>` : `<button data-action="go-page" data-page="guidelines">Read guidelines</button>`}</p>
    </section></div>`;
}

function renderComposeModal() {
    const type = state.composeType;
    const titles = { discussion: 'Start a conversation', question: 'Ask a question', poll: 'Ask the community', launch: 'Share your launch' };
    const descriptions = {
        discussion: 'Share a win, a question, or a work in progress.',
        question: 'Ask the community for useful feedback.',
        poll: 'Get a quick read from other makers.',
        launch: 'Share a tool or app with its first audience.',
    };
    const options = type === 'poll' ? `<div class="field-label options-label">Answer options <span>2 to 5 choices</span></div><div class="poll-option-fields"><label class="sr-only" for="poll-option-1">Option 1</label><input id="poll-option-1" name="options[]" maxlength="80" placeholder="First option" required><label class="sr-only" for="poll-option-2">Option 2</label><input id="poll-option-2" name="options[]" maxlength="80" placeholder="Second option" required></div><button class="add-option" type="button" data-action="add-option">${icon('plus', 14)} Add another option</button>` : '';
    const launchUrl = type === 'launch' ? `<label class="field-label">Project link<input name="project_url" type="url" placeholder="https://your-project.com" required></label>` : '';
    const launchCategory = type === 'launch' ? `<label class="field-label">Project type<select name="launch_category" required><option value="ai_tool">AI tool</option><option value="ai_app">AI app</option><option value="app">App</option><option value="website">Website</option><option value="other">Other</option></select></label>` : '';
    const launchLogo = type === 'launch' ? `<label class="field-label image-upload-field">Project logo <span class="image-upload-control">${icon('image', 21)}<input type="file" name="logo" accept=".svg,image/svg+xml,image/jpeg,image/png,image/webp"></span><span class="field-help">SVG, JPG, PNG, or WebP up to 2 MB.</span></label>` : '';
    const titleField = type !== 'discussion' ? `<label class="field-label">${type === 'launch' ? 'Project name' : 'Your question'}<input name="title" type="text" maxlength="140" placeholder="${type === 'launch' ? 'Name your project' : type === 'question' ? 'What would you like help with?' : 'What would you like to ask?'}" required></label>` : '';
    return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-dialog compose-dialog" role="dialog" aria-modal="true" aria-labelledby="compose-title">
        <button class="modal-close icon-button" data-action="close-modal" aria-label="Close dialog">${icon('close', 20)}</button>
        <span class="modal-eyebrow">A LITTLE SOMETHING FOR THE DOCK</span><h2 id="compose-title">${titles[type]}</h2><p class="modal-subtitle">${descriptions[type]}</p>
        <div class="compose-type-switch" role="tablist" aria-label="Choose a post type"><button class="${type === 'discussion' ? 'is-active' : ''}" data-action="compose-type" data-type="discussion">${icon('chat', 17)} Post</button><button class="${type === 'question' ? 'is-active' : ''}" data-action="compose-type" data-type="question">${icon('message', 17)} Question</button><button class="${type === 'poll' ? 'is-active' : ''}" data-action="compose-type" data-type="poll">${icon('poll', 17)} Poll</button><button class="${type === 'launch' ? 'is-active' : ''}" data-action="compose-type" data-type="launch">${icon('rocket', 17)} Launch</button></div>
        <form class="modal-form compose-form" data-form="compose" data-type="${type}">
            ${titleField}
            <label class="field-label">${type === 'launch' ? 'Description' : type === 'poll' ? 'Context (optional)' : type === 'question' ? 'Details' : 'Your post'}<textarea name="body" rows="4" maxlength="5000" placeholder="${type === 'launch' ? 'What does it do?' : type === 'poll' ? 'Add context for your question.' : type === 'question' ? 'What have you tried?' : 'What are you making?'}" ${['discussion', 'question', 'launch'].includes(type) ? 'required' : ''}></textarea></label>
            ${options}
            ${type === 'launch' ? launchLogo : `<label class="field-label image-upload-field">Add an image <span class="image-upload-control">${icon('image', 21)}<input type="file" name="image" accept="image/jpeg,image/png,image/webp"></span><span class="field-help">JPG, PNG, or WebP up to 5 MB.</span></label>`}
            ${launchUrl}
            ${launchCategory}
            ${type !== 'launch' ? `<label class="field-label category-field">Topic <select name="category"><option value="">Choose a topic</option><option>Build in public</option><option>Promptcraft</option><option>First launch</option><option>Learning out loud</option><option>Tools and workflows</option></select></label>` : ''}
            <div class="form-message" data-form-message hidden></div>
            <div class="compose-submit-row"><span>${icon('check', 15)} Kindness is the only hard requirement.</span><button class="btn btn-primary" type="submit">${type === 'launch' ? 'Publish launch' : type === 'poll' ? 'Post your poll' : type === 'question' ? 'Post question' : 'Share with the community'} ${icon('arrow', 16)}</button></div>
        </form>
    </section></div>`;
}

function renderAvatarPicker(user) {
    const choices = [
        { key: 'female-rose', label: 'Rose', group: 'Women', tone: 'tone-coral' },
        { key: 'female-violet', label: 'Violet', group: 'Women', tone: 'tone-lilac' },
        { key: 'female-teal', label: 'Teal', group: 'Women', tone: 'tone-mint' },
        { key: 'male-indigo', label: 'Indigo', group: 'Men', tone: 'tone-indigo' },
        { key: 'male-sky', label: 'Sky', group: 'Men', tone: 'tone-sky' },
        { key: 'male-amber', label: 'Amber', group: 'Men', tone: 'tone-coral' },
        { key: 'neutral', label: 'Neutral', group: 'Neutral', tone: 'tone-neutral' },
    ];
    const selected = user.avatarUploaded ? 'keep' : (user.avatarChoice || 'neutral');
    const groups = ['Women', 'Men', 'Neutral'];
    return `<fieldset class="avatar-picker"><legend>Choose a profile illustration</legend>
        ${user.avatarUploaded ? `<label class="avatar-current-choice"><input type="radio" name="avatar_choice" value="keep" ${selected === 'keep' ? 'checked' : ''}>${avatar(user.name || 'You', 'tone-neutral', 'avatar-choice-preview', user.avatarUrl)}<span>Keep current photo</span></label>` : ''}
        ${groups.map((group) => `<div class="avatar-choice-group"><span>${group}</span><div class="avatar-choice-grid">${choices.filter((choice) => choice.group === group).map((choice) => `<label class="avatar-choice ${selected === choice.key ? 'is-selected' : ''}"><input type="radio" name="avatar_choice" value="${choice.key}" ${selected === choice.key ? 'checked' : ''}><img src="${window.location.origin}/avatars/${choice.key}.svg" alt=""><span>${choice.label}</span></label>`).join('')}</div></div>`).join('')}
    </fieldset>`;
}

function renderProfileModal() {
    const user = state.currentUser || {};
    const skills = Array.isArray(user.skills) ? user.skills.join(', ') : '';
    return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-dialog compose-dialog profile-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title"><button class="modal-close icon-button" data-action="close-modal" aria-label="Close dialog">${icon('close', 21)}</button><span class="modal-eyebrow">YOUR MAKER PROFILE</span><h2 id="profile-edit-title">Edit your profile</h2><form class="modal-form" data-form="profile"><label class="field-label">Your name<input name="name" value="${escapeHtml(user.name || '')}" maxlength="80" minlength="2" required></label><label class="field-label">Username<input name="username" value="${escapeHtml(user.username || '')}" pattern="[A-Za-z0-9_]+" minlength="3" maxlength="24" required><span class="field-help">Letters, numbers, and underscores.</span></label><label class="field-label">Profession<input name="profession" value="${escapeHtml(user.profession || '')}" maxlength="80" placeholder="Designer, developer, founder"></label><label class="field-label">Skills<input name="skills" value="${escapeHtml(skills)}" maxlength="420" placeholder="Python, React, product design"><span class="field-help">Separate up to twelve skills with commas.</span></label><label class="field-label">About you<textarea name="bio" rows="3" maxlength="280" placeholder="What are you making?">${escapeHtml(user.bio || '')}</textarea></label><label class="field-label">Website<input name="website" type="url" value="${escapeHtml(user.website || '')}" placeholder="https://your-site.com"></label>${renderAvatarPicker(user)}<label class="field-label image-upload-field">Upload a profile photo <span class="image-upload-control">${icon('image', 21)}<input type="file" name="avatar" accept="image/jpeg,image/png,image/webp"></span><span class="field-help">JPG, PNG, or WebP up to 5 MB. Images are resized.</span></label><div class="form-message" data-form-message hidden></div><div class="compose-submit-row"><span>Save a profile people can find.</span><button class="btn btn-primary" type="submit">Save profile ${icon('check', 19)}</button></div></form></section></div>`;
}

function renderReportModal() {
    const post = state.posts.find((item) => item.id === String(state.reportPostId));
    return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-dialog compose-dialog report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-title"><button class="modal-close icon-button" data-action="close-modal" aria-label="Close dialog">${icon('close', 21)}</button><span class="modal-eyebrow">HELP KEEP THIS COMMUNITY KIND</span><h2 id="report-title">Report this post</h2><p class="modal-subtitle">A moderator will review your report privately.</p><form class="modal-form" data-form="report" data-post-id="${escapeHtml(post?.id || '')}"><label class="field-label">What is the issue?<select name="reason" required><option value="">Choose a reason</option><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="misinformation">Misleading information</option><option value="unsafe">Unsafe content</option><option value="other">Something else</option></select></label><label class="field-label">More details <span class="optional-label">Optional</span><textarea name="details" rows="4" maxlength="1000" placeholder="Share anything that may help the moderators."></textarea></label><div class="form-message" data-form-message hidden></div><div class="compose-submit-row"><span>Your report is private.</span><button class="btn btn-primary" type="submit">Send report ${icon('arrow', 18)}</button></div></form></section></div>`;
}

function renderModal() {
    if (state.modal === 'auth') return renderAuthModal();
    if (state.modal === 'compose') return renderComposeModal();
    if (state.modal === 'profile') return renderProfileModal();
    if (state.modal === 'report') return renderReportModal();
    if (state.modal === 'guidelines') return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-dialog info-dialog" role="dialog" aria-modal="true" aria-labelledby="info-title"><button class="modal-close icon-button" data-action="close-modal" aria-label="Close dialog">${icon('close', 20)}</button><span class="modal-eyebrow">HOW WE BUILD HERE</span><h2 id="info-title">A few good rules.</h2><ul><li>Share generously. Offer help when you can.</li><li>Critique the work, not the person making it.</li><li>Credit the tools, people, and inspiration that helped you.</li><li>Everyone is learning. Make room for the messy middle.</li></ul><button class="btn btn-primary" data-action="close-modal">Sounds good ${icon('check', 16)}</button></section></div>`;
    if (state.modal === 'about') return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-dialog info-dialog" role="dialog" aria-modal="true" aria-labelledby="info-title"><button class="modal-close icon-button" data-action="close-modal" aria-label="Close dialog">${icon('close', 20)}</button><span class="modal-eyebrow">A PLACE TO MAKE THINGS</span><h2 id="info-title">Meet VibeDock.</h2><p>VibeDock is a community concept for people using AI and their own curiosity to bring ideas to life. Share a draft, ask for a hand, find your first users, and celebrate every launch.</p><button class="btn btn-primary" data-action="open-auth" data-mode="register">Come build with us ${icon('arrow', 16)}</button></section></div>`;
    return '';
}

function renderPageContent() {
    if (state.page === 'launches') return renderLaunchPage();
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
    const title = ({ home: 'Discover', launches: 'Launches', rankings: 'Rankings', 'community-chat': 'Community chat', messages: 'Messages', admin: 'Admin panel', about: 'About', guidelines: 'Guidelines', privacy: 'Privacy', terms: 'Terms', profile: state.profileData?.user?.name || 'Profile' })[state.page] || 'VibeDock';
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
    syncCommunityPolling();
    if (state.flashMessage) {
        const message = state.flashMessage;
        state.flashMessage = '';
        window.setTimeout(() => showToast(message), 0);
    }
}

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
    if (!apiEnabled) return;
    try {
        const response = await apiRequest('/api/feed');
        if (Array.isArray(response.data)) {
            state.posts = response.data.map(normalizePost);
            if (state.initialPostId) state.initialPostId = String(state.initialPostId);
            renderApp();
        }
    } catch {
        // Keep the sample feed visible while the database is being set up.
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
                page.innerHTML = `<div class="chat-date-label">Today</div>${state.groupMessages.map((message) => `<article class="community-chat-message ${message.sentByMe ? 'mine' : ''}">${avatar(message.user?.name || 'Community member', toneFor(message.user?.name || ''), 'chat-avatar', message.user?.avatarUrl)}<div class="community-chat-message-body"><div><strong>${escapeHtml(message.user?.name || 'Community member')}</strong><span>${escapeHtml(message.createdAt || 'just now')}</span></div><p>${escapeHtml(message.body)}</p></div></article>`).join('')}`;
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
        name: author.name || authoredPosts[0]?.authorName || 'Community member',
        username: author.username || username,
        bio: author.bio || '',
        profession: author.profession || '',
        skills: author.skills || [],
        website: author.website || '',
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
            if (!state.profileData) throw new Error('We could not find that profile.');
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
    const allowed = ['home', 'launches', 'rankings', 'community-chat', 'messages', 'profile', 'admin', 'about', 'guidelines', 'privacy', 'terms'];
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
    state.filter = ['all', 'discussion', 'question', 'poll', 'launch', 'saved'].includes(filter) ? filter : 'all';
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
                'demo@vibedock.test': { password: 'VibeDockDemo2026!', name: 'VibeDock Demo Maker', username: 'demomaker', avatarChoice: 'female-violet', isAdmin: false, profession: 'Independent maker', skills: ['Prototyping', 'AI tools', 'Product design'] },
                'admin@vibedock.test': { password: 'VibeDockAdmin2026!', name: 'VibeDock Demo Admin', username: 'demoadmin', avatarChoice: 'male-indigo', isAdmin: true, profession: 'Community moderator', skills: ['Community building'] },
            };
            const account = demoAccounts[payload.email.toLowerCase()];
            if (!account || account.password !== payload.password) throw new Error('Use one of the local preview accounts shown above.');
            const { password: _password, ...profile } = account;
            state.currentUser = { id: `preview-${profile.username}`, ...profile, email: payload.email, avatarUploaded: false, avatarUrl: `${window.location.origin}/avatars/${profile.avatarChoice}.svg` };
        } else {
            const username = payload.username || payload.name.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
            if (username.length < 3) throw new Error('Choose a username with at least three letters or numbers.');
            state.currentUser = { id: `preview-${Date.now()}`, name: payload.name, username, email: payload.email, bio: '', profession: '', skills: [], avatarChoice: 'neutral', avatarUploaded: false, avatarUrl: `${window.location.origin}/avatars/neutral.svg`, isAdmin: false };
            writeStorage(STORAGE.user, state.currentUser);
        }
        state.modal = null;
        persistDemo();
        renderApp();
        showToast(`Welcome${state.currentUser.name ? `, ${state.currentUser.name.split(' ')[0]}` : ''}! You are docked in.`);
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
                category: payload.category,
                launchCategory: payload.launch_category,
                projectUrl: payload.project_url,
                imageUrl,
                logoUrl,
                upvotes: 0,
                downvotes: 0,
                launchVote: null,
                authorName: state.currentUser.name,
                author: { id: state.currentUser.id, name: state.currentUser.name, username: state.currentUser.username, profession: state.currentUser.profession, avatarUrl: state.currentUser.avatarUrl },
                role: 'New to the dock',
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
        state.page = type === 'launch' ? 'launches' : 'home';
        if (type === 'launch') state.rankingsLoaded = false;
        state.initialPostId = null;
        state.profileUsername = null;
        state.filter = type;
        state.tag = '';
        state.modal = null;
        window.history.pushState({}, '', type === 'launch' ? '/launches' : '/');
        persistDemo();
        renderApp();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast(type === 'launch' ? 'Your launch is on the dock!' : type === 'poll' ? 'Your poll is live!' : type === 'question' ? 'Your question is live!' : 'Your post is live!');
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
        showToast('This post was shared with your followers.');
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
        showToast('Your reply is on the conversation.');
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
                avatarUploaded: hasAvatar || keepPhoto,
                avatarUrl: uploadedAvatar || (keepPhoto ? state.currentUser.avatarUrl : `${window.location.origin}/avatars/${chosenAvatar}.svg`),
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
        showToast('Your profile is updated.');
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
        showToast('Thank you. Your report is with the moderators.');
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
        showToast(result.status === 'accepted' ? 'You are already friends.' : 'Friend request sent.');
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
            showToast('Friend request accepted. You can now message each other.');
        } else {
            showToast('Friend request declined.');
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
    showToast('You have been signed out.');
}

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
        return navigateTo('profile', target.dataset.username);
    }
    if (action === 'open-post') {
        event.preventDefault();
        state.search = '';
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
    if (action === 'go-top') {
        event.preventDefault();
        if (state.page !== 'home') return navigateTo('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
        showToast(wasSaved ? 'Post removed from your saved list.' : 'Post saved for later.');
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
    if (action === 'share') {
        const link = `${window.location.origin}/posts/${encodeURIComponent(target.dataset.postId)}`;
        try {
            await navigator.clipboard.writeText(link);
            showToast('Community link copied.');
        } catch {
            showToast('Share VibeDock with a builder friend.');
        }
        return;
    }
    if (action === 'admin-hide-post') {
        const post = findPostById(target.dataset.postId);
        if (!post || !state.currentUser?.isAdmin) return;
        post.isHidden = !post.isHidden;
        persistDemo();
        renderApp();
        showToast(post.isHidden ? 'Post hidden in this preview.' : 'Post restored in this preview.');
        return;
    }
    if (action === 'logout') return logout();
    if (action === 'show-guidelines') {
        event.preventDefault();
        state.modal = 'guidelines';
        return renderApp();
    }
    if (action === 'show-about') {
        event.preventDefault();
        state.modal = 'about';
        return renderApp();
    }
});

root.addEventListener('input', (event) => {
    if (event.target.matches('[data-search]')) {
        state.search = event.target.value;
        scheduleSearch(state.search);
        if (state.page === 'home') renderFeed();
        else {
            const main = root.querySelector('.route-main');
            if (main) main.outerHTML = renderPageContent();
        }
    }
});

root.addEventListener('change', (event) => {
    if (event.target.matches('[data-sort]')) {
        state.sort = event.target.value;
        renderFeed();
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
