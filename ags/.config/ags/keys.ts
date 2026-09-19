import { HOME, readText } from "./rice"

// Reads the keybinding cheat sheet straight from the sway config, so it can't go
// stale. Each binding is described by a comment line right above it:
//     #: Group | What it does
// Bindings with the same group + description are merged into one row.

export type KeyRow = { keys: string; desc: string }
export type KeyGroup = { name: string; rows: KeyRow[] }

const CONFIG = `${HOME}/.config/sway/config`
const TMUX_CONFIG = `${HOME}/.config/tmux/tmux.conf`
const GROUP_ORDER = ["Apps", "Session", "Windows", "Layout", "Workspaces", "Scratchpad", "Popups", "Screenshots", "Media", "tmux"]

const NAMES: Record<string, string> = {
  return: "Enter", escape: "Esc", space: "Space", minus: "-", slash: "/", tab: "Tab",
  bracketleft: "[", bracketright: "]", print: "PrtSc", left: "←", right: "→", up: "↑", down: "↓",
  xf86audioraisevolume: "Vol +", xf86audiolowervolume: "Vol −", xf86audiomute: "Mute",
  xf86audioplay: "Play", xf86audionext: "Next", xf86audioprev: "Prev",
  shift: "Shift", ctrl: "Ctrl", control: "Ctrl", alt: "Alt", mod1: "Alt", mod4: "Super", super: "Super",
}

function prettyPart(part: string, mod: string): string {
  if (part === "$mod") return mod
  const n = NAMES[part.toLowerCase()]
  if (n) return n
  return part.length === 1 ? part.toUpperCase() : part
}

/** "Super + Shift + E" style, plus compaction of combos that share modifiers. */
function compact(combos: string[][]): string {
  const byPrefix = new Map<string, string[]>()
  for (const parts of combos) {
    const prefix = parts.slice(0, -1).join(" + ")
    byPrefix.set(prefix, [...(byPrefix.get(prefix) ?? []), parts[parts.length - 1]])
  }
  return [...byPrefix.entries()]
    .map(([prefix, lasts]) => {
      const last = lasts.length > 5 && lasts.every((l) => /^\d$/.test(l)) ? `${lasts[0]} – ${lasts[lasts.length - 1]}` : lasts.join(" / ")
      return prefix ? `${prefix} + ${last}` : last
    })
    .join("   ·   ")
}

// ── tmux: `#: tmux | desc` above a `bind ...` line (same convention as sway) ──
function tmuxKey(k: string): string {
  k = k.replace(/^['"]|['"]$/g, "").replace(/\\\\/g, "\\")
  const ctrl = k.match(/^C-(.+)$/)
  if (ctrl) return `Ctrl + ${ctrl[1].toUpperCase()}`
  return NAMES[k.toLowerCase()] ?? k
}

function loadTmuxRows(): KeyRow[] {
  const text = readText(TMUX_CONFIG)
  if (!text) return []
  let prefix = "Ctrl + B"
  const pm = text.match(/^\s*set(?:-option)?\s+-g\s+prefix\s+(\S+)/m)
  if (pm) prefix = tmuxKey(pm[1])

  const rows = new Map<string, Map<string, string[]>>() // desc -> lead -> keys
  const add = (desc: string, lead: string, key: string) => {
    const leads = rows.get(desc) ?? new Map<string, string[]>()
    leads.set(lead, [...(leads.get(lead) ?? []), key])
    rows.set(desc, leads)
  }

  let pending: string | null = null
  for (const raw of text.split("\n")) {
    const line = raw.trim()
    const note = line.match(/^#:\s*tmux\s*\|\s*(.+)$/)
    if (note) {
      pending = note[1].trim()
      continue
    }
    if (pending) {
      if (/^set(?:-option)?\s+-g\s+prefix\s/.test(line)) add(pending, "", prefix)
      else if (/^bind(?:-key)?\s/.test(line)) {
        const toks = line.match(/'[^']*'|"[^"]*"|\S+/g) ?? []
        let i = 1
        let noPrefix = false
        let table = ""
        while (/^-[a-zA-Z]+$/.test(toks[i] ?? "")) { // flags like -r -n -T (a lone "-" is a key)
          if (toks[i] === "-n") noPrefix = true
          if (toks[i] === "-T") {
            table = toks[i + 1]
            i++
          }
          i++
        }
        const key = tmuxKey(toks[i])
        if (table === "copy-mode-vi") add(pending, "copy mode:", key)
        else if (noPrefix) add(pending, "", key)
        else add(pending, `${prefix}, then`, key)
      }
    }
    if (line && !line.startsWith("#")) pending = null
  }

  return [...rows.entries()].map(([desc, leads]) => ({
    desc,
    keys: [...leads.entries()].map(([lead, keys]) => `${lead ? lead + " " : ""}${keys.join(" / ")}`).join("   ·   "),
  }))
}

export function loadKeyGroups(): KeyGroup[] {
  const text = readText(CONFIG)
  const mod = /^\s*set\s+\$mod\s+Mod1\b/m.test(text) ? "Alt" : "Super"
  const merged = new Map<string, Map<string, string[][]>>() // group -> desc -> combos
  let pending: { group: string; desc: string } | null = null

  for (const raw of text.split("\n")) {
    const line = raw.trim()
    const note = line.match(/^#:\s*([^|]+)\|\s*(.+)$/)
    if (note) {
      pending = { group: note[1].trim(), desc: note[2].trim() }
      continue
    }
    const bind = line.match(/^bindsym\s+(?:--\S+\s+)*(\S+)\s+/)
    if (bind && pending) {
      const parts = bind[1].split("+").map((p) => prettyPart(p, mod))
      const g = merged.get(pending.group) ?? new Map<string, string[][]>()
      g.set(pending.desc, [...(g.get(pending.desc) ?? []), parts])
      merged.set(pending.group, g)
    }
    if (bind || (line && !line.startsWith("#"))) pending = null
  }

  const rank = (n: string) => {
    const i = GROUP_ORDER.indexOf(n)
    return i < 0 ? GROUP_ORDER.length : i
  }
  const groups: KeyGroup[] = [...merged.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]))
    .map(([name, descs]) => ({
      name,
      rows: [...descs.entries()].map(([desc, combos]) => ({ desc, keys: compact(combos) })),
    }))
  const tmuxRows = loadTmuxRows()
  if (tmuxRows.length) groups.push({ name: "tmux", rows: tmuxRows })
  return groups
}
