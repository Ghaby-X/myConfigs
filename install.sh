#!/usr/bin/env bash
# Installs every package this rice depends on. Safe to re-run. Requires sudo —
# run it yourself, not via Claude.
set -euo pipefail

CHAOTIC_KEY=3056513887B78AEB

if ! pacman-key --list-keys "$CHAOTIC_KEY" >/dev/null 2>&1; then
  echo "==> Importing Chaotic-AUR signing key"
  sudo pacman-key --recv-key "$CHAOTIC_KEY" --keyserver keyserver.ubuntu.com
  sudo pacman-key --lsign-key "$CHAOTIC_KEY"
fi

if ! pacman -Q chaotic-keyring >/dev/null 2>&1; then
  echo "==> Installing Chaotic-AUR keyring + mirrorlist"
  sudo pacman -U --noconfirm \
    'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-keyring.pkg.tar.zst' \
    'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-mirrorlist.pkg.tar.zst'
fi

if ! grep -q '^\[chaotic-aur\]' /etc/pacman.conf; then
  echo "==> Adding [chaotic-aur] repo to /etc/pacman.conf"
  printf '\n[chaotic-aur]\nInclude = /etc/pacman.d/chaotic-mirrorlist\n' | sudo tee -a /etc/pacman.conf >/dev/null
  sudo pacman -Syu
fi

PACMAN_PACKAGES=(
  stow
  python                 # theme-render (generates every theme file from colors.toml); stdlib only
  zsh                    # default login shell (set below); ~/.zshenv from the qt package exports the Qt theme var
  kitty
  aylurs-gtk-shell-git   # AGS v2 / Astal — bar/shell toolkit (from chaotic-aur, prebuilt)
  otf-geist-mono-nerd    # kitty font (official extra repo, nerd-fonts group)
  ttf-jetbrains-mono-nerd  # full icon-set nerd font for bar glyphs (CPU/RAM) — GeistMono/MesloL builds lack these
  dart-sass              # compiles the bar's style.scss (official extra repo)
  swaybg                 # wallpaper renderer (module 5) — official extra repo
  rofi                   # launcher (module 6) — v2.0.0 has native Wayland support, no fork needed
  ttf-iosevka-nerd       # launcher font (adi1090x style-2 default)
  papirus-icon-theme     # launcher app icons
  swaylock               # screen locker — used by the power menu's Lock entry
  swayidle               # idle management (module 7) — auto-lock, DPMS off
  adw-gtk-theme          # GTK3/GTK4 theme built to be recolored via named colors (polish: GTK theming)
  imagemagick            # decodes/resizes the extra wallpapers (fetch-wallpapers.sh; includes JPEG XL support)
  cliphist               # clipboard history (polish) — picker is rofi/clipboard.sh
  bibata-cursor-theme    # cursor theme (polish) — from chaotic-aur
  qt6ct                  # Qt6 platform theme — applies per-theme color scheme (polish: Qt theming)
)

echo "Installing: ${PACMAN_PACKAGES[*]}"
sudo pacman -S --needed "${PACMAN_PACKAGES[@]}"

# cachyos's swayfx build lags behind their own wlroots updates (was pinned to
# wlroots0.19 while cachyos ships wlroots0.20) — pull it from chaotic-aur
# explicitly instead, since repo priority would otherwise pick the stale one.
sudo pacman -S --needed chaotic-aur/swayfx

# Astal widget libraries for the bar (module 4) — all prebuilt via chaotic-aur.
sudo pacman -S --needed \
  libastal-tray-git \
  libastal-network-git \
  libastal-wireplumber-git \
  libastal-battery-git \
  libastal-mpris-git \
  libastal-bluetooth-git \
  libastal-notifd-git

# Default login shell -> zsh (chsh prompts for your password).
if [[ "$(getent passwd "$USER" | cut -d: -f7)" != */zsh ]]; then
  echo "==> Setting default shell to zsh"
  chsh -s "$(command -v zsh)"
fi

# Extra per-theme wallpapers for the wallpaper picker (downloaded, not in git).
"$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/scripts/fetch-wallpapers.sh"
