import { execAsync } from "ags/process"
import { themePickerOpen, setThemePickerOpen } from "../state"
import { RICE, currentThemeName, defaultWallpaper, fileExists, listDir, prettify, readColors, subsequence } from "../rice"
import CardPicker, { PickerItem } from "./CardPicker"

// Theme picker ($mod+t): one card per folder in ~/.config/rice/themes.

type Theme = PickerItem & { mode: string; name: string }

function loadThemes(): Theme[] {
  return listDir(`${RICE}/themes`)
    .filter((name) => fileExists(`${RICE}/themes/${name}/colors.toml`))
    .map((name) => {
      const dir = `${RICE}/themes/${name}`
      const c = readColors(dir)
      const mode = c.mode || "dark"
      // shell = the bar/launcher color, then the palette's main colors
      const shell = c.shell ?? c.background
      return {
        id: name,
        name,
        label: c.name || prettify(name),
        tag: mode === "light" ? "Light" : "Dark",
        mode,
        image: defaultWallpaper(dir),
        swatches: [shell, c.background, c.foreground, c.accent, c.color1].filter(Boolean),
      }
    })
}

// Search: whitespace-separated tokens, all of which must match.
//   "dark" / "light"   exactly the themes of that mode
//   anything else      substring of the theme name; failing that (3+ letters) a
//                      subsequence of it ("ctmo" finds catppuccin-mocha)
//   3+ letters that start "dark"/"light" (e.g. "lig") also match by mode
const matches = (item: PickerItem, q: string) => {
  const t = item as Theme
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((tok) => {
      if (tok === "dark" || tok === "light") return t.mode === tok
      if (tok.length >= 3 && t.mode.startsWith(tok)) return true
      const name = t.name.replace(/-/g, " ")
      return name.includes(tok) || (tok.length >= 3 && subsequence(name, tok))
    })
}

export default function ThemePicker() {
  return CardPicker({
    name: "themes",
    cssClass: "ThemePicker",
    title: "Themes",
    emptyText: "No matching themes",
    open: themePickerOpen,
    setOpen: setThemePickerOpen,
    load: loadThemes,
    currentId: currentThemeName,
    match: matches,
    apply: (t) => {
      // theme-set restarts the bar (and this popup with it), so run it fully
      // detached — output to a log, not our pipes: once the bar quits those pipes
      // break and theme-set would die on its next echo, before it restarts swaybg
      execAsync([
        "setsid",
        "-f",
        "bash",
        "-c",
        `${RICE}/theme-set ${t.id} >/tmp/theme-set.log 2>&1 </dev/null`,
      ]).catch(console.error)
    },
  })
}
