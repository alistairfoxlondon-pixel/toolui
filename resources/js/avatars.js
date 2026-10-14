import assets from '../data/avatar-assets.json';
import aliases from '../data/avatar-aliases.json';

const FALLBACK_KEY = 'robo-ravi';
const byPath = new Map();
for (const [key, item] of Object.entries(assets)) {
    byPath.set(`/avatars/${key}.svg`, item);
    byPath.set(`/avatars/${key}.png`, item);
    byPath.set(item.small, item);
    byPath.set(item.large, item);
}
// Saved profiles can still refer to the retired portrait keys or their old file paths.
for (const [old, key] of Object.entries(aliases)) {
    const item = assets[key];
    if (!item) continue;
    for (const extension of ['svg', 'png', 'webp']) byPath.set(`/avatars/${old}.${extension}`, item);
}

function resolvedAsset(key) {
    return assets[aliases[key] || key] || assets[FALLBACK_KEY];
}

export function avatarAsset(value) {
    if (typeof value !== 'string') return null;
    if (assets[value] || aliases[value]) return resolvedAsset(value);
    try {
        const pathname = new URL(value, window.location.origin).pathname;
        const known = byPath.get(pathname);
        if (known) return known;
        // Versioned legacy WebPs included a content hash after the old avatar key.
        const legacyKey = Object.keys(aliases).find(key => pathname.includes(`/${key}`));
        return legacyKey ? resolvedAsset(legacyKey) : null;
    } catch { return null; }
}

export function avatarPath(key, size = 'small') {
    return resolvedAsset(key)[size] || resolvedAsset(key).small;
}

export function avatarResolutionAttributes(value, pixels = 40) {
    const item = avatarAsset(value);
    if (!item || item.small === item.large || item.small.endsWith('.svg')) return '';
    return `srcset="${item.small} 96w, ${item.large} 256w" sizes="${pixels}px"`;
}
