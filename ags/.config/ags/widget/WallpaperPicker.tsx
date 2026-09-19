import { execAsync } from "ags/process"
import { wallpaperPickerOpen, setWallpaperPickerOpen } from "../state"
import { HOME, RICE, currentThemeName, currentWallpaperPath, listDir, prettify } from "../rice"
import CardPicker, { PickerItem } from "./CardPicker"

// Wallpaper picker ($mod+Ctrl+t): the active theme's wallpapers plus your own.
//   <theme>/wallpaper.png        the theme's default            (tag: Default)
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

  add(`${dir}/wallpaper.png`, "Default", "Default")
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
