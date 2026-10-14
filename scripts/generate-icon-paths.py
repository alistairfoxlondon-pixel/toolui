"""Extract Material Symbols Rounded glyph outlines as inline SVG paths."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parents[1]
FONT = ROOT / "node_modules/material-symbols/material-symbols-rounded.woff2"

# key used in our app -> Material Symbols glyph name
ICONS = {
    "search": "search", "add": "add", "arrow_forward": "arrow_forward",
    "open_in_new": "open_in_new", "arrow_upward": "arrow_upward",
    "arrow_downward": "arrow_downward", "monitoring": "monitoring",
    "explore": "explore", "rocket_launch": "rocket_launch", "forum": "forum",
    "bar_chart": "bar_chart", "favorite": "favorite", "chat_bubble": "chat_bubble",
    "bookmark": "bookmark", "more_horiz": "more_horiz", "check": "check",
    "check_circle": "check_circle", "language": "language", "send": "send",
    "close": "close", "menu": "menu", "lock": "lock", "group": "group",
    "groups": "groups", "person": "person", "image": "image", "repeat": "repeat",
    "celebration": "celebration", "flag": "flag", "settings": "settings",
    "share": "share", "smart_toy": "smart_toy", "bolt": "bolt",
    "workspace_premium": "workspace_premium", "verified": "verified",
    "shuffle": "shuffle", "photo_camera": "photo_camera", "palette": "palette",
    "link": "link", "expand_more": "expand_more", "logout": "logout",
    "admin_panel_settings": "admin_panel_settings", "trending_up": "trending_up",
    "edit": "edit", "comment": "comment", "sell": "sell", "payments": "payments",
    "auto_awesome": "auto_awesome", "code": "code", "visibility": "visibility",
    "visibility_off": "visibility_off", "home": "home", "refresh": "refresh",
    "thumb_up": "thumb_up", "thumb_down": "thumb_down", "error": "error",
    "info": "info", "schedule": "schedule", "trophy": "trophy", "mail": "mail",
    "terminal": "terminal", "school": "school", "lightbulb": "lightbulb",
    "cloud": "cloud", "memory": "memory", "speed": "speed", "shield": "shield",
    "delete": "delete", "filter_alt": "filter_alt", "sort": "sort",
}

# Icons that also get a filled variant (active states)
FILLED = {
    "favorite", "bookmark", "thumb_up", "check_circle", "home", "explore",
    "rocket_launch", "monitoring", "group", "smart_toy", "person", "forum",
    "bar_chart", "chat_bubble", "sell", "workspace_premium",
}


def build(fill):
    font = TTFont(FONT)
    instantiateVariableFont(font, {"FILL": fill, "wght": 400, "GRAD": 0, "opsz": 24}, inplace=True)
    cmap = font.getBestCmap()
    rev = {}
    for cp, name in cmap.items():
        rev.setdefault(name, cp)
    glyph_set = font.getGlyphSet()
    out = {}
    for key, glyph_name in ICONS.items():
        cp = rev.get(glyph_name)
        if cp is None:
            print("MISSING", glyph_name)
            continue
        svg_pen = SVGPathPen(glyph_set)
        pen = TransformPen(svg_pen, (1, 0, 0, -1, 0, 0))
        glyph_set[cmap[cp]].draw(pen)
        d = svg_pen.getCommands()
        if d.strip():
            out[key] = d
    return out


# These names render the project's original illustrated icons instead.
import re
illustrated = set(re.findall(r'^    ([a-z_]+):', (ROOT / 'resources/js/illustrated-icons.js').read_text(), re.M))
outline = {k: v for k, v in build(0).items() if k not in illustrated or k == 'explore'}
filled = {k: v for k, v in build(1).items() if k in FILLED and k not in illustrated and v != outline.get(k)}
print(f"outline: {len(outline)}, filled: {len(filled)}")


def js_map(data, name):
    entries = ",\n".join(f'    {k}: "{v}"' for k, v in sorted(data.items()))
    return f"const {name} = {{\n{entries},\n}};\n\nexport {{ {name} }};\n"


with open(ROOT / "resources/js/icon-paths.js", "w") as fh:
    fh.write("// Material Symbols Rounded outlines (Google, Apache-2.0), pinned at wght 400,\n")
    fh.write("// opsz 24. Inlined as SVG path data for crisp, request-free icons.\n")
    fh.write(js_map(outline, "ICON_PATHS"))
    fh.write(js_map(filled, "ICON_PATHS_FILLED"))

print("written resources/js/icon-paths.js")
