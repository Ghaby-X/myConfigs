# theme engine

```
rice/
├── theme-set              # the switcher: theme-set <name>
└── themes/
    ├── catppuccin-mocha/
    │   ├── sway.conf       # $bg/$fg/$accent/$urgent/$inactive + client.* lines
    │   └── kitty.conf      # kitty color directives
    └── one-dark/
        ├── sway.conf
        └── kitty.conf
```

`theme-set <name>` symlinks each app's `current-theme.conf` to the chosen
theme's snippet and reloads what it can live-reload (sway reloads instantly;
kitty needs Ctrl+Shift+F5 in already-open windows). The `current-theme.conf`
files it writes are gitignored — they're runtime state, not content; the
active theme is always reconstructable by re-running `theme-set`.

## Adding a theme

Make `themes/<name>/sway.conf` and `themes/<name>/kitty.conf`. sway.conf needs
at minimum:

```
set $bg       #......
set $fg       #......
set $accent   #......
set $urgent   #......
set $inactive #......

client.focused          $accent $bg $fg $accent $accent
client.focused_inactive $inactive $bg $fg $inactive $inactive
client.unfocused        $inactive $bg $fg $inactive $inactive
client.urgent           $urgent $bg $fg $urgent $urgent
```

As more modules gain theming (bar, launcher, notifications), each theme
folder grows a matching file (`ags.css`, `wofi.css`, `mako.conf`, ...).

## Adding a new app to the engine

1. Give the app's own config an `include current-theme.conf` (or that app's
   equivalent).
2. Add gitignore is already blanket (`**/current-theme.conf`) — nothing to do.
3. Add a `<app>.conf`/`.css` to every folder under `themes/`.
4. Add the symlink line to `theme-set`.
