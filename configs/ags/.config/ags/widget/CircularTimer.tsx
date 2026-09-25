import { Gtk } from "ags/gtk4"
import { Accessor } from "ags"
import { currentThemeName, readColors, RICE } from "../rice"

/** "#rrggbb" -> [r, g, b, a] each 0..1, for Cairo. */
function hexToRgba(hex: string, alpha: number): [number, number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16) || 0
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, alpha]
}

// Read fresh every draw (cheap: a handful of regex matches on a tiny file) so
// switching themes while the panel is open doesn't leave a stale ring color.
function ringColors() {
  const colors = readColors(`${RICE}/themes/${currentThemeName()}`)
  return {
    accent: hexToRgba(colors.accent ?? "#7e9cd8", 1),
    track: hexToRgba(colors.foreground ?? "#dcd7ba", 0.12),
  }
}

/**
 * A countdown/progress ring: `fraction` (0..1) of the circle is drawn in the
 * accent color, starting at 12 o'clock and sweeping clockwise — for a
 * countdown this reads as the ring "closing in" toward empty as time runs
 * out. `text`/`sub` are centered inside it (big time, small phase/label).
 */
export default function CircularTimer({
  fraction,
  text,
  sub,
  size = 160,
}: {
  fraction: Accessor<number>
  text: Accessor<string>
  sub?: Accessor<string>
  size?: number
}) {
  let area: Gtk.DrawingArea

  const draw = (_self: Gtk.DrawingArea, cr: any, w: number, h: number) => {
    const { accent, track } = ringColors()
    const cx = w / 2
    const cy = h / 2
    const r = Math.min(w, h) / 2 - 8
    const frac = Math.max(0, Math.min(1, fraction.get()))

    cr.setLineWidth(8)
    cr.setLineCap(1) // Cairo.LineCap.ROUND

    cr.setSourceRGBA(...track)
    cr.arc(cx, cy, r, 0, Math.PI * 2)
    cr.stroke()

    if (frac > 0) {
      const start = -Math.PI / 2
      const end = start + frac * Math.PI * 2
      cr.setSourceRGBA(...accent)
      cr.arc(cx, cy, r, start, end)
      cr.stroke()
    }

    cr.$dispose()
  }

  const redraw = () => area?.queue_draw()
  fraction.subscribe(redraw)

  return (
    <overlay widthRequest={size} heightRequest={size} halign={Gtk.Align.CENTER}>
      <drawingarea widthRequest={size} heightRequest={size} $={(self) => (area = self, self.set_draw_func(draw))} />
      <box $type="overlay" orientation={Gtk.Orientation.VERTICAL} halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER} spacing={2}>
        <label class="timer-display" label={text} />
        {sub && <label class="timer-sub" label={sub} />}
      </box>
    </overlay>
  )
}
