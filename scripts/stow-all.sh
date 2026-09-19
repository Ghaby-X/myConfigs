#!/usr/bin/env bash
# Symlinks every stow package in this repo into $HOME. Always targets $HOME
# explicitly and resolves the repo root from this script's own location, so
# it works regardless of where the repo was cloned to or what directory
# you're standing in when you run it.
#
# Packages are auto-discovered: any top-level directory that actually
# contains files (empty package skeletons are skipped, since git doesn't
# track empty directories anyway — nothing to symlink yet).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PACKAGES=()
for dir in */; do
  dir="${dir%/}"
  [[ "$dir" == "scripts" ]] && continue
  if find "$dir" -type f -print -quit | grep -q .; then
    PACKAGES+=("$dir")
  fi
done

if [[ ${#PACKAGES[@]} -eq 0 ]]; then
  echo "No non-empty stow packages found."
  exit 0
fi

echo "Stowing: ${PACKAGES[*]}"
stow -v --no-folding -t "$HOME" "${PACKAGES[@]}"

# tmux plugins live outside the repo; on a fresh machine, fetch them now that
# tmux.conf is linked (skipped when tmux isn't installed or TPM is already there).
if command -v tmux >/dev/null && [[ ! -d "$HOME/.config/tmux/plugins/tpm" ]]; then
  "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/tmux-plugins.sh"
fi
