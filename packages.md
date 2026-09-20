# Installed packages

Every package this rice depends on, tracked so `install.sh` can reproduce the
whole setup on a fresh machine. Add a line here *and* to `install.sh` whenever
we pull in something new.

| Package      | Module    | Why                                   | Status    |
|--------------|-----------|----------------------------------------|-----------|
| ~~sway~~     | core      | Wayland compositor — **replaced** by swayfx | removed |
| waybar       | bar       | Status bar (unused, replaced by AGS/Astal below) | installed (pre-existing) |
| ~~wofi~~     | launcher  | App launcher — **replaced** by rofi, config removed from the repo (package itself can be uninstalled) | installed (pre-existing) |
| foot         | terminal  | Fallback terminal                      | installed (pre-existing) |
| alacritty    | terminal  | Fallback terminal                      | installed (pre-existing) |
| grim         | screenshot| Screenshot capture                     | installed (pre-existing) |
| slurp        | screenshot| Region select for grim                 | installed (pre-existing) |
| playerctl    | media     | Media key control                      | installed (pre-existing) |
| pavucontrol  | audio     | Volume GUI                             | installed (pre-existing) |
| networkmanager | network | Network management                     | installed (pre-existing) |
| swayfx       | core      | Sway fork with rounded corners/blur/shadows/dim-inactive — drop-in replacement, same config+IPC. **From chaotic-aur specifically** (cachyos repo's build was stale, pinned to wlroots0.19 vs installed wlroots0.20). Replaced `sway`. | installed |
| python | core | Runs `theme-render`, which generates every app's theme files from a theme's `colors.toml` (stdlib only, needs 3.11+ for `tomllib`). Normally already installed. | installed |
| stow         | core      | Symlink dotfiles from this repo        | installed |
| zsh          | core      | Default login shell — install.sh runs `chsh` to set it; config lives in the `zsh` stow package (.zshrc, .p10k.zsh, .zshenv) | installed |
| oh-my-zsh-git | zsh | Oh My Zsh framework (`git` plugin); loaded from /usr/share/oh-my-zsh by `configs/zsh/.zshrc`. cachyos/chaotic-aur. | installed |
| zsh-theme-powerlevel10k | zsh | Prompt (Pure style, configured in `configs/zsh/.p10k.zsh`). | installed |
| zsh-autosuggestions | zsh | Fish-style suggestions; color follows the rice theme. | installed |
| zsh-syntax-highlighting | zsh | Command highlighting; colors follow the rice theme. | installed |
| brightnessctl | polish | Backlight up/down for the brightness keys, via `configs/theme/.config/rice/brightness` (shows the on-screen popup). Does nothing on machines without a backlight (VM, desktop monitor). Official `extra` repo. | pending |
| neovim | nvim | Editor. Config: `configs/nvim/` stow package (LazyVim starter + markdown extra + One Dark Pro recolored per theme via `lua/rice`, tmux-navigator). Official `extra` repo. | pending |
| tree-sitter-cli | nvim | LazyVim compiles treesitter parsers with it. | pending |
| lazygit | nvim | LazyVim's `<leader>gg` git UI. | pending |
| ripgrep, fd, fzf, unzip, gcc, make, nodejs, npm | nvim | LazyVim/mason helper tools (search, downloads, parser + LSP builds). Normally already installed. | installed |
| tmux | tmux | Terminal multiplexer. Config: `configs/tmux/` stow package (Ctrl+a prefix, vim keys, `wl-copy` clipboard); colors generated from the theme (`tmux-theme.conf.tpl`); plugins via TPM (`scripts/tmux-plugins.sh`): sensible, yank, resurrect, continuum. | installed |
| eza | zsh | `ls` replacement (`alias ls="eza -l"`). | installed |
| kitty        | terminal  | Default terminal (theme-friendly, ligatures, remote control for live theme reload) | installed |
| chaotic-aur (repo) | bar | Binary repo providing prebuilt AGS/Astal packages (and the current swayfx build) | installed |
| thunar | files | GUI file explorer, bound to `$mod+e` in the sway config. Official `extra` repo. | pending |
| yazi | files | Terminal file manager (run `yazi`). Official `extra` repo. | pending |
| gvfs | files | Lets Thunar list, mount and unmount drives (USB sticks) in its sidebar. Official `extra` repo. | pending |
| udisks2 | files | Mounts drives as a normal user; used by gvfs. Official `extra` repo. | pending |
| thunar-volman | files | Thunar reacts when a drive/device is plugged in. Official `extra` repo. | pending |
| ntfs-3g | files | NTFS driver so udisks/Thunar can mount Windows/external NTFS drives (mount failed with "wrong fs type" without it). Official `extra` repo. | pending |
| ntfsprogs | files | NTFS userspace tools, notably `ntfsfix` to clear a drive's dirty flag (the kernel refuses to mount dirty NTFS volumes). Not included in `ntfs-3g` on Arch. Official `extra` repo. | pending |
| *(udisks config)* | files | `install.sh` writes `/etc/udisks2/mount_options.conf` with `ntfs_drivers=ntfs-3g` so Thunar mounts NTFS via ntfs-3g. The default kernel `ntfs3` driver refuses "dirty" volumes; the driver name must be `ntfs-3g` (hyphen) — `ntfs3g` fails with "not configured in kernel". | done |
| aylurs-gtk-shell-git | bar | AGS v2 (Astal) — bar/shell toolkit, replaces waybar. Pulls in `libastal-git` + `libastal-4-git` automatically. From chaotic-aur. | installed |
| otf-geist-mono-nerd | terminal | Geist Mono, patched with Nerd Font glyphs — kitty font (`GeistMono Nerd Font Mono`). Official `extra` repo (nerd-fonts group), no AUR needed. | installed |
| dart-sass    | bar       | Compiles the AGS bar's style.scss. Official `extra` repo. | installed |
| libastal-tray-git | bar | System tray widget. From chaotic-aur. | installed |
| libastal-network-git | bar | Network status widget. From chaotic-aur. | installed |
| libastal-wireplumber-git | bar | Volume + microphone widgets. From chaotic-aur. | installed |
| libastal-battery-git | bar | Battery widget (inert on this VM, matters on real hardware). From chaotic-aur. | installed |
| libastal-mpris-git | bar | Now-playing/media widget. From chaotic-aur. | installed |
| libastal-bluetooth-git | bar | Bluetooth status widget (grouped with wifi/battery). From chaotic-aur. | installed |
| ttf-jetbrains-mono-nerd | bar | Full icon-set Nerd Font for bar glyphs (CPU/RAM icons) — GeistMono/MesloL Nerd Font builds on this system only include a narrower "essential" glyph subset (verified: Material Design Icons/Font Awesome/Octicons codepoints render as a missing-glyph placeholder box, not tofu-that-happens-to-look-ok). Official `extra` repo. | installed |
| swaybg       | wallpaper | Wallpaper renderer — sway has no built-in background rendering, execs this. Official `extra` repo. | installed |
| rofi         | launcher  | App launcher (module 6), replaces wofi — matches a previously-tuned hyprland+rofi setup (adi1090x theme pack, type-2/style-2, onedark colors). v2.0.0 has native Wayland support built in, no `rofi-wayland` fork needed. Official `extra` repo. | installed |
| ttf-iosevka-nerd | launcher | Launcher font (adi1090x style-2 default: "Iosevka Nerd Font 10"). Official `extra` repo. | installed |
| papirus-icon-theme | launcher | App icons for the launcher grid. Official `extra` repo. | installed |
| swaylock     | lock-screen | Screen locker, styled per-theme (module 7), used by the power menu's Lock entry and swayidle. Official `extra` repo. | installed |
| swayidle     | lock-screen | Idle management (module 7) — auto-lock after 5min, DPMS off after 10min, lock before sleep. Official `extra` repo. | installed |
| libastal-notifd-git | notifications | Notification daemon + popups, AGS-native (module 8) — replaces the need for mako. Claims the org.freedesktop.Notifications D-Bus name. From chaotic-aur. | installed |
| adw-gtk-theme | polish | GTK theme for GTK3/GTK4 apps, recolored per-theme via theme/.../gtk.css. The stock Adwaita builds here hardcode their colors, so named-color overrides do nothing; adw-gtk3 is built to be recolored that way. Official `extra` repo. | installed |
| imagemagick | polish | Decodes and resizes the wallpapers `scripts/fetch-wallpapers.sh` downloads (needs JPEG XL support for the GNOME pack). Official `extra` repo. | installed |
| cliphist | polish | Clipboard history daemon storage; `wl-paste --watch` feeds it, `rofi/clipboard.sh` is the picker (`$mod+Shift+v`). Official `extra` repo. | installed |
| bibata-cursor-theme | polish | Cursor theme (Bibata-Modern-Classic, 24px), set in sway config + gsettings + `~/.zshenv`. From chaotic-aur. | installed |
| qt6ct | polish | Qt6 theming: Fusion style + per-theme palette (rendered from `themes/*/colors.toml`), generated config by theme-set; needs `QT_QPA_PLATFORMTHEME=qt6ct`, set in `~/.zshenv` (the `zsh` stow package). Official `extra` repo. | installed |
| kvantum | polish | Installed but **unused** — qt6ct + Fusion covers Qt theming; can be uninstalled. | installed (unused) |

Workspaces widget: **not** using `libastal-workspace-git` (the generic
`ext-workspace-v1` protocol binding) — it isn't in chaotic-aur's prebuilt set,
only buildable from AUR source, which we're avoiding. Using direct `swaymsg`
IPC (subprocess + JSON) instead, which is native to sway anyway. CPU/RAM/GPU
stats: no Astal lib for these either — reading `/proc` directly and shelling
out to a GPU tool if one's present.
