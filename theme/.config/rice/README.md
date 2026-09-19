# theme engine

```
rice/
├── theme-set              # the switcher: theme-set <name>
└── themes/
    ├── catppuccin-mocha/
    │   ├── sway.conf       # $bg/$fg/$accent/$urgent/$inactive + client.* lines
    │   ├── kitty.conf      # kitty color directives
    │   └── ags.scss        # $bg/$fg/$accent/$urgent/$inactive/$bg-alt (SCSS vars)
    └── one-dark/
        ├── sway.conf
        ├── kitty.conf
        └── ags.scss
```

`theme-set <name>` symlinks each app's `current-theme.*` to the chosen
theme's snippet and reloads what it can live-reload (sway reloads instantly;
kitty needs Ctrl+Shift+F5 in already-open windows; ags is quit and restarted).
The `current-theme.*` files it writes are gitignored — they're runtime state,
not content; the active theme is always reconstructable by re-running
`theme-set`.

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

The bar (`ags.scss`) uses the same five variables, but as SCSS `$vars`
instead of sway's `set $var` syntax. As more modules gain theming (launcher,
notifications), each theme folder grows a matching file (`rofi.rasi`,
`mako.conf`, ...).

## Adding a new app to the engine

1. Give the app's own config an `include`/`@import current-theme.<ext>` (or
   that app's equivalent).
2. Add `**/current-theme.<ext>` to the root `.gitignore`.
3. Add a `<app>.<ext>` to every folder under `themes/`.
4. Add the symlink line to `theme-set`.
