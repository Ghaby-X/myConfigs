#!/usr/bin/env bash
# Makes qimgv the default image viewer. Uses xdg-mime (which edits
# ~/.config/mimeapps.list) rather than a stowed mimeapps.list, because other apps
# (Slack, Claude, ...) write into that file too. Needs qimgv installed. Safe to re-run.
set -euo pipefail

DESKTOP=qimgv.desktop
FILE=/usr/share/applications/$DESKTOP
if [[ ! -f "$FILE" ]]; then
  echo "set-default-apps: $DESKTOP not found (is qimgv installed?)" >&2
  exit 1
fi

# every image/* type qimgv declares support for
mapfile -t types < <(grep -m1 '^MimeType=' "$FILE" | cut -d= -f2 | tr ';' '\n' | grep '^image/')
for t in "${types[@]}"; do
  xdg-mime default "$DESKTOP" "$t"
done
echo "qimgv set as default for ${#types[@]} image types"
