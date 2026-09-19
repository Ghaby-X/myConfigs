#!/usr/bin/env bash
# Installs the tmux plugin manager (TPM) and the plugins listed in tmux.conf.
# Plugins live in ~/.config/tmux/plugins (outside the repo). Safe to re-run.
# Needs tmux and git; run after scripts/stow-all.sh so tmux.conf is in place.
set -euo pipefail

TPM="$HOME/.config/tmux/plugins/tpm"

command -v tmux >/dev/null || { echo "tmux is not installed" >&2; exit 1; }

if [[ ! -d "$TPM" ]]; then
  echo "==> Cloning tmux plugin manager"
  git clone --depth 1 https://github.com/tmux-plugins/tpm "$TPM"
fi

echo "==> Installing tmux plugins"
# TPM's installer reads the @plugin lines from tmux.conf via a tmux server
tmux start-server
tmux new-session -d -s tpm-install 2>/dev/null || true
tmux source-file "$HOME/.config/tmux/tmux.conf" 2>/dev/null || true
"$TPM/bin/install_plugins"
tmux kill-session -t tpm-install 2>/dev/null || true
