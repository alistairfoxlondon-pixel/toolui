# Licensed Telenor / GP webfonts

No proprietary font binaries are included. Supply authentic WOFF2 files for which
you have web-embedding/redistribution rights, named:

- `Telenor-Regular.woff2` (400)
- `Telenor-Medium.woff2` (500)
- `Telenor-Bold.woff2` (700)

Restart Vite for preview, or run `npm run build` and deploy both `public/build`
and the supplied font files. The shared Vite plugin detects these files and emits
same-origin, versioned font URLs with `font-display: swap`. It never requests a
missing font file. Without supplied webfonts, genuine locally installed Telenor
faces are preferred; other visitors use the existing self-hosted Figtree fallback.

Do not rename an unrelated font as Telenor or download an unlicensed copy.
