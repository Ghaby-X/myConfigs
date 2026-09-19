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

// ── spatial navigation ──────────────────────────────────────────────────
// GTK's own directional focus is order-based and gets confused by rows of
// different widths and by scrolled lists, so we pick the nearest focusable
// widget in the pressed direction ourselves.

type Box = { x: number; y: number; w: number; h: number }

function focusables(root: Gtk.Widget, out: Gtk.Widget[] = []): Gtk.Widget[] {
  for (let c = root.get_first_child(); c; c = c.get_next_sibling()) {
    if (c.get_focusable() && c.get_mapped() && c.is_sensitive()) out.push(c)
    focusables(c, out)
  }
  return out
}

function boxOf(w: Gtk.Widget, win: Gtk.Widget): Box | null {
  const [ok, r] = w.compute_bounds(win)
  return ok ? { x: r.get_x(), y: r.get_y(), w: r.get_width(), h: r.get_height() } : null
}

// keep a newly focused item visible inside its scrolled window
function scrollIntoView(w: Gtk.Widget) {
  for (let p = w.get_parent(); p; p = p.get_parent()) {
    if (p instanceof Gtk.ScrolledWindow) {
      const [ok, r] = w.compute_bounds(p)
      const adj = p.get_vadjustment()
      if (!ok || !adj) return
      const pad = 8
      if (r.get_y() < pad) adj.set_value(adj.get_value() + r.get_y() - pad)
      else if (r.get_y() + r.get_height() > adj.get_page_size() - pad)
        adj.set_value(adj.get_value() + r.get_y() + r.get_height() - adj.get_page_size() + pad)
      return
    }
  }
}

function focusWidget(w: Gtk.Widget) {
  w.grab_focus()
  scrollIntoView(w)
}

function moveFocus(win: Gtk.Window, dir: Gtk.DirectionType) {
  win.set_focus_visible(true)
  const cands = focusables(win)
  if (!cands.length) return
  const cur = win.get_focus()
  const from = cur && cands.includes(cur) ? boxOf(cur, win) : null
  if (!cur || !from) return focusWidget(cands[0])

  const cx = from.x + from.w / 2
  const cy = from.y + from.h / 2
  let best: Gtk.Widget | null = null
  let bestScore = Infinity

  for (const c of cands) {
    if (c === cur) continue
    const b = boxOf(c, win)
    if (!b) continue
    const dx = b.x + b.w / 2 - cx
    const dy = b.y + b.h / 2 - cy
    let score: number
    if (dir === Gtk.DirectionType.DOWN || dir === Gtk.DirectionType.UP) {
      const along = dir === Gtk.DirectionType.DOWN ? dy : -dy
      if (along < 4) continue
      score = along + Math.abs(dx) * 0.5
    } else {
      const along = dir === Gtk.DirectionType.RIGHT ? dx : -dx
      if (along < 4 || Math.abs(dy) > from.h * 0.6) continue // same row only
      score = along
    }
    if (score < bestScore) {
      bestScore = score
      best = c
    }
  }
  if (best) focusWidget(best)
}

/** Focus the first focusable item (used when a popup opens). */
export function focusFirst(win: Gtk.Window) {
  win.set_focus_visible(true)
  let first: Gtk.Widget | null = null
  let firstBox: Box | null = null
  for (const c of focusables(win)) {
    const b = boxOf(c, win)
    if (!b) continue
    // top-most row first, then left-most (rows within 6px count as one row)
    if (!firstBox || b.y < firstBox.y - 6 || (Math.abs(b.y - firstBox.y) <= 6 && b.x < firstBox.x)) {
      first = c
      firstBox = b
    }
  }
  if (first) focusWidget(first)
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
      moveFocus(win, dir)
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
