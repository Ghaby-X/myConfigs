#!/usr/bin/env bash
# Clipboard history picker: cliphist entries in rofi, selection is copied back.
# Image entries get a thumbnail (decoded once into a cache dir, keyed by id).
cache="${XDG_CACHE_HOME:-$HOME/.cache}/cliphist-thumbs"
mkdir -p "$cache"

entries() {
  local line id
  while IFS= read -r line; do
    id="${line%%$'\t'*}"
    if [[ "$line" == *"[[ binary data"* ]]; then
      [[ -s "$cache/$id" ]] || printf '%s\n' "$line" | cliphist decode > "$cache/$id" 2>/dev/null
      # a real NUL byte is required for rofi's per-row icon metadata
      printf '%s\x00icon\x1f%s\n' "$line" "$cache/$id"
    else
      printf '%s\n' "$line"
    fi
  done < <(cliphist list)
}

selected="$(entries | rofi -dmenu -i -show-icons -display-columns 2 -display-column-separator "\t" -p "Clipboard" -theme ~/.config/rofi/clipboard.rasi)" || exit 0
[[ -n "$selected" ]] && printf '%s' "$selected" | cliphist decode | wl-copy
