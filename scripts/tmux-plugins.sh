#!/usr/bin/env bash
# Installs the tmux plugin manager (TPM) and the plugins listed in tmux.conf.
# Plugins live in ~/.config/tmux/plugins (outside the repo). Safe to re-run.
# Needs tmux and git; run after scripts/stow-all.sh so tmux.conf is in place.
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
summary_trap "tmux-plugins.sh"

TPM="$HOME/.config/tmux/plugins/tpm"

command -v tmux >/dev/null || { echo "tmux is not installed" >&2; exit 1; }

PLUGIN_DIR="$HOME/.config/tmux/plugins"
before="$(ls "$PLUGIN_DIR" 2>/dev/null | sort || true)"

if [[ ! -d "$TPM" ]]; then
  echo "==> Cloning tmux plugin manager"
  git clone --depth 1 https://github.com/tmux-plugins/tpm "$TPM"
  summary_add "plugin manager" "cloned just now"
else
  summary_add "plugin manager" "already present"
fi

echo "==> Installing tmux plugins"
# TPM's installer reads the @plugin lines from tmux.conf via a tmux server
tmux start-server
tmux new-session -d -s tpm-install 2>/dev/null || true
tmux source-file "$HOME/.config/tmux/tmux.conf" 2>/dev/null || true
"$TPM/bin/install_plugins"
tmux kill-session -t tpm-install 2>/dev/null || true

after="$(ls "$PLUGIN_DIR" | sort)"
newly="$(comm -13 <(echo "$before") <(echo "$after") | { grep -vx tpm || true; } | tr '\n' ' ')"
wanted="$(( $(grep -c "^set -g @plugin" "$HOME/.config/tmux/tmux.conf") - 1 ))"  # minus the manager itself
present="$(echo "$after" | grep -vxc tpm || true)"
summary_add "plugins" "$present of $wanted installed${newly:+ (new: $newly)}"
[[ "$present" -ge "$wanted" ]] || summary_warn "fewer plugins installed than listed — check the output above"
