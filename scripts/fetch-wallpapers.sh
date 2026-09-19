#!/usr/bin/env bash
# Downloads the extra per-theme wallpapers into
#   theme/.config/rice/themes/<theme>/backgrounds/
# They are NOT committed (backgrounds/ is gitignored) — this script is the
# record of where they come from, so a new machine can just run it.
# Skips files that already exist. Needs curl + ImageMagick (magick).
#
# Sources / licenses:
#   zhichaoh/catppuccin-wallpapers  MIT        (Catppuccin landscapes)
#   Narmis-E/onedark-wallpapers     GPL-3.0    (One Dark minimal art)
#   GNOME/gnome-backgrounds         CC-BY-SA-3.0 / CC0 (abstract light/dark pairs)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/theme/.config/rice/themes"
Z=https://raw.githubusercontent.com/zhichaoh/catppuccin-wallpapers/main/landscapes
N=https://raw.githubusercontent.com/Narmis-E/onedark-wallpapers/main/minimal
G=https://gitlab.gnome.org/GNOME/gnome-backgrounds/-/raw/main/backgrounds

# theme | output name | url
MANIFEST=(
  "catppuccin-latte|clear-day|$Z/Clearday.jpg"
  "catppuccin-latte|island-day|$Z/tropic_island_day.jpg"
  "catppuccin-latte|forest|$Z/forrest.png"
  "catppuccin-latte|salty-mountains|$Z/salty_mountains.png"

  "catppuccin-mocha|clear-night|$Z/Clearnight.jpg"
  "catppuccin-mocha|shaded-landscape|$Z/shaded_landscape.png"
  "catppuccin-mocha|island-night|$Z/tropic_island_night.jpg"
  "catppuccin-mocha|rain-night|$Z/Rainnight.jpg"

  "one-dark|hills|$N/od_hills.png"
  "one-dark|outrun-wave|$N/od_outrun_wave.png"
  "one-dark|moon-astronaut|$N/od_space01.png"
  "one-dark|planets|$N/od_planets.png"
  "one-dark|drift|$N/od_drift.png"

  "mac-dark|sheet|$G/sheet-d.jxl"
  "mac-dark|fold|$G/fold-d.jxl"
  "mac-dark|amber|$G/amber-d.jxl"
  "mac-dark|curvy|$G/curvy-d.jxl"
  "mac-dark|adwaita|$G/adwaita-d.jxl"

  "mac-light|adwaita|$G/adwaita-l.jxl"
  "mac-light|fold|$G/fold-l.jxl"
  "mac-light|amber|$G/amber-l.jxl"
  "mac-light|dithered-sun|$G/dithered-sun-l.jxl"
  "mac-light|curvy|$G/curvy-l.jxl"
  "mac-light|sheet|$G/sheet-l.jxl"
)

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

for entry in "${MANIFEST[@]}"; do
  IFS='|' read -r theme name url <<<"$entry"
  dest_dir="$ROOT/$theme/backgrounds"
  mkdir -p "$dest_dir"
  if compgen -G "$dest_dir/$name.*" >/dev/null; then
    echo "have  $theme/$name"
    continue
  fi
  echo "fetch $theme/$name"
  src="$tmp/src.${url##*.}"
  curl -sfL --max-time 120 -o "$src" "$url" || { echo "  FAILED: $url" >&2; continue; }
  # small flat PNGs (One Dark art) stay as-is; everything else becomes a JPEG
  # capped at 2560px so photos/renders don't take megabytes each
  if [[ "$src" == *.png && "$(stat -c%s "$src")" -lt 500000 ]]; then
    cp "$src" "$dest_dir/$name.png"
  else
    magick "$src" -resize '2560x2560>' -quality 90 "$dest_dir/$name.jpg"
  fi
done
echo "done"
