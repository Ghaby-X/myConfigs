#!/usr/bin/env bash
# Installs every package this rice depends on. Safe to re-run (pacman -S skips
# already-installed packages). Requires sudo — run it yourself, not via Claude.
set -euo pipefail

PACMAN_PACKAGES=(
  stow
  kitty
)

echo "Installing: ${PACMAN_PACKAGES[*]}"
sudo pacman -S --needed "${PACMAN_PACKAGES[@]}"
