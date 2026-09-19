#!/usr/bin/env bash
# Clipboard history picker: cliphist entries in rofi, selection is copied back.
selected="$(cliphist list | rofi -dmenu -i -display-columns 2 -display-column-separator "\t" -no-show-icons -p "Clipboard" -theme ~/.config/rofi/clipboard.rasi)" || exit 0
[[ -n "$selected" ]] && printf '%s' "$selected" | cliphist decode | wl-copy
