#!/usr/bin/env bash
# Rename prompt shown in a centered tmux popup, so it doesn't take over (and overlap)
# the status line the way tmux's built-in `command-prompt` does.
#   rename-prompt.sh window|session
# The current name is pre-filled and editable (Enter = rename, Esc/empty = cancel).
kind="${1:-window}"
if [[ $kind == session ]]; then
  current="$(tmux display -p '#S')"
else
  current="$(tmux display -p '#W')"
fi

printf '\033[2m%s name\033[0m\n' "${kind^}"
read -e -r -i "$current" -p '› ' name || exit 0
[[ -n "$name" ]] || exit 0

if [[ $kind == session ]]; then
  tmux rename-session -- "$name"
else
  tmux rename-window -- "$name"
fi
