#!/usr/bin/env bash
# Downloads the extra per-theme wallpapers into
#   configs/theme/.config/rice/themes/<theme>/backgrounds/
# They are NOT committed (backgrounds/ is gitignored) — this script is the
# record of where they come from, so a new machine can just run it.
# Skips files that already exist. Needs curl + ImageMagick (magick).
#
# Sources / licenses:
#   zhichaoh/catppuccin-wallpapers  MIT        (Catppuccin landscapes)
#   Narmis-E/onedark-wallpapers     GPL-3.0    (One Dark minimal art)
#   GNOME/gnome-backgrounds         CC-BY-SA-3.0 / CC0 (abstract light/dark pairs)
#   tokyo-night/wallpapers          MIT        (Tokyo Night)
#   rose-pine/wallpapers            CC0-1.0    (Rosé Pine + Dawn)
#   AngelJumbo/gruvbox-wallpapers   no license stated (Gruvbox dark + light)
#   philikarus/Kanagawa-wallpapers  no license stated (Kanagawa)
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/configs/theme/.config/rice/themes"
# Every source is pinned to an exact commit, so the files can never change or
# move under us (a branch like "main" can be rewritten). To update a source,
# replace its commit id with the new HEAD (`git ls-remote <repo> HEAD`).
Z=https://raw.githubusercontent.com/zhichaoh/catppuccin-wallpapers/1023077979591cdeca76aae94e0359da1707a60e/landscapes
N=https://raw.githubusercontent.com/Narmis-E/onedark-wallpapers/6f084e27d7a407be5c73a9fc88a5644408b74dca/minimal
G=https://gitlab.gnome.org/GNOME/gnome-backgrounds/-/raw/3e0962c0184a6ddebb7af3ff632eae095edb778d/backgrounds
T=https://raw.githubusercontent.com/tokyo-night/wallpapers/9a72582d7505da9a28b2fd77c155fbf140f6c8f0
R=https://raw.githubusercontent.com/rose-pine/wallpapers/c14c3845853d170a500dfaceb25d5cde243aab46
V=https://raw.githubusercontent.com/AngelJumbo/gruvbox-wallpapers/64a1f5fdbc4f7e0a7700405a80f6011dbe2e00f8/wallpapers
K=https://raw.githubusercontent.com/philikarus/Kanagawa-wallpapers/a8659f85a2f224619285025f29bc6a35fe21da1a/wallpapers/landscape

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

  "tokyo-night|neon-street|$T/misc/anime/neon-street_00_2880x1800.jpg"
  "tokyo-night|neon-sign|$T/misc/cityscape/neon-sign_00_1920x1080.jpg"
  "tokyo-night|kanji-blobs|$T/misc/abstract/kanji-with-blobs_00_1920x1080.png"
  "tokyo-night|stripes|$T/night/minimal/gnome_00_2560x1440.png"

  "gruvbox-dark|cosy-retreat|$V/vector%20graphics/chillhop.com-cosy_retreat.png"
  "gruvbox-dark|forest-castle|$V/mix/forest_castle.png"
  "gruvbox-dark|lake|$V/mix/mountain.jpg"
  "gruvbox-dark|warm-forest|$V/mix/warm_forest.png"
  "gruvbox-dark|night-moon|$V/mix/night_moon.png"

  "gruvbox-light|landscape|$V/mix/light/landscape.png"
  "gruvbox-light|chinese-hills|$V/minimalistic/light/chinese-hills.jpg"
  "gruvbox-light|clouds|$V/minimalistic/light/clouds.png"
  "gruvbox-light|koi-fish|$V/minimalistic/light/koi-fish.png"
  "gruvbox-light|alien-landscape|$V/mix/light/alien_landscape0.png"

  "rose-pine|contour-line|$R/generative/contour-line.png"
  "rose-pine|shape|$R/generative/shape.png"
  "rose-pine|nature|$R/illustration/something-beautiful-in-nature.jpg"
  "rose-pine|tower-horizon|$R/illustration/tower-horizon.jpg"
  "rose-pine|topo|$R/illustration/topo.jpg"

  "rose-pine-dawn|leafy|$R/illustration/leafy-dawn.png"
  "rose-pine-dawn|block-wave|$R/illustration/block-wave-dawn.png"
  "rose-pine-dawn|obliquas|$R/illustration/obliquas-light.jpg"
  "rose-pine-dawn|topo|$R/illustration/topo%20-%201887.jpg"
  "rose-pine-dawn|ascii|$R/illustration/ascii-dawn.png"

  "kanagawa|gate|$K/0b712.jpg"
  "kanagawa|splash|$K/28cf1.jpg"
  "kanagawa|torii|$K/7d5ad.jpg"
  "kanagawa|konbini|$K/08fbc.jpg"
  "kanagawa|lantern|$K/37859.jpg"
)

tmp="$(mktemp -d)"
_SUMMARY_TITLE="fetch-wallpapers.sh"
trap 'rm -rf "$tmp"; _rc=$?; summary_print "$_SUMMARY_TITLE" "$_rc"' EXIT

failed=()
fetched=0
have=0

for entry in "${MANIFEST[@]}"; do
  IFS='|' read -r theme name url <<<"$entry"
  dest_dir="$ROOT/$theme/backgrounds"
  mkdir -p "$dest_dir"
  if compgen -G "$dest_dir/$name.*" >/dev/null; then
    have=$((have + 1))
    continue
  fi
  echo "fetch $theme/$name"
  src="$tmp/src.${url##*.}"
  out="$dest_dir/$name.jpg"
  # small flat PNGs (One Dark art) stay as-is; everything else becomes a JPEG
  # capped at 2560px so photos/renders don't take megabytes each
  [[ "$url" == *.png ]] && out="$dest_dir/$name.png"

  # retry flaky connections; the result must be a real image, not an error page
  if curl -sfL --retry 3 --retry-delay 2 --max-time 180 -o "$src" "$url" \
     && magick identify "$src" >/dev/null 2>&1; then
    if [[ "$src" == *.png && "$(stat -c%s "$src")" -lt 500000 ]]; then
      cp "$src" "$dest_dir/$name.png"
    elif magick "$src" -resize '2560x2560>' -quality 90 "$dest_dir/$name.jpg"; then
      :
    else
      rm -f "$dest_dir/$name.jpg"; failed+=("$theme/$name (conversion)"); continue
    fi
    fetched=$((fetched + 1))
  else
    failed+=("$theme/$name  <- $url")
  fi
done

summary_add "wallpapers" "${#MANIFEST[@]} in the list — $fetched downloaded now, $have already present, ${#failed[@]} failed"
per_theme=""
for theme in $(printf '%s\n' "${MANIFEST[@]}" | cut -d'|' -f1 | sort -u); do
  n="$(find "$ROOT/$theme/backgrounds" -type f 2>/dev/null | wc -l)"
  per_theme+="$theme:$n  "
done
summary_add "per theme" "$per_theme"
summary_add "disk used" "$(du -shc "$ROOT"/*/backgrounds 2>/dev/null | tail -1 | cut -f1) in configs/theme/.../backgrounds (not tracked by git)"
if [[ ${#failed[@]} -gt 0 ]]; then
  for f in "${failed[@]}"; do summary_warn "failed: $f"; done
  summary_warn "re-run this script to retry; themes fall back to their built-in wallpaper meanwhile"
  exit 1
fi
