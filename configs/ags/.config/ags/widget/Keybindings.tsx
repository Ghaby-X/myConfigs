import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import GLib from "gi://GLib"
import { With, createComputed, createState } from "ags"
import { keysOpen, setKeysOpen } from "../state"
import { loadKeyGroups, KeyGroup } from "../keys"

// Keybinding cheat sheet ($mod+/): every binding from the sway config, grouped.
//   j k / arrows   scroll        /   search        Esc / q   close

const COLUMNS = 3

// spread groups over columns, always adding to the shortest one
function toColumns(groups: KeyGroup[]): KeyGroup[][] {
  const cols: KeyGroup[][] = Array.from({ length: COLUMNS }, () => [])
  const heights = new Array(COLUMNS).fill(0)
  for (const g of groups) {
    const i = heights.indexOf(Math.min(...heights))
    cols[i].push(g)
    heights[i] += g.rows.length + 2
  }
  return cols
}

export default function Keybindings() {
  const [groups, setGroups] = createState<KeyGroup[]>([])
  const [query, setQuery] = createState("")
  const [searching, setSearching] = createState(false)
  const filtered = createComputed(() => {
    const q = query().toLowerCase().trim()
    if (!q) return groups()
    return groups()
      .map((g) => ({ ...g, rows: g.rows.filter((r) => `${g.name} ${r.desc} ${r.keys}`.toLowerCase().includes(q)) }))
      .filter((g) => g.rows.length > 0)
  })

  let win: Astal.Window
  let entry: Gtk.Entry
  let scroller: Gtk.ScrolledWindow
  const close = () => setKeysOpen(false)

  keysOpen.subscribe(() => {
    if (!keysOpen.get()) return
    setGroups(loadKeyGroups())
    setQuery("")
    setSearching(false)
    entry?.set_text("")
    win?.set_focus(null)
    scroller?.get_vadjustment()?.set_value(0)
  })

  const scroll = (delta: number) => {
    const adj = scroller?.get_vadjustment()
    if (adj) adj.set_value(Math.max(0, Math.min(adj.get_upper() - adj.get_page_size(), adj.get_value() + delta)))
  }

  const onKey = (_: unknown, keyval: number, _code: number, state: Gdk.ModifierType) => {
    if (state & (Gdk.ModifierType.CONTROL_MASK | Gdk.ModifierType.ALT_MASK)) return false
    if (searching.get()) {
      if (keyval === Gdk.KEY_Escape) return setSearching(false), win.set_focus(null), true
      if (keyval === Gdk.KEY_Return || keyval === Gdk.KEY_KP_Enter) return setSearching(false), win.set_focus(null), true
      return false
    }
    switch (keyval) {
      case Gdk.KEY_Escape:
      case Gdk.KEY_q:
        close()
        return true
      case Gdk.KEY_j:
      case Gdk.KEY_Down:
        scroll(60)
        return true
      case Gdk.KEY_k:
      case Gdk.KEY_Up:
        scroll(-60)
        return true
      case Gdk.KEY_g:
        scroll(-100000)
        return true
      case Gdk.KEY_G:
        scroll(100000)
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
      name="keys"
      class="Keybindings"
      visible={keysOpen}
      layer={Astal.Layer.OVERLAY}
      exclusivity={Astal.Exclusivity.IGNORE}
      keymode={keysOpen.as((o) => (o ? Astal.Keymode.EXCLUSIVE : Astal.Keymode.NONE))}
      application={app}
      $={(self) => (win = self)}
    >
      <Gtk.EventControllerKey propagationPhase={Gtk.PropagationPhase.CAPTURE} onKeyPressed={onKey} />
      <box class="keys-card" orientation={Gtk.Orientation.VERTICAL} spacing={12}>
        <box class="picker-header" spacing={10}>
          <label class="picker-title" label="Keybindings" xalign={0} hexpand />
          <Gtk.Entry
            class="picker-search"
            placeholderText="Search…"
            widthChars={18}
            visible={createComputed(() => searching() || query() !== "")}
            $={(self) => (entry = self)}
            onChanged={(self) => setQuery(self.get_text())}
          />
        </box>
        <Gtk.ScrolledWindow
          class="keys-scroll"
          hscrollbarPolicy={Gtk.PolicyType.NEVER}
          propagateNaturalHeight
          maxContentHeight={620}
          $={(self) => (scroller = self)}
        >
          <With value={filtered}>
            {(list) =>
              list.length === 0 ? (
                <label class="picker-empty" label="No matching keybindings" widthRequest={420} heightRequest={120} />
              ) : (
                <box class="keys-columns" spacing={22} homogeneous valign={Gtk.Align.START}>
                  {toColumns(list).map((col) => (
                    <box orientation={Gtk.Orientation.VERTICAL} spacing={14} valign={Gtk.Align.START}>
                      {col.map((g) => (
                        <box class="kb-group" orientation={Gtk.Orientation.VERTICAL} spacing={4}>
                          <label class="kb-title" label={g.name} xalign={0} />
                          {g.rows.map((r) => (
                            <box class="kb-row" orientation={Gtk.Orientation.VERTICAL}>
                              <label class="kb-desc" label={r.desc} xalign={0} wrap />
                              <label class="kb-keys" label={r.keys} xalign={0} wrap />
                            </box>
                          ))}
                        </box>
                      ))}
                    </box>
                  ))}
                </box>
              )
            }
          </With>
        </Gtk.ScrolledWindow>
        <label class="picker-hint" label="j k  scroll    /  search    Esc  close" />
      </box>
    </window>
  )
}
