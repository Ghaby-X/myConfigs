#!/usr/bin/env python3
"""Creates a new theme from a tinted-theming Base16 scheme.

    scripts/import-base16.py <scheme> [theme-name]
    scripts/import-base16.py gruvbox-dark-hard
    scripts/import-base16.py tokyo-night-storm my-storm

Fetches https://github.com/tinted-theming/schemes (base16/<scheme>.yaml) and writes
configs/theme/.config/rice/themes/<theme-name>/colors.toml using the standard Base16 ->
terminal mapping. Then check it by eye: some schemes don't follow the role
guidelines (e.g. Tokyo Night's base08 is a light blue, not red), in which case use
the theme's official palette for the color1..color6 / accent lines instead.
Afterwards: add wallpapers to fetch-wallpapers.sh, then `theme-set <theme-name>`.
"""
import re
import sys
import urllib.request
from pathlib import Path

if len(sys.argv) < 2:
    sys.exit(__doc__)
scheme = sys.argv[1]
name = sys.argv[2] if len(sys.argv) > 2 else scheme
url = f"https://raw.githubusercontent.com/tinted-theming/schemes/spec-0.11/base16/{scheme}.yaml"
text = urllib.request.urlopen(url, timeout=20).read().decode()

pal = {k: v.lower() for k, v in re.findall(r'(base0[0-9A-F]):\s*"(#[0-9a-fA-F]{6})"', text)}
title = re.search(r'^name:\s*"?([^"\n]+)"?', text, re.M).group(1)
variant = (re.search(r'^variant:\s*"?(\w+)"?', text, re.M) or [None, "dark"])[1]

# base16 terminal mapping: 0=base00 1=08 2=0B 3=0A 4=0D 5=0E 6=0C 7=05,
# bright: 8=03 9=08 10=0B 11=0A 12=0D 13=0E 14=0C 15=07
ansi = ["00", "08", "0B", "0A", "0D", "0E", "0C", "05", "03", "08", "0B", "0A", "0D", "0E", "0C", "07"]

lines = [
    f'name = "{title}"',
    f'mode = "{variant}"',
    "",
    f'background = "{pal["base00"]}"',
    f'foreground = "{pal["base05"]}"',
    f'accent = "{pal["base0D"]}"',
    f'selection = "{pal["base02"]}"',
    "",
    "# terminal palette (ANSI 0-15), from the Base16 mapping",
]
lines += [f'color{i} = "{pal["base" + b]}"' for i, b in enumerate(ansi)]

out = Path(__file__).resolve().parent.parent / "configs/theme/.config/rice/themes" / name
out.mkdir(parents=True, exist_ok=True)
(out / "colors.toml").write_text("\n".join(lines) + "\n")
print(f"wrote {out}/colors.toml")
