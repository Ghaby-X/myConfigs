import { Gtk, Gdk } from "ags/gtk4"

// Keyboard navigation shared by every AGS popup.
//   h j k l / arrows   move focus (GTK's directional focus — works across rows)
//   Enter              activate the focused item (toggle / press)
//   Shift+Enter        "further settings" if the item has them, else = Enter
//   Escape / q         close
// Items register optional handlers with `navItem`; anything focusable without
// one falls back to a plain widget activate (which presses buttons).

export type NavHandlers = {
  activate?: () => void
  more?: () => void
  dismiss?: () => void
}

const items = new WeakMap<Gtk.Widget, NavHandlers>()

export function navItem<T extends Gtk.Widget>(widget: T, handlers: NavHandlers): T {
  items.set(widget, handlers)
  return widget
}

function handlersFor(w: Gtk.Widget | null): { widget: Gtk.Widget; h: NavHandlers } | null {
  for (let cur = w; cur; cur = cur.get_parent()) {
    const h = items.get(cur)
    if (h) return { widget: cur, h }
  }
  return w ? { widget: w, h: {} } : null
}

const DIRECTIONS: Record<number, Gtk.DirectionType> = {
  [Gdk.KEY_h]: Gtk.DirectionType.LEFT,
  [Gdk.KEY_Left]: Gtk.DirectionType.LEFT,
  [Gdk.KEY_l]: Gtk.DirectionType.RIGHT,
  [Gdk.KEY_Right]: Gtk.DirectionType.RIGHT,
  [Gdk.KEY_j]: Gtk.DirectionType.DOWN,
  [Gdk.KEY_Down]: Gtk.DirectionType.DOWN,
  [Gdk.KEY_k]: Gtk.DirectionType.UP,
  [Gdk.KEY_Up]: Gtk.DirectionType.UP,
}

/** Focus the first focusable item (used when a popup opens). */
export function focusFirst(win: Gtk.Window) {
  win.set_focus_visible(true)
  win.child_focus(Gtk.DirectionType.TAB_FORWARD)
}

/**
 * Key handler to attach (capture phase) to a popup window. `extra` gets first
 * refusal on every key — return true if it handled it.
 */
export function popupKeys(
  getWin: () => Gtk.Window,
  opts: { close: () => void; extra?: (keyval: number, shift: boolean) => boolean },
) {
  return (_: unknown, keyval: number, _code: number, state: Gdk.ModifierType) => {
    const win = getWin()
    const shift = (state & Gdk.ModifierType.SHIFT_MASK) !== 0
    const ctrlAlt = (state & (Gdk.ModifierType.CONTROL_MASK | Gdk.ModifierType.ALT_MASK)) !== 0
    if (ctrlAlt) return false

    if (opts.extra?.(keyval, shift)) return true

    if (keyval === Gdk.KEY_Escape || keyval === Gdk.KEY_q) {
      opts.close()
      return true
    }

    const dir = DIRECTIONS[keyval]
    if (dir !== undefined) {
      win.set_focus_visible(true)
      if (!win.get_focus()) win.child_focus(Gtk.DirectionType.TAB_FORWARD)
      else win.child_focus(dir)
      return true
    }

    if (keyval === Gdk.KEY_Return || keyval === Gdk.KEY_KP_Enter || keyval === Gdk.KEY_ISO_Enter) {
      const target = handlersFor(win.get_focus())
      if (!target) return true
      const fn = (shift ? target.h.more : undefined) ?? target.h.activate
      if (fn) fn()
      else target.widget.activate()
      return true
    }

    if (keyval === Gdk.KEY_x) {
      const target = handlersFor(win.get_focus())
      if (target?.h.dismiss) {
        target.h.dismiss()
        return true
      }
    }

    return false
  }
}
