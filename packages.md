# Installed packages

Every package this rice depends on, tracked so `install.sh` can reproduce the
whole setup on a fresh machine. Add a line here *and* to `install.sh` whenever
we pull in something new.

| Package      | Module    | Why                                   | Status    |
|--------------|-----------|----------------------------------------|-----------|
| ~~sway~~     | core      | Wayland compositor — **replaced** by swayfx | removed |
| waybar       | bar       | Status bar (unused, replaced by AGS/Astal below) | installed (pre-existing) |
| wofi         | launcher  | App launcher                           | installed (pre-existing) |
| foot         | terminal  | Fallback terminal                      | installed (pre-existing) |
| alacritty    | terminal  | Fallback terminal                      | installed (pre-existing) |
| grim         | screenshot| Screenshot capture                     | installed (pre-existing) |
| slurp        | screenshot| Region select for grim                 | installed (pre-existing) |
| playerctl    | media     | Media key control                      | installed (pre-existing) |
| pavucontrol  | audio     | Volume GUI                             | installed (pre-existing) |
| networkmanager | network | Network management                     | installed (pre-existing) |
| swayfx       | core      | Sway fork with rounded corners/blur/shadows/dim-inactive — drop-in replacement, same config+IPC. **From chaotic-aur specifically** (cachyos repo's build was stale, pinned to wlroots0.19 vs installed wlroots0.20). Replaced `sway`. | installed |
| stow         | core      | Symlink dotfiles from this repo        | installed |
| kitty        | terminal  | Default terminal (theme-friendly, ligatures, remote control for live theme reload) | installed |
| chaotic-aur (repo) | bar | Binary repo providing prebuilt AGS/Astal packages (and the current swayfx build) | installed |
| aylurs-gtk-shell-git | bar | AGS v2 (Astal) — bar/shell toolkit, replaces waybar. Pulls in `libastal-git` + `libastal-4-git` automatically. From chaotic-aur. | installed |
| otf-geist-mono-nerd | terminal | Geist Mono, patched with Nerd Font glyphs — kitty font (`GeistMono Nerd Font Mono`). Official `extra` repo (nerd-fonts group), no AUR needed. | installed |
| dart-sass    | bar       | Compiles the AGS bar's style.scss. Official `extra` repo. | pending |
| libastal-tray-git | bar | System tray widget. From chaotic-aur. | pending |
| libastal-network-git | bar | Network status widget. From chaotic-aur. | pending |
| libastal-wireplumber-git | bar | Volume + microphone widgets. From chaotic-aur. | pending |
| libastal-battery-git | bar | Battery widget (inert on this VM, matters on real hardware). From chaotic-aur. | pending |
| libastal-mpris-git | bar | Now-playing/media widget. From chaotic-aur. | pending |

Workspaces widget: **not** using `libastal-workspace-git` (the generic
`ext-workspace-v1` protocol binding) — it isn't in chaotic-aur's prebuilt set,
only buildable from AUR source, which we're avoiding. Using direct `swaymsg`
IPC (subprocess + JSON) instead, which is native to sway anyway. CPU/RAM/GPU
stats: no Astal lib for these either — reading `/proc` directly and shelling
out to a GPU tool if one's present.
