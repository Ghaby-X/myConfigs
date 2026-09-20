#!/usr/bin/env bash
# Installs every package this rice depends on. Safe to re-run. Requires sudo —
# run it yourself, not via Claude.
#
#   ./install.sh             install everything, then print a summary of what happened
#   ./install.sh --dry-run   only report what is already installed and what would be
#                            installed (no sudo, changes nothing)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$REPO_ROOT/scripts/lib.sh"

DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

CHAOTIC_KEY=3056513887B78AEB
chaotic_actions=()

if ! pacman-key --list-keys "$CHAOTIC_KEY" >/dev/null 2>&1; then
  echo "==> Importing Chaotic-AUR signing key"
  sudo pacman-key --recv-key "$CHAOTIC_KEY" --keyserver keyserver.ubuntu.com
  sudo pacman-key --lsign-key "$CHAOTIC_KEY"
  chaotic_actions+=("signing key imported")
fi

if ! pacman -Q chaotic-keyring >/dev/null 2>&1; then
  echo "==> Installing Chaotic-AUR keyring + mirrorlist"
  sudo pacman -U --noconfirm \
    'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-keyring.pkg.tar.zst' \
    'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-mirrorlist.pkg.tar.zst'
  chaotic_actions+=("keyring + mirrorlist installed")
fi

if ! grep -q '^\[chaotic-aur\]' /etc/pacman.conf; then
  echo "==> Adding [chaotic-aur] repo to /etc/pacman.conf"
  printf '\n[chaotic-aur]\nInclude = /etc/pacman.d/chaotic-mirrorlist\n' | sudo tee -a /etc/pacman.conf >/dev/null
  sudo pacman -Syu
  chaotic_actions+=("repo added to pacman.conf")
fi

PACMAN_PACKAGES=(
  stow
  python                 # theme-render (generates every theme file from colors.toml); stdlib only
  zsh                    # default login shell (set below); config is the `zsh` stow package
  oh-my-zsh-git          # Oh My Zsh (cachyos/chaotic-aur), loaded from /usr/share by ~/.zshrc
  zsh-theme-powerlevel10k # prompt
  zsh-autosuggestions
  zsh-syntax-highlighting
  brightnessctl          # backlight keys (configs/theme/.config/rice/brightness); no-op without a backlight
  neovim                 # editor; config is the `nvim` stow package (LazyVim; recolored by the rice theme)
  tree-sitter-cli        # LazyVim compiles syntax parsers with it
  lazygit                # LazyVim's git UI
  ripgrep                # LazyVim search (also fd, fzf, gcc, make, unzip, nodejs, npm below)
  fd
  fzf
  unzip
  gcc
  make
  nodejs
  npm
  tmux                   # terminal multiplexer; config is the `tmux` stow package (plugins: scripts/tmux-plugins.sh)
  eza                    # `ls` alias in ~/.zshrc
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

# cachyos's swayfx build lags behind their own wlroots updates (was pinned to
# wlroots0.19 while cachyos ships wlroots0.20) — it is pulled from chaotic-aur
# explicitly instead, since repo priority would otherwise pick the stale one.
SWAYFX_PACKAGE=swayfx

# Astal widget libraries for the bar (module 4) — all prebuilt via chaotic-aur.
ASTAL_PACKAGES=(
  libastal-tray-git
  libastal-network-git
  libastal-wireplumber-git
  libastal-battery-git
  libastal-mpris-git
  libastal-bluetooth-git
  libastal-notifd-git
)

ALL_PACKAGES=("${PACMAN_PACKAGES[@]}" "$SWAYFX_PACKAGE" "${ASTAL_PACKAGES[@]}")
installed_before="$(pacman -Qq | sort)"
is_installed() { grep -qx -- "$1" <<<"$installed_before"; }

already=(); todo=()
for p in "${ALL_PACKAGES[@]}"; do
  if is_installed "$p"; then already+=("$p"); else todo+=("$p"); fi
done

if [[ $DRY_RUN -eq 1 ]]; then
  echo "install.sh --dry-run (nothing will be changed)"
  echo "  packages the rice needs:  ${#ALL_PACKAGES[@]}"
  echo "  already installed:        ${#already[@]}"
  echo "  would be installed:       ${#todo[@]}${todo[*]:+  →  ${todo[*]}}"
  chaotic="not configured (would be set up)"
  grep -q '^\[chaotic-aur\]' /etc/pacman.conf && chaotic="configured"
  echo "  chaotic-aur repo:         $chaotic"
  echo "  login shell:              $(getent passwd "$USER" | cut -d: -f7)"
  exit 0
fi

summary_trap "install.sh"


echo "Installing ${#todo[@]} missing packages (${#already[@]} already present)"
sudo pacman -S --needed "${PACMAN_PACKAGES[@]}"
sudo pacman -S --needed "chaotic-aur/$SWAYFX_PACKAGE"
sudo pacman -S --needed "${ASTAL_PACKAGES[@]}"

installed_after="$(pacman -Qq | sort)"
newly=(); missing=()
for p in "${todo[@]}"; do
  if grep -qx -- "$p" <<<"$installed_after"; then newly+=("$p"); else missing+=("$p"); fi
done
summary_add "chaotic-aur" "${chaotic_actions[*]:-already set up}"
summary_add "packages" "${#ALL_PACKAGES[@]} required — ${#already[@]} already present, ${#newly[@]} newly installed, ${#missing[@]} missing"
[[ ${#newly[@]} -gt 0 ]] && summary_add "newly installed" "${newly[*]}"
[[ ${#missing[@]} -gt 0 ]] && summary_warn "not installed: ${missing[*]}"

# Default login shell -> zsh (chsh prompts for your password).
if [[ "$(getent passwd "$USER" | cut -d: -f7)" != */zsh ]]; then
  echo "==> Setting default shell to zsh"
  chsh -s "$(command -v zsh)"
  summary_add "login shell" "changed to zsh (takes effect at next login)"
else
  summary_add "login shell" "already zsh"
fi

# Extra per-theme wallpapers for the wallpaper picker (downloaded, not in git).
if "$REPO_ROOT/scripts/fetch-wallpapers.sh"; then
  summary_add "wallpapers" "downloaded / already present (details above)"
else
  summary_add "wallpapers" "some downloads failed"
  summary_warn "some wallpapers could not be downloaded — re-run scripts/fetch-wallpapers.sh"
fi

# tmux plugin manager + plugins (needs the dotfiles stowed first: scripts/stow-all.sh).
if [[ -f "$HOME/.config/tmux/tmux.conf" ]]; then
  if "$REPO_ROOT/scripts/tmux-plugins.sh"; then
    summary_add "tmux plugins" "installed / up to date (details above)"
  else
    summary_add "tmux plugins" "failed"
    summary_warn "tmux plugins failed — re-run scripts/tmux-plugins.sh"
  fi
else
  summary_add "tmux plugins" "skipped (dotfiles not linked yet)"
fi

echo
echo "Next: ./scripts/stow-all.sh   (links the configs into your home folder)"
