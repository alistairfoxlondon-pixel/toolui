const pages = {
    home: ['Build together', 'Launch your vibe-coded app, find fellow makers, ask questions, and rate the AI models you build with.'],
    feed: ['Community feed', 'Share progress, ask coding questions, and collect opinions with community polls.'],
    models: ['AI model ratings for vibe coding', 'Compare admin-curated AI models using ratings from makers who build with them.'],
    launches: ['Apps & websites made with AI', 'Explore vibe-coded apps and websites, try a project, and support its maker.'],
    rankings: ['Top builds & community makers', 'Discover apps and websites ranked by upvotes minus downvotes, plus community engagement leaders.'],
    'profile-edit': ['Edit your profile', 'Personalize your maker profile, skills, character avatar, and gradient cover.'],
};
export function updateMetadata(state, apiEnabled) {
    const post = state.initialPostId && state.posts.find(post => post.id === String(state.initialPostId));
    let [title, description] = pages[state.page] || [state.page.replaceAll('-', ' '), 'Build, share, and connect with makers on VibeDock.'];
    if (state.page === 'profile' && state.profileData?.user) {
        title = `${state.profileData.user.name} (@${state.profileData.user.username})`;
        description = state.profileData.user.bio || `Posts and launches by ${state.profileData.user.name}.`;
    }
    if (post) { title = post.title || post.body.slice(0, 60); description = post.seoDescription || post.body.slice(0, 155); }
    // Keep server-rendered post metadata while fetching its content.
    if (apiEnabled && state.initialPostId && !post) return;
    document.title = `${title} | VibeDock`;
    const meta = (key, value, property = false) => {
        const attr = property ? 'property' : 'name';
        let node = document.head.querySelector(`meta[${attr}="${key}"]`);
        if (!node) { node = document.createElement('meta'); node.setAttribute(attr, key); document.head.append(node); }
        node.content = value;
    };
    const url = `${location.origin}${location.pathname}`;
    meta('description', description);
    meta('og:title', document.title, true); meta('og:description', description, true); meta('og:url', url, true);
    meta('twitter:title', document.title); meta('twitter:description', description);
    meta('robots', !apiEnabled || ['messages', 'profile-edit', 'admin'].includes(state.page) || ['/login','/register'].includes(location.pathname) ? 'noindex, nofollow' : 'index, follow');
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
    canonical.href = url;
}
