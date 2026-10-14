# Licensed community artwork

Avatar portraits, characters and reaction icons use Microsoft Fluent Emoji 3D
artwork under MIT. Copyright Microsoft Corporation. See LICENSE in this folder.
No artwork was AI-generated for this update.

Source: https://github.com/microsoft/fluentui-emoji
The `sources.json` manifest records each original asset path and git blob hash.

- `public/avatars/optimized/`: 96px and 256px WebP derivatives, quality 86.
- `public/reactions/`: 64px WebP derivatives of six reaction illustrations.
- Original `public/avatars/fluent-*.png` and legacy SVGs remain for old external
  links only. Current frontend/backend library URLs serve optimized WebP.
- Shared manifests: `resources/data/avatar-assets.json`, `reaction-assets.json`.
- Filenames contain a content hash so immutable caching is safe.

To rebuild, download the licensed source PNGs listed in `sources.json` to a local
folder, named `<key>.png`. Install Pillow in a Python virtual environment and run:

    python scripts/optimize-community-artwork.py path/to/source-folder

Commit updated manifests and their referenced WebP assets together. Preserve the
license and source attribution when redistributing these derivatives.
