# Installed packages

Every package this rice depends on, tracked so `install.sh` can reproduce the
whole setup on a fresh machine. Add a line here *and* to `install.sh` whenever
we pull in something new.

| Package      | Module    | Why                                   | Status    |
|--------------|-----------|----------------------------------------|-----------|
| sway         | core      | Wayland compositor                     | installed (pre-existing) |
| waybar       | bar       | Status bar                             | installed (pre-existing) |
| wofi         | launcher  | App launcher                           | installed (pre-existing) |
| foot         | terminal  | Fallback terminal                      | installed (pre-existing) |
| alacritty    | terminal  | Fallback terminal                      | installed (pre-existing) |
| grim         | screenshot| Screenshot capture                     | installed (pre-existing) |
| slurp        | screenshot| Region select for grim                 | installed (pre-existing) |
| playerctl    | media     | Media key control                      | installed (pre-existing) |
| pavucontrol  | audio     | Volume GUI                             | installed (pre-existing) |
| networkmanager | network | Network management                     | installed (pre-existing) |
| stow         | core      | Symlink dotfiles from this repo        | pending   |
| kitty        | terminal  | Default terminal (theme-friendly, ligatures, remote control for live theme reload) | pending |
