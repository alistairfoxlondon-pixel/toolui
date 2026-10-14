import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

// Only emit font URLs for licensed files actually supplied by the site owner.
// Missing files retain genuine local Telenor faces and the existing Figtree fallback.
export function brandFontFaces(root) {
    const faces = [
        ['Telenor-Regular.woff2', 400],
        ['Telenor-Medium.woff2', 500],
        ['Telenor-Bold.woff2', 700],
    ];
    return faces.filter(([file]) => existsSync(resolve(root, 'public/fonts/telenor', file)))
        .map(([file, weight]) => {
            const hash = createHash('sha256').update(readFileSync(resolve(root, 'public/fonts/telenor', file))).digest('hex').slice(0, 12);
            return `@font-face { font-family: 'Telenor GP'; font-style: normal; font-weight: ${weight}; font-display: swap; src: url('/fonts/telenor/${file}?v=${hash}') format('woff2'); }`;
        }).join('\n');
}

export default function brandFontPlugin() {
    let root;
    return {
        name: 'licensed-telenor-fonts',
        enforce: 'pre',
        configResolved(config) { root = config.root; },
        transform(source, id) {
            if (id.split('?')[0] !== resolve(root, 'resources/css/fonts.css')) return;
            return `${source}\n${brandFontFaces(root)}`;
        },
    };
}
