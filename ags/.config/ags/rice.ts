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

/** Resolved path of the wallpaper currently in use. */
export function currentWallpaperPath(): string {
  try {
    return GLib.canonicalize_filename(GLib.file_read_link(`${RICE}/current-wallpaper`), RICE)
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
