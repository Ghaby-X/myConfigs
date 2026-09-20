import GLib from "gi://GLib"

// Small helpers shared by the AGS pickers for reading the rice theme folders.

export const HOME = GLib.get_home_dir()
export const RICE = `${HOME}/.config/rice`

const decoder = new TextDecoder()

export const readText = (path: string): string => {
  try {
    const [ok, bytes] = GLib.file_get_contents(path)
    return ok ? decoder.decode(bytes) : ""
  } catch {
    return ""
  }
}

export const listDir = (path: string): string[] => {
  const names: string[] = []
  try {
    const dir = GLib.Dir.open(path, 0)
    let n: string | null
    while ((n = dir.read_name())) names.push(n)
  } catch {
    // missing folder = empty
  }
  return names.sort()
}

export const prettify = (name: string) =>
  name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ")

/** Name of the active theme = the folder the ags theme symlink points into. */
export function currentThemeName(): string {
  try {
    const target = GLib.file_read_link(`${HOME}/.config/ags/current-theme.scss`)
    return target.split("/").slice(-2, -1)[0]
  } catch {
    return ""
  }
}

// ~/.config/rice is a symlink into the repo; older saved choices may hold the
// repo-side path, so map it back to the ~/.config/rice form the pickers use
const REAL_RICE = (() => {
  try {
    return GLib.canonicalize_filename(GLib.file_read_link(RICE), `${HOME}/.config`)
  } catch {
    return RICE
  }
})()

/** Path of the wallpaper currently in use, in the ~/.config/rice form. */
export function currentWallpaperPath(): string {
  try {
    const p = GLib.canonicalize_filename(GLib.file_read_link(`${RICE}/current-wallpaper`), RICE)
    return p.startsWith(`${REAL_RICE}/`) ? RICE + p.slice(REAL_RICE.length) : p
  } catch {
    return ""
  }
}

export const subsequence = (hay: string, q: string) => {
  let i = 0
  for (const ch of q) {
    i = hay.indexOf(ch, i)
    if (i < 0) return false
    i++
  }
  return true
}

export const fileExists = (path: string) => GLib.file_test(path, GLib.FileTest.EXISTS)

/** A theme's colors.toml as { key: "#hex" | "text" } (flat string values only). */
export function readColors(themeDir: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of readText(`${themeDir}/colors.toml`).matchAll(/^\s*([\w-]+)\s*=\s*"([^"]*)"/gm)) out[m[1]] = m[2]
  return out
}

/**
 * A theme's default wallpaper: the file named in default-wallpaper (inside
 * backgrounds/), else wallpaper.png, else the first image in backgrounds/.
 */
export function defaultWallpaper(themeDir: string): string {
  const bgs = listDir(`${themeDir}/backgrounds`).filter((n) => /\.(png|jpe?g|webp)$/i.test(n))
  const named = readText(`${themeDir}/default-wallpaper`).trim()
  if (named && bgs.includes(named)) return `${themeDir}/backgrounds/${named}`
  if (fileExists(`${themeDir}/wallpaper.png`)) return `${themeDir}/wallpaper.png`
  return bgs.length ? `${themeDir}/backgrounds/${bgs[0]}` : ""
}
