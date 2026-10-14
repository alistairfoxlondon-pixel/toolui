"""Rebuild archived Fluent WebP derivatives without touching the active SVG avatar library.
Usage: python scripts/optimize-community-artwork.py path/to/source-png-directory
Requires Pillow. Source files must use the keys in public/avatars/fluent/sources.json.
The source manifest records Microsoft Fluent Emoji paths and git blob hashes.
"""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1])
sources = json.loads((ROOT / 'public/avatars/fluent/sources.json').read_text())
avatars = {}

def encode(key, image, width, folder):
    image = image.copy().convert('RGBA')
    image.thumbnail((width, width), Image.Resampling.LANCZOS)
    import io
    data = io.BytesIO()
    image.save(data, format='WEBP', quality=86, method=6)
    binary = data.getvalue()
    fingerprint = hashlib.sha256(binary).hexdigest()[:10]
    path = ROOT / 'public' / folder / f'{key}-{width}-{fingerprint}.webp'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(binary)
    return '/' + str(path.relative_to(ROOT / 'public'))

for source in sources:
    key = source['key']
    image = Image.open(SOURCE / (key + '.png'))
    avatars[key] = {
        'small': encode(key, image, 96, 'avatars/optimized'),
        'large': encode(key, image, 256, 'avatars/optimized'),
    }
archive_manifest = ROOT / 'public/avatars/optimized/archive-manifest.json'
archive_manifest.write_text(json.dumps(avatars, indent=2) + '\n')
print(f'Built {len(avatars)} archived responsive avatar pairs.')
