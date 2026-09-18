# Installed packages

Every package this rice depends on, tracked so `install.sh` can reproduce the
whole setup on a fresh machine. Add a line here *and* to `install.sh` whenever
we pull in something new.

| Package      | Module    | Why                                   | Status    |
|--------------|-----------|----------------------------------------|-----------|
| sway         | core      | Wayland compositor (pre-existing; will be **replaced** by swayfx, see below) | installed (pre-existing) |
| waybar       | bar       | Status bar (unused, replaced by AGS/Astal below) | installed (pre-existing) |
| wofi         | launcher  | App launcher                           | installed (pre-existing) |
| foot         | terminal  | Fallback terminal                      | installed (pre-existing) |
| alacritty    | terminal  | Fallback terminal                      | installed (pre-existing) |
| grim         | screenshot| Screenshot capture                     | installed (pre-existing) |
| slurp        | screenshot| Region select for grim                 | installed (pre-existing) |
| playerctl    | media     | Media key control                      | installed (pre-existing) |
| pavucontrol  | audio     | Volume GUI                             | installed (pre-existing) |
| networkmanager | network | Network management                     | installed (pre-existing) |
| swayfx       | core      | Sway fork with rounded corners/blur/shadows/dim-inactive — drop-in replacement, same config+IPC. Official `cachyos` repo, no AUR needed. **Conflicts with and replaces `sway`.** | pending |
| stow         | core      | Symlink dotfiles from this repo        | pending   |
| kitty        | terminal  | Default terminal (theme-friendly, ligatures, remote control for live theme reload) | pending |
| chaotic-aur (repo) | bar | Binary repo providing prebuilt AGS/Astal packages, no compiling needed | pending |
| aylurs-gtk-shell-git | bar | AGS v2 (Astal) — bar/shell toolkit, replaces waybar. Pulls in `libastal-git` + `libastal-4-git` automatically. From chaotic-aur. | pending |

Per-widget Astal libraries (add here as we build bar modules that need them —
all available prebuilt via chaotic-aur, e.g. `libastal-tray-git`,
`libastal-notifd-git`, `libastal-mpris-git`, `libastal-network-git`,
`libastal-wireplumber-git`, `libastal-battery-git`). Sway workspaces use the
generic `ext-workspace-v1` protocol (no Hyprland-specific IPC lib needed/available).
