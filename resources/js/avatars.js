import assets from '../data/avatar-assets.json';
import aliases from '../data/avatar-aliases.json';

const byPath = new Map();
for (const [key, item] of Object.entries(assets)) {
    byPath.set(`/avatars/${key}.png`, item);
    byPath.set(item.small, item);
    byPath.set(item.large, item);
}
for (const [old, key] of Object.entries(aliases)) byPath.set(`/avatars/${old}.svg`, assets[key]);

export function avatarAsset(value) {
    if (typeof value !== 'string') return null;
    if (assets[value]) return assets[value];
    if (aliases[value]) return assets[aliases[value]];
    try { return byPath.get(new URL(value, window.location.origin).pathname) || null; }
    catch { return null; }
}
export function avatarPath(key, size = 'small') {
    return (assets[aliases[key] || key] || assets['fluent-robot'])[size];
}
export function avatarResolutionAttributes(value, pixels = 40) {
    const item = avatarAsset(value);
    return item ? `srcset="${item.small} 96w, ${item.large} 256w" sizes="${pixels}px"` : '';
}
