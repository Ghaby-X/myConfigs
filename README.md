# myConfig

Personal SwayFX rice. Portable via git + GNU Stow — every directory inside
`configs/` is a stow package that mirrors `$HOME` (e.g. `configs/kitty/.config/kitty/...`
gets symlinked to `~/.config/kitty/...`). Can be cloned to any path — nothing
assumes it lives at `~/project/myConfig`.

## Bootstrap on a new machine

```sh
git clone <this-repo> ~/project/myConfig   # any path works
cd ~/project/myConfig
./install.sh                # installs tracked packages (see packages.md)
./scripts/stow-all.sh       # symlinks every non-empty package into $HOME (and fetches the tmux plugins)
```

The extra wallpapers download during `install.sh`; the tmux plugins during
`stow-all.sh`, once the config is linked (either script can be re-run safely).

Don't call `stow` directly — its default target is the *parent of wherever
you run it from*, not `$HOME`. `scripts/stow-all.sh` always targets `$HOME`
explicitly regardless of clone path or cwd.

Real per-machine specifics (actual monitor names/positions, machine-only
input quirks) go in `config.d/*.conf` inside the relevant package (e.g.
`configs/sway/.config/sway/config.d/`) — those are gitignored on purpose so they
don't leak between machines; the tracked config auto-detects sane defaults.

## Layout

```
configs/            one stow package per app; each mirrors $HOME
  ags/              the bar, notifications, control panel and popups (AGS)
  kitty/            terminal
  nvim/             Neovim (LazyVim), recolored by the active theme
  rofi/             launcher, power menu, clipboard history
  sway/             the compositor config (SwayFX)
  theme/            the theme engine: colors.toml per theme -> every app's colors
  tmux/             tmux
  zsh/              .zshrc, .p10k.zsh, .zshenv
scripts/            install helpers (stow-all, wallpaper fetch, tmux plugins, base16 import)
install.sh          installs every package the rice needs (see packages.md)
packages.md         every package, why it's there, and whether it's installed
```

- `configs/theme/.config/rice/README.md` explains the theme engine.
- `scripts/stow-all.sh` links every package in `configs/` into `$HOME`, portably.

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
`~/.local/state/rice/wallpaper/` (not in git); `configs/theme/.config/rice/wallpaper-set <image>`
does the same from a shell.

The extra wallpapers per theme are downloaded, not committed: run
`scripts/fetch-wallpapers.sh` (it also runs at the end of `install.sh`). The script
lists every image, its source and its license.

rofi menus with a search box (launcher, clipboard) use `Ctrl+h/j/k/l` instead, since
plain letters type into the search. The power menu has no search, so it takes
plain `h j k l`, `Enter` to pick and `Esc`/`q` to close.

## Window and workspace keys

`$mod+/` opens a searchable cheat sheet of every binding, grouped. It reads the sway
config itself: give each new binding a description with a comment line above it,
`#: Group | What it does`, and it appears (bindings with the same description merge
into one row).

| Key | Action |
|---|---|
| `$mod` + `h j k l` / arrows | focus left / down / up / right |
| `$mod+Shift` + `h j k l` / arrows | move the window |
| `$mod+Ctrl` + `h j k l` | resize (or `$mod+r` for resize mode) |
| `$mod+v` / `$mod+b` | next window splits vertically / horizontally |
| `$mod+s` / `$mod+Shift+w` / `$mod+e` | stacking / tabbed / toggle split layout |
| `$mod+w` | close the focused window |
| `$mod+a` / `$mod+Shift+a` | focus parent / child container |
| `$mod+f` | maximize: the window looks like the only one open, top bar stays (press again to restore; a new window restores it too) |
| `$mod+Shift+f` | real fullscreen, covers the bar |
| `$mod+Shift+Space` / `$mod+Space` | toggle floating / switch focus between tiled and floating |
| `$mod+Shift+minus` / `$mod+minus` | send to scratchpad / show scratchpad |
| `$mod+1..0` | workspace (`+Shift` moves the window there) |
| `$mod+Tab` | previous workspace |
| `$mod+[` / `$mod+]` | previous / next existing workspace |
| `$mod` + left / right mouse drag | move / resize a floating window |
