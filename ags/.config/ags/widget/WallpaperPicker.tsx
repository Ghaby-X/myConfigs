import { execAsync } from "ags/process"
import { wallpaperPickerOpen, setWallpaperPickerOpen } from "../state"
import { HOME, RICE, currentThemeName, currentWallpaperPath, listDir, prettify, readText } from "../rice"
import CardPicker, { PickerItem } from "./CardPicker"

// Wallpaper picker ($mod+Ctrl+t): the active theme's wallpapers plus your own.
//   the theme's default          default-wallpaper, else wallpaper.png (tag: Default)
//   <theme>/wallpaper.png        the original built-in one     (tag: Theme)
//   <theme>/backgrounds/*        extra wallpapers for the theme (tag: Theme)
//   ~/Pictures/wallpaper/*       yours, shown under every theme  (tag: Mine)
// Choosing one only swaps the wallpaper; colors and everything else stay.

const IMAGE = /\.(png|jpe?g|webp)$/i

function loadWallpapers(): PickerItem[] {
  const theme = currentThemeName()
  const dir = `${RICE}/themes/${theme}`
  const out: PickerItem[] = []
  const seen = new Set<string>()
  const add = (path: string, label: string, tag: string) => {
    if (seen.has(path)) return
    seen.add(path)
    out.push({ id: path, label, tag, image: path })
  }

  // the theme's default: `default-wallpaper` names a file in backgrounds/,
  // otherwise (or if it isn't downloaded yet) wallpaper.png
  const named = readText(`${dir}/default-wallpaper`).trim()
  const defaultPath = named && listDir(`${dir}/backgrounds`).includes(named) ? `${dir}/backgrounds/${named}` : `${dir}/wallpaper.png`
  add(defaultPath, "Default", "Default")
  add(`${dir}/wallpaper.png`, "Original", "Theme")
  for (const f of listDir(`${dir}/backgrounds`).filter((n) => IMAGE.test(n)))
    add(`${dir}/backgrounds/${f}`, prettify(f.replace(IMAGE, "")), "Theme")
  for (const f of listDir(`${HOME}/Pictures/wallpaper`).filter((n) => IMAGE.test(n)))
    add(`${HOME}/Pictures/wallpaper/${f}`, prettify(f.replace(IMAGE, "")), "Mine")
  return out
}

export default function WallpaperPicker() {
  return CardPicker({
    name: "wallpapers",
    cssClass: "WallpaperPicker",
    title: "Wallpapers",
    emptyText: "No matching wallpapers",
    open: wallpaperPickerOpen,
    setOpen: setWallpaperPickerOpen,
    load: loadWallpapers,
    currentId: currentWallpaperPath,
    apply: (w) => {
      // detached and logged, same reason as the theme picker
      execAsync([
        "setsid",
        "-f",
        "bash",
        "-c",
        'exec "$0" "$@" >/tmp/wallpaper-set.log 2>&1 </dev/null',
        `${RICE}/wallpaper-set`,
        w.id,
      ]).catch(console.error)
    },
  })
}
