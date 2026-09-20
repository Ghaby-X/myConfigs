import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import GLib from "gi://GLib"
import GdkPixbuf from "gi://GdkPixbuf"
import { Accessor, With, createComputed, createState } from "ags"
import { subsequence } from "../rice"

// A centred popup with a horizontally scrolling row of preview cards.
// Used by the theme picker and the wallpaper picker.
//   h l / j k / arrows   move        g G   first / last
//   Enter                apply       /     search
//   Esc                  leave search, then close

export type PickerItem = {
  id: string
  label: string
  tag?: string
  image: string
  swatches?: string[]
  data?: unknown
}

const CARD_W = 224
const GAP = 12
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

// Decoding a full-size wallpaper per card is slow; scale while loading instead.
function thumbnail(picture: Gtk.Picture, path: string) {
  try {
    const pb = GdkPixbuf.Pixbuf.new_from_file_at_scale(path, 448, 252, false)
    picture.set_paintable(Gdk.Texture.new_for_pixbuf(pb))
  } catch {
    // unreadable image: leave the card blank
  }
}

const defaultMatch = (item: PickerItem, q: string) =>
  q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((tok) => {
      const hay = item.label.toLowerCase()
      return hay.includes(tok) || (tok.length >= 3 && subsequence(hay, tok))
    })

export default function CardPicker(opts: {
  name: string
  cssClass: string
  title: string
  emptyText: string
  open: Accessor<boolean>
  setOpen: (v: boolean) => void
  load: () => PickerItem[]
  currentId: () => string
  apply: (item: PickerItem) => void
  match?: (item: PickerItem, q: string) => boolean
}) {
  const [items, setItems] = createState<PickerItem[]>([])
  const [query, setQuery] = createState("")
  const [selected, setSelected] = createState(0)
  const [searching, setSearching] = createState(false)
  const match = opts.match ?? defaultMatch
  const filtered = createComputed(() => items().filter((t) => !query() || match(t, query())))

  const close = () => opts.setOpen(false)
  let win: Astal.Window
  let entry: Gtk.Entry
  let scroller: Gtk.ScrolledWindow

  const apply = () => {
    const item = filtered.get()[selected.get()]
    if (!item) return
    close()
    opts.apply(item)
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

  opts.open.subscribe(() => {
    if (!opts.open.get()) return
    const list = opts.load()
    setItems(list)
    setQuery("")
    setSearching(false)
    entry?.set_text("")
    win?.set_focus(null)
    const cur = opts.currentId()
    setSelected(Math.max(0, list.findIndex((t) => t.id === cur)))
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
    if (Gdk.keyval_to_lower(keyval) === Gdk.KEY_g && state & Gdk.ModifierType.SHIFT_MASK) {
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
      name={opts.name}
      class={opts.cssClass}
      visible={opts.open}
      layer={Astal.Layer.OVERLAY}
      exclusivity={Astal.Exclusivity.IGNORE}
      keymode={opts.open.as((o) => (o ? Astal.Keymode.EXCLUSIVE : Astal.Keymode.NONE))}
      application={app}
      $={(self) => (win = self)}
    >
      <Gtk.EventControllerKey propagationPhase={Gtk.PropagationPhase.CAPTURE} onKeyPressed={onKey} />
      <box class="picker-card" orientation={Gtk.Orientation.VERTICAL} spacing={14}>
        <box class="picker-header" spacing={10}>
          <label class="picker-title" label={opts.title} xalign={0} hexpand />
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
                <label class="picker-empty" label={opts.emptyText} widthRequest={420} heightRequest={160} />
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
                          $={(self) => thumbnail(self, t.image)}
                        />
                      </box>
                      <box class="theme-meta" spacing={8}>
                        <label class="theme-name" label={t.label} xalign={0} hexpand ellipsize={3} maxWidthChars={18} />
                        {t.tag && <label class="theme-mode" label={t.tag} />}
                      </box>
                      {t.swatches && <Swatches colors={t.swatches} />}
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
