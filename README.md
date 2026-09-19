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
- one directory per app (`sway/`, `kitty/`, `ags/`, `rofi/`, `qt/`) — each
  a stow package.

## Switching themes

```sh
~/.config/rice/theme-set <name>
```

## Keyboard navigation in popups

Every AGS popup (control panel `$mod+n`, calendar `$mod+c`) grabs the keyboard
while open:

| Key | Action |
|---|---|
| `h` `j` `k` `l` / arrows | move focus |
| `Enter` | toggle / activate the focused item |
| `Shift+Enter` | further settings if the item has them (Wi-Fi → `nmtui`, Bluetooth → `bluetoothctl`, Speaker/Mic → `pavucontrol`), otherwise same as `Enter` |
| `x` | dismiss the focused notification (or clear a stack) |
| `Esc` / `q` | close |
| `H` / `L`, `PageUp` / `PageDown`, `t` | calendar only: previous / next month, jump to today |

Theme picker (`$mod+t`): `h`/`l` (or `j`/`k`) move, `Enter` applies, `/` searches by
name (`dark` / `light` filter by mode), `g`/`G` first/last, `Esc` leaves search then closes.

Wallpaper picker (`$mod+Ctrl+t`): same keys, but only the wallpaper changes. It lists
the theme's `wallpaper.png`, anything in the theme's `backgrounds/` folder, and
your own images in `~/Pictures/wallpaper/`. The choice is remembered per theme in
`~/.local/state/rice/wallpaper/` (not in git); `theme/.config/rice/wallpaper-set <image>`
does the same from a shell.

The extra wallpapers per theme are downloaded, not committed: run
`scripts/fetch-wallpapers.sh` (it also runs at the end of `install.sh`). The script
lists every image, its source and its license.

rofi menus with a search box (launcher, clipboard) use `Ctrl+h/j/k/l` instead, since
plain letters type into the search. The power menu has no search, so it takes
plain `h j k l`, `Enter` to pick and `Esc`/`q` to close.
