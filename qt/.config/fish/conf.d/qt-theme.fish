# Qt apps read their platform theme from this env var; qt6ct then applies the
# per-theme color scheme from ~/.config/qt6ct/colors/current-theme.conf.
set -gx QT_QPA_PLATFORMTHEME qt6ct
