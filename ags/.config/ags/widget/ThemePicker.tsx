import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { execAsync } from "ags/process"
import GLib from "gi://GLib"
import { With, createComputed, createState } from "ags"
import { themePickerOpen, setThemePickerOpen } from "../state"

// Theme picker ($mod+t): a row of cards, one per folder in ~/.config/rice/themes.
//   h l / j k / arrows   move        g G   first / last
//   Enter                apply       /     search by name
//   Esc                  leave search, then close

type Theme = { name: string; label: string; mode: string; colors: string[]; wallpaper: string }

const RICE = `${GLib.get_home_dir()}/.config/rice`
const CARD_W = 224
const GAP = 12
const decoder = new TextDecoder()

const read = (path: string): string => {
  try {
    const [ok, bytes] = GLib.file_get_contents(path)
    return ok ? decoder.decode(bytes) : ""
  } catch {
    return ""
  }
}

const prettify = (name: string) => name.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")

function loadThemes(): Theme[] {
  const names: string[] = []
  try {
    const dir = GLib.Dir.open(`${RICE}/themes`, 0)
    let n: string | null
    while ((n = dir.read_name())) names.push(n)
  } catch {
    return []
  }
  return names
    .sort()
    .map((name) => {
      const dir = `${RICE}/themes/${name}`
      const vars = Object.fromEntries(
        [...read(`${dir}/ags.scss`).matchAll(/\$([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]),
      )
      return {
        name,
        label: prettify(name),
        mode: read(`${dir}/mode`).trim() || "dark",
        colors: ["bg-alt", "bg", "fg", "accent", "urgent"].map((k) => vars[k]).filter(Boolean),
        wallpaper: `${dir}/wallpaper.png`,
      }
    })
}

function currentThemeName(): string {
  try {
    const target = GLib.file_read_link(`${GLib.get_home_dir()}/.config/ags/current-theme.scss`)
    return target.split("/").slice(-2, -1)[0]
  } catch {
    return ""
  }
}

// Search: whitespace-separated tokens, all of which must match.
//   "dark" / "light"   exactly the themes of that mode
//   anything else      substring of the theme name; failing that (3+ letters) a
//                      subsequence of it ("ctmo" finds catppuccin-mocha)
//   3+ letters that start "dark"/"light" (e.g. "lig") also match by mode
const subsequence = (hay: string, q: string) => {
  let i = 0
  for (const ch of q) {
    i = hay.indexOf(ch, i)
    if (i < 0) return false
    i++
  }
  return true
}

const matches = (t: Theme, q: string) =>
  q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((tok) => {
      if (tok === "dark" || tok === "light") return t.mode === tok
      if (tok.length >= 3 && t.mode.startsWith(tok)) return true
      const name = t.name.replace(/-/g, " ")
      return name.includes(tok) || (tok.length >= 3 && subsequence(name, tok))
    })

const [themes, setThemes] = createState<Theme[]>([])
const [query, setQuery] = createState("")
const [selected, setSelected] = createState(0)
const [searching, setSearching] = createState(false)
const filtered = createComputed(() => themes().filter((t) => !query() || matches(t, query())))
const seenColors = new Set<string>()

function Swatches({ colors }: { colors: string[] }) {
  // inline styling isn't available, so each distinct color gets a tiny class
  const css = colors
    .filter((c) => !seenColors.has(c))
    .map((c) => {
      seenColors.add(c)
      return `.sw-${c.slice(1)} { background: ${c}; }`
    })
    .join("\n")
  if (css) app.apply_css(css, false)
  return (
    <box class="swatches" spacing={4}>
      {colors.map((c) => (
        <box class={`swatch sw-${c.slice(1)}`} />
      ))}
    </box>
  )
}

export default function ThemePicker() {
  const close = () => setThemePickerOpen(false)
  let win: Astal.Window
  let entry: Gtk.Entry
  let scroller: Gtk.ScrolledWindow

  const apply = () => {
    const t = filtered.get()[selected.get()]
    if (!t) return
    close()
    // theme-set restarts the bar (and this popup with it), so run it fully
    // detached — output to a log, not our pipes: once the bar quits those pipes
    // break and theme-set would die on its next echo, before it restarts swaybg
    execAsync([
      "setsid",
      "-f",
      "bash",
      "-c",
      `${RICE}/theme-set ${t.name} >/tmp/theme-set.log 2>&1 </dev/null`,
    ]).catch(console.error)
  }

  const move = (delta: number) => {
    const n = filtered.get().length
    if (n) setSelected(Math.max(0, Math.min(n - 1, selected.get() + delta)))
  }

  // keep the selected card centred when the row is wider than the window
  selected.subscribe(() => {
    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      const adj = scroller?.get_hadjustment()
      if (adj) {
        const target = selected.get() * (CARD_W + GAP) - (adj.get_page_size() - CARD_W) / 2
        adj.set_value(Math.max(0, Math.min(adj.get_upper() - adj.get_page_size(), target)))
      }
      return GLib.SOURCE_REMOVE
    })
  })

  themePickerOpen.subscribe(() => {
    if (!themePickerOpen.get()) return
    const list = loadThemes()
    setThemes(list)
    setQuery("")
    setSearching(false)
    entry?.set_text("")
    win?.set_focus(null)
    setSelected(Math.max(0, list.findIndex((t) => t.name === currentThemeName())))
  })

  const onKey = (_: unknown, keyval: number, _code: number, state: Gdk.ModifierType) => {
    if (state & (Gdk.ModifierType.CONTROL_MASK | Gdk.ModifierType.ALT_MASK)) {
      // Ctrl+n / Ctrl+p still move the selection while typing a search
      if (searching.get() && state & Gdk.ModifierType.CONTROL_MASK) {
        if (keyval === Gdk.KEY_n) return move(1), true
        if (keyval === Gdk.KEY_p) return move(-1), true
      }
      return false
    }

    if (searching.get()) {
      if (keyval === Gdk.KEY_Escape) return setSearching(false), win.set_focus(null), true
      if (keyval === Gdk.KEY_Return || keyval === Gdk.KEY_KP_Enter) return apply(), true
      if (keyval === Gdk.KEY_Down || keyval === Gdk.KEY_Tab) return move(1), true
      if (keyval === Gdk.KEY_Up || keyval === Gdk.KEY_ISO_Left_Tab) return move(-1), true
      return false // everything else types into the search box
    }

    // Shift+g = last (uppercase keyval, or lowercase + the shift flag)
    if (Gdk.keyval_to_lower(keyval) === Gdk.KEY_g && (state & Gdk.ModifierType.SHIFT_MASK)) {
      setSelected(Math.max(0, filtered.get().length - 1))
      return true
    }

    switch (keyval) {
      case Gdk.KEY_Escape:
      case Gdk.KEY_q:
        close()
        return true
      case Gdk.KEY_h:
      case Gdk.KEY_k:
      case Gdk.KEY_Left:
      case Gdk.KEY_Up:
        move(-1)
        return true
      case Gdk.KEY_l:
      case Gdk.KEY_j:
      case Gdk.KEY_Right:
      case Gdk.KEY_Down:
        move(1)
        return true
      case Gdk.KEY_g:
        setSelected(0)
        return true
      case Gdk.KEY_G:
        setSelected(Math.max(0, filtered.get().length - 1))
        return true
      case Gdk.KEY_Return:
      case Gdk.KEY_KP_Enter:
        apply()
        return true
      case Gdk.KEY_slash:
        setSearching(true)
        entry?.grab_focus()
        return true
    }
    return false
  }

  return (
    <window
      name="themes"
      class="ThemePicker"
      visible={themePickerOpen}
      layer={Astal.Layer.OVERLAY}
      exclusivity={Astal.Exclusivity.IGNORE}
      keymode={themePickerOpen.as((o) => (o ? Astal.Keymode.EXCLUSIVE : Astal.Keymode.NONE))}
      application={app}
      $={(self) => (win = self)}
    >
      <Gtk.EventControllerKey propagationPhase={Gtk.PropagationPhase.CAPTURE} onKeyPressed={onKey} />
      <box class="picker-card" orientation={Gtk.Orientation.VERTICAL} spacing={14}>
        <box class="picker-header" spacing={10}>
          <label class="picker-title" label="Themes" xalign={0} hexpand />
          <Gtk.Entry
            class="picker-search"
            placeholderText="Search…"
            widthChars={18}
            visible={createComputed(() => searching() || query() !== "")}
            $={(self) => (entry = self)}
            onChanged={(self) => {
              setQuery(self.get_text())
              setSelected(0)
            }}
          />
        </box>
        <Gtk.ScrolledWindow
          class="picker-scroll"
          hscrollbarPolicy={Gtk.PolicyType.EXTERNAL}
          vscrollbarPolicy={Gtk.PolicyType.NEVER}
          propagateNaturalWidth
          maxContentWidth={1200}
          $={(self) => (scroller = self)}
        >
          <With value={filtered}>
            {(list) =>
              list.length === 0 ? (
                <label class="picker-empty" label="No matching themes" widthRequest={420} heightRequest={160} />
              ) : (
                <box spacing={GAP} halign={Gtk.Align.CENTER}>
                  {list.map((t, i) => (
                    <box
                      class={selected.as((s) => (s === i ? "theme-card selected" : "theme-card"))}
                      orientation={Gtk.Orientation.VERTICAL}
                      spacing={8}
                      widthRequest={CARD_W}
                    >
                      <Gtk.GestureClick
                        onPressed={() => {
                          setSelected(i)
                          apply()
                        }}
                      />
                      <box class="thumb-frame" overflow={Gtk.Overflow.HIDDEN}>
                        <Gtk.Picture
                          contentFit={Gtk.ContentFit.COVER}
                          widthRequest={CARD_W - 16}
                          heightRequest={118}
                          canShrink
                          $={(self) => self.set_filename(t.wallpaper)}
                        />
                      </box>
                      <box class="theme-meta" spacing={8}>
                        <label class="theme-name" label={t.label} xalign={0} hexpand />
                        <label class="theme-mode" label={t.mode === "light" ? "Light" : "Dark"} />
                      </box>
                      <Swatches colors={t.colors} />
                    </box>
                  ))}
                </box>
              )
            }
          </With>
        </Gtk.ScrolledWindow>
        <label class="picker-hint" label="h l  move    Enter  apply    /  search    Esc  close" />
      </box>
    </window>
  )
}
