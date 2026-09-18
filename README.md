# myConfig

Personal SwayFX rice. Portable via git + GNU Stow — every top-level directory
is a stow package that mirrors `$HOME` (e.g. `kitty/.config/kitty/...` gets
symlinked to `~/.config/kitty/...`). Can be cloned to any path — nothing
assumes it lives at `~/project/myConfig`.

## Bootstrap on a new machine

```sh
git clone <this-repo> ~/project/myConfig   # any path works
cd ~/project/myConfig
./install.sh                # installs tracked packages (see packages.md)
./scripts/stow-all.sh       # symlinks every non-empty package into $HOME
```

Don't call `stow` directly — its default target is the *parent of wherever
you run it from*, not `$HOME`. `scripts/stow-all.sh` always targets `$HOME`
explicitly regardless of clone path or cwd.

Real per-machine specifics (actual monitor names/positions, machine-only
input quirks) go in `config.d/*.conf` inside the relevant package (e.g.
`sway/.config/sway/config.d/`) — those are gitignored on purpose so they
don't leak between machines; the tracked config auto-detects sane defaults.

## Layout

- `packages.md` — every package this rice depends on, and why.
- `install.sh` — installs those packages via pacman.
- `scripts/stow-all.sh` — symlinks every package into `$HOME`, portably.
- `theme/` — the theme-switching engine. See `theme/.config/rice/README.md`.
- one directory per app (`sway/`, `kitty/`, `ags/`, `wofi/`, `mako/`) — each
  a stow package.

## Switching themes

```sh
~/.config/rice/theme-set <name>
```
