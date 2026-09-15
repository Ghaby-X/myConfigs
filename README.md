# myConfig

Personal Sway rice. Portable via git + GNU Stow — every top-level directory is
a stow package that mirrors `$HOME` (e.g. `kitty/.config/kitty/...` gets
symlinked to `~/.config/kitty/...`).

## Bootstrap on a new machine

```sh
git clone <this-repo> ~/project/myConfig
cd ~/project/myConfig
./install.sh                # installs tracked packages (see packages.md)
stow sway kitty waybar wofi mako theme   # symlink configs into place
```

## Layout

- `packages.md` — every package this rice depends on, and why.
- `install.sh` — installs those packages via pacman.
- `theme/` — the theme-switching engine. See `theme/.config/rice/README.md`.
- one directory per app (`sway/`, `kitty/`, `waybar/`, `wofi/`, `mako/`) — each
  a stow package.

## Switching themes

```sh
~/.config/rice/theme-set <name>
```
