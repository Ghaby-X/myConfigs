import app from "ags/gtk4/app"
import { Astal, Gtk } from "ags/gtk4"
import GLib from "gi://GLib"
import Notifd from "gi://AstalNotifd"
import { For, createState } from "ags"
import { panelOpen } from "../state"

const DEFAULT_TIMEOUT_MS = 5000

// The bar/AGS use Adwaita (system icon theme), which has no app logos —
// look app icons up in Papirus instead (same theme rofi uses) without
// changing the system-wide theme, which would restyle the bar's icons too.
const papirus = Gtk.IconTheme.new()
papirus.set_theme_name("Papirus")

export function appIconPaintable(n: Notifd.Notification): Gtk.IconPaintable | null {
  // also try a slug of the app name ("Mozilla Firefox" -> "firefox")
  const slug = n.appName?.toLowerCase().replace(/^mozilla[\s-]+/, "").replace(/\s+/g, "-")
  const candidates = [n.appIcon, n.desktopEntry, n.appName?.toLowerCase(), slug].filter(Boolean) as string[]
  for (const name of candidates) {
    if (papirus.has_icon(name)) {
      return papirus.lookup_icon(name, null, 48, 1, Gtk.TextDirection.NONE, 0)
    }
  }
  return null
}

export function timeLabel(unix: number): string {
  return GLib.DateTime.new_from_unix_local(unix).format("%H:%M") ?? ""
}

function NotificationCard({ n }: { n: Notifd.Notification }) {
  const critical = n.urgency === Notifd.Urgency.CRITICAL
  const hasFile = n.image && n.image.startsWith("/")
  const appIcon = hasFile ? null : appIconPaintable(n)

  return (
    <box class={critical ? "notification critical" : "notification"} orientation={Gtk.Orientation.VERTICAL} spacing={6}>
      <Gtk.GestureClick onPressed={() => n.dismiss()} />
      <box class="header" spacing={8}>
        <label class="app-name" label={n.appName || "Notification"} hexpand xalign={0} />
        <label class="time" label={timeLabel(n.time)} />
      </box>
      <box class="content" spacing={10}>
        {hasFile ? (
          <image class="thumb" file={n.image} pixelSize={48} valign={Gtk.Align.START} />
        ) : appIcon ? (
          <image class="thumb" paintable={appIcon} pixelSize={48} valign={Gtk.Align.START} />
        ) : (
          <image
            class="thumb"
            iconName={n.appIcon || n.desktopEntry || "dialog-information-symbolic"}
            pixelSize={48}
            valign={Gtk.Align.START}
          />
        )}
        <box orientation={Gtk.Orientation.VERTICAL} spacing={2} hexpand>
          <label class="title" label={n.summary} xalign={0} wrap maxWidthChars={36} />
          {n.body ? <label class="body" label={n.body} xalign={0} wrap maxWidthChars={40} /> : <box />}
        </box>
      </box>
      {n.actions.length > 0 && (
        <box class="actions" spacing={6}>
          {n.actions.map((a) => (
            <button class="action-button" hexpand onClicked={() => n.invoke(a.id)}>
              <label label={a.label} />
            </button>
          ))}
        </box>
      )}
    </box>
  )
}

export default function NotificationPopups() {
  const notifd = Notifd.get_default()
  const [popups, setPopups] = createState<Notifd.Notification[]>([])

  const remove = (id: number) => setPopups((list) => list.filter((n) => n.id !== id))

  notifd.connect("notified", (_, id: number, replaced: boolean) => {
    const n = notifd.get_notification(id)
    if (!n) return
    if (notifd.dontDisturb && n.urgency !== Notifd.Urgency.CRITICAL) return
    // the open control panel already shows new notifications live
    if (panelOpen.get() && n.urgency !== Notifd.Urgency.CRITICAL) return

    // For keys by id and never re-renders an existing key, so a replaced
    // notification (same id, new content) must be removed first
    if (replaced) remove(id)
    setPopups((list) => [n, ...list.filter((x) => x.id !== id)].slice(0, 5))

    // critical notifications stay until dismissed; others expire on their
    // own timeout (or the default) but remain in notifd's history
    if (n.urgency !== Notifd.Urgency.CRITICAL) {
      const timeout = n.expireTimeout > 0 ? n.expireTimeout : DEFAULT_TIMEOUT_MS
      setTimeout(() => remove(id), timeout)
    }
  })

  notifd.connect("resolved", (_, id: number) => remove(id))

  const { TOP, RIGHT } = Astal.WindowAnchor

  return (
    <window
      name="notifications"
      class="NotificationPopups"
      visible={popups.as((l) => l.length > 0)}
      layer={Astal.Layer.OVERLAY}
      exclusivity={Astal.Exclusivity.NORMAL}
      anchor={TOP | RIGHT}
      application={app}
    >
      <box orientation={Gtk.Orientation.VERTICAL} spacing={8}>
        <For each={popups} id={(n) => n.id}>
          {(n) => <NotificationCard n={n} />}
        </For>
      </box>
    </window>
  )
}
