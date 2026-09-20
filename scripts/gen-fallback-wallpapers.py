#!/usr/bin/env python3
"""Generates a small built-in wallpaper (soft gradient + faint accent glow, in the theme's
own colors) for every theme that has no tracked wallpaper.png. It is the safety net
shown when the downloaded wallpapers aren't available (offline first boot, a source
that disappeared). ~30 KB each. Needs ImageMagick. Safe to re-run; existing files are kept.

    scripts/gen-fallback-wallpapers.py          # only themes that lack one
    scripts/gen-fallback-wallpapers.py --force  # regenerate all of them
"""
import importlib.machinery
import importlib.util
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RICE = ROOT / "configs/theme/.config/rice"

# reuse the theme engine's own palette rules (shell color etc.)
loader = importlib.machinery.SourceFileLoader("theme_render", str(RICE / "theme-render"))
spec = importlib.util.spec_from_loader("theme_render", loader)
tr = importlib.util.module_from_spec(spec)
loader.exec_module(tr)

force = "--force" in sys.argv
made = kept = 0
for theme_dir in sorted((RICE / "themes").iterdir()):
    if not (theme_dir / "colors.toml").is_file():
        continue
    out = theme_dir / "wallpaper.png"
    if out.exists() and not force:
        kept += 1
        continue
    p = tr.build_palette(theme_dir.name)
    top, bottom, glow = p["background"], p["shell"], p["accent"]
    subprocess.run(
        [
            "magick", "-size", "1920x1080", f"gradient:{top}-{bottom}",
            "(", "-size", "1920x1080", f"radial-gradient:{glow}-{top}", ")",
            "-compose", "blend", "-define", "compose:args=16,84", "-composite",
            "-depth", "8", "-define", "png:compression-level=9", str(out),
        ],
        check=True,
    )
    made += 1
    print(f"made  {theme_dir.name}/wallpaper.png  ({out.stat().st_size // 1024} KB)")
print(f"fallback wallpapers: {made} made, {kept} already present")
