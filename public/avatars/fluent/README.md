# Archived Fluent artwork

This directory preserves the previously used Microsoft Fluent Emoji 3D source manifest and MIT license information for historical attribution and old external asset URLs.

It is **not** the active VibeDock avatar library. The current picker and backend use the original VibeDock SVG illustrations in `public/avatars/`, listed by `resources/data/avatar-assets.json`.

- `public/avatars/optimized/` contains the old generated WebP derivatives.
- `sources.json` records the original Fluent source paths and git blob hashes.
- `scripts/optimize-community-artwork.py` is retained only to reproduce the archived derivatives if required; it writes an archive-only manifest and never changes the active asset map.

New avatar work should use the active SVG library rather than adding to this archive.
