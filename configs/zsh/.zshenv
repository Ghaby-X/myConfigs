# Environment for every zsh (login or not), so it also covers the tty login that
# starts sway. (Part of the `zsh` stow package.)
#
# Qt apps read their platform theme from this variable; qt6ct then applies the
# per-theme color scheme from ~/.config/qt6ct/colors/current-theme.conf.
export QT_QPA_PLATFORMTHEME=qt6ct

# Cursor theme for Qt/XWayland/any client that reads the Xcursor env.
export XCURSOR_THEME=Bibata-Modern-Classic
export XCURSOR_SIZE=24
