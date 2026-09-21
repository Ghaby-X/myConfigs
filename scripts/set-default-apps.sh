#!/usr/bin/env bash
# Sets the default apps: qimgv for images, mpv for video. Uses xdg-mime (which edits
# ~/.config/mimeapps.list) rather than a stowed mimeapps.list, because other apps
# (Slack, Claude, ...) write into that file too. Safe to re-run; an app that isn't
# installed is reported and skipped, and the script exits non-zero.
set -uo pipefail

rc=0

# set_default <desktop-file> <mime prefix, e.g. image/> <label>
set_default() {
  local desktop="$1" prefix="$2" label="$3"
  local file="/usr/share/applications/$desktop"
  if [[ ! -f "$file" ]]; then
    echo "set-default-apps: $desktop not found (is it installed?) — skipped $label" >&2
    rc=1
    return
  fi
  # every type with that prefix the app declares support for
  local -a types
  mapfile -t types < <(grep -m1 '^MimeType=' "$file" | cut -d= -f2 | tr ';' '\n' | grep "^$prefix")
  local t
  for t in "${types[@]}"; do
    xdg-mime default "$desktop" "$t"
  done
  echo "${desktop%.desktop} set as default for ${#types[@]} $label types"
}

set_default qimgv.desktop image/ image
set_default mpv.desktop video/ video

exit $rc
