# theme engine

Every theme is **one file**, `themes/<name>/colors.toml`. Everything else — kitty,
sway, the AGS bar, rofi, swaylock, GTK, Qt — is generated from it by
`theme-render`, so all apps always agree.

```
rice/
├── theme-set              # theme-set <name>: render + link + reload everything
├── theme-render           # colors.toml + templates/*.tpl -> ~/.local/state/rice/rendered/<name>/
├── wallpaper-set          # wallpaper-set <image>: change only the wallpaper
├── templates/             # one .tpl per app (sway, kitty, ags.scss, rofi, swaylock, gtk)
└── themes/<name>/
    ├── colors.toml        # the palette (below)
    ├── default-wallpaper  # optional: file in backgrounds/ used as the theme's default
    └── backgrounds/       # extra wallpapers — downloaded by scripts/fetch-wallpapers.sh, not in git
```

## colors.toml

```toml
name = "Tokyo Night"
mode = "dark"                 # or "light" (also drives the system dark/light preference)

background = "#1a1b26"        # windows, terminal, lock screen
foreground = "#c0caf5"
accent     = "#7aa2f7"        # focus borders, selections, active toggles

color0 = "#15161e"            # ANSI 0-15 for the terminal; red/green/yellow/blue/
...                           # magenta/cyan (color1-6) also drive urgent/ok/warn
color15 = "#c0caf5"

# optional — otherwise computed by fixed rules from the colors above:
cursor    = "..."             # default: foreground
selection = "..."             # default: background mixed 22% toward foreground
shell     = "..."             # bar, launcher, panels. default: background 25% darker
                              #   (5% darker for light themes)
surface   = "..."             # notification cards. default: background
border    = "..."             # default: background mixed 18% toward foreground
```

Derived roles (`urgent`, `ok`, `warn`, `muted`, `on(color)` = readable text on a
color, ...) come from the same palette, so a new theme only needs the block above.
A file of the same name in a theme folder (e.g. `themes/foo/kitty.conf`) is used
instead of the rendered one — a per-theme override.

## Adding a theme

1. `scripts/import-base16.py <scheme>` creates `colors.toml` from any of the 339
   [tinted-theming](https://github.com/tinted-theming/schemes) schemes — or write it
   by hand from the theme's official palette (some Base16 ports mis-assign colors).
2. Add wallpapers to `scripts/fetch-wallpapers.sh` and name the default in
   `default-wallpaper`.
3. `theme-set <name>` — or pick it with `$mod+t`.

## Templates

`{{ key }}`, `{{ key|strip }}` (no #), `{{ key|rgb }}`, `{{ key|upper }}`,
`{{ mix(a, b, 0.3) }}`, `{{ on(color) }}`, `{{ alpha(key, 99) }}`. The Qt palette is
computed in `theme-render` itself.

## Adding a new app to the engine

Add `templates/<file>.tpl` (its output name is the file name minus `.tpl`), then
link the rendered file from `theme-set` and have the app include/read that link.
