#!/usr/bin/env bash
# Power menu — custom (not adi1090x-stock), ported from a previously-tuned
# hyprland+rofi setup. Uses -format i (index) rather than matching label
# text/icons, so rendering quirks can't break the case match.

dir="$HOME/.config/rofi"

lock=$' Lock'
sleep_opt=$' Sleep'
logout=$' Logout'
reboot=$' Reboot'
shutdown=$' Shutdown'

options="$lock
$sleep_opt
$logout
$reboot
$shutdown"

selected="$(echo "$options" | rofi -dmenu -theme "${dir}/powermenu.rasi" -no-custom -format i)"

case "$selected" in
  0) exec swaylock ;;
  1) exec systemctl suspend ;;
  2) exec swaymsg exit ;;
  3) exec systemctl reboot ;;
  4) exec systemctl poweroff ;;
esac
