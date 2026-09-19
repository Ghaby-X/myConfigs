#!/usr/bin/env bash
# Power menu — custom (not adi1090x-stock), ported from a previously-tuned
# hyprland+rofi setup. 3x2 icon grid (Papirus icons via rofi's dmenu icon
# association) — icon above, label below, matching the app launcher's look.
#
# Per-entry icons in dmenu mode need "Label<NUL>icon\x1f<icon-name>" — a
# REAL NUL byte (0x00), not a literal backslash-zero. Confirmed by testing
# directly. Critically, the entries must be piped straight into rofi and
# NEVER pass through a bash variable ($(...)) first — bash strings can't
# hold NUL bytes, so capturing them into a variable silently strips the
# byte and the icon association breaks (falls back to showing the raw
# "icon\x1fname" text). Only rofi's own plain-text stdout (the selected
# index) is safe to capture into a variable.
#
# Uses -format i (index) rather than matching label text, so rendering
# quirks can't break the case match.

dir="$HOME/.config/rofi"

entry() {
  printf '%s\x00icon\x1f%s\n' "$1" "$2"
}

generate_entries() {
  entry "Lock" "system-lock-screen"
  entry "Sleep" "system-suspend"
  entry "Logout" "system-log-out"
  entry "Reboot" "system-reboot"
  entry "Shutdown" "system-shutdown"
  entry "Cancel" "process-stop"
}

selected="$(generate_entries | rofi -dmenu -show-icons -theme "${dir}/powermenu.rasi" -no-custom -format i)"

case "$selected" in
  0) exec swaylock ;;
  1) exec systemctl suspend ;;
  2) exec swaymsg exit ;;
  3) exec systemctl reboot ;;
  4) exec systemctl poweroff ;;
  *) exit 0 ;;
esac
