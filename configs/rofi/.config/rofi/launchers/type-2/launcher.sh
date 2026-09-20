#!/usr/bin/env bash
## Author : Aditya Shakya (adi1090x), adapted
## Rofi   : App launcher (drun)

dir="$HOME/.config/rofi/launchers/type-2"
theme='style-2'

rofi \
    -show drun \
    -theme "${dir}/${theme}.rasi"
