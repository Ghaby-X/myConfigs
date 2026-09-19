import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import Mpris from "gi://AstalMpris"
import Pango from "gi://Pango"
import GLib from "gi://GLib"
import { With, createBinding, createComputed, createState } from "ags"
import { createPoll } from "ags/time"
import { calendarOpen, setCalendarOpen } from "../state"
import { focusFirst, popupKeys } from "../nav"

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

type View = { year: number; month: number }
const nowView = (): View => ({ year: new Date().getFullYear(), month: new Date().getMonth() })

// 6 weeks (42 cells), Monday first, padded with the neighbouring months.
function monthCells({ year, month }: View) {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7
  const today = new Date()
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(year, month, 1 - offset + i)
    return {
      day: d.getDate(),
      outside: d.getMonth() !== month,
      today: d.toDateString() === today.toDateString(),
      weekend: d.getDay() === 0 || d.getDay() === 6,
    }
  })
}

// module-level so the popup's key handler can drive the month too
const [view, setView] = createState<View>(nowView())

// always open on the current month
calendarOpen.subscribe(() => {
  if (calendarOpen.get()) setView(nowView())
})

const shift = (delta: number) =>
  setView((v) => {
    const d = new Date(v.year, v.month + delta, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

function Calendar() {
  const cells = view.as(monthCells)

  const now = new Date()

  return (
    <box class="calendar" orientation={Gtk.Orientation.VERTICAL} spacing={10}>
      <box class="cal-today" orientation={Gtk.Orientation.VERTICAL}>
        <label class="cal-today-day" label={DAYS[now.getDay()]} xalign={0} />
        <label class="cal-today-date" label={`${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`} xalign={0} />
      </box>
      <box class="cal-header" spacing={4}>
        <button class="cal-nav" onClicked={() => setView(nowView())} hexpand halign={Gtk.Align.START}>
          <label label={view.as((v) => `${MONTHS[v.month]} ${v.year}`)} />
        </button>
        <button class="cal-nav icon" onClicked={() => shift(-1)}>
          <image iconName="go-previous-symbolic" />
        </button>
        <button class="cal-nav icon" onClicked={() => shift(1)}>
          <image iconName="go-next-symbolic" />
        </button>
      </box>
      <box class="cal-weekdays" homogeneous>
        {WEEKDAYS.map((w) => (
          <label label={w} />
        ))}
      </box>
      {/* 42 persistent labels: a month change only updates text/classes
          instead of rebuilding the grid, which is what made spamming the
          arrows lag on this software-rendered VM. */}
      <box class="cal-grid" orientation={Gtk.Orientation.VERTICAL} spacing={2}>
        {Array.from({ length: 6 }, (_, row) => (
          <box homogeneous spacing={2}>
            {Array.from({ length: 7 }, (_, col) => {
              const cell = cells.as((c) => c[row * 7 + col])
              return (
                <label
                  class={cell.as((c) => `cal-day${c.outside ? " outside" : ""}${c.today ? " today" : ""}${c.weekend ? " weekend" : ""}`)}
                  label={cell.as((c) => String(c.day))}
                />
              )
            })}
          </box>
        ))}
      </box>
    </box>
  )
}

const fmt = (s: number) => {
  s = Math.max(0, Math.floor(s))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

function PlayerView({ player }: { player: Mpris.Player }) {
  const title = createBinding(player, "title")
  const artist = createBinding(player, "artist")
  const cover = createBinding(player, "coverArt")
  const status = createBinding(player, "playbackStatus")
  const length = createBinding(player, "length")
  const position = createPoll(player.position, 1000, () => player.position)
  const playing = status.as((s) => s === Mpris.PlaybackStatus.PLAYING)

  return (
    <box class="media-panel" orientation={Gtk.Orientation.VERTICAL} spacing={10}>
      <box class="cover" halign={Gtk.Align.CENTER} overflow={Gtk.Overflow.HIDDEN}>
        <With value={cover}>
          {(c) => (c ? <image file={c} pixelSize={168} /> : <image iconName="audio-x-generic-symbolic" pixelSize={96} />)}
        </With>
      </box>
      <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
        <label class="media-title" label={title.as((t) => t || "Unknown")} xalign={0} maxWidthChars={22} ellipsize={Pango.EllipsizeMode.END} />
        <label class="media-artist" label={artist.as((a) => a || "")} xalign={0} maxWidthChars={26} ellipsize={Pango.EllipsizeMode.END} />
      </box>
      <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
        <Gtk.ProgressBar
          class="media-progress"
          fraction={createComputed(() => (length() > 0 ? Math.min(1, position() / length()) : 0))}
        />
        <box class="media-times">
          <label label={position.as(fmt)} hexpand xalign={0} />
          <label label={length.as(fmt)} />
        </box>
      </box>
      <box class="media-controls" halign={Gtk.Align.CENTER} spacing={6}>
        <button onClicked={() => player.previous()}>
          <image iconName="media-skip-backward-symbolic" />
        </button>
        <button class="play" onClicked={() => player.play_pause()}>
          <image iconName={playing.as((p) => (p ? "media-playback-pause-symbolic" : "media-playback-start-symbolic"))} />
        </button>
        <button onClicked={() => player.next()}>
          <image iconName="media-skip-forward-symbolic" />
        </button>
      </box>
    </box>
  )
}

function Media() {
  const mpris = Mpris.get_default()
  const players = createBinding(mpris, "players")

  return (
    <box class="media-side" orientation={Gtk.Orientation.VERTICAL}>
      <With value={players.as((p) => p[0] ?? null)}>
        {(player) =>
          player ? (
            <PlayerView player={player} />
          ) : (
            <box class="media-empty" orientation={Gtk.Orientation.VERTICAL} spacing={8} valign={Gtk.Align.CENTER} vexpand>
              <image iconName="audio-x-generic-symbolic" pixelSize={48} />
              <label label="Nothing playing" />
            </box>
          )
        }
      </With>
    </box>
  )
}

export default function CalendarPopup() {
  const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor
  const close = () => setCalendarOpen(false)
  let win: Astal.Window
  let card: Gtk.Widget

  // take keyboard focus as soon as the popup opens
  calendarOpen.subscribe(() => {
    if (calendarOpen.get()) {
      GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
        if (win) focusFirst(win)
        return GLib.SOURCE_REMOVE
      })
    }
  })

  // H / L (shift) or PageUp / PageDown change month from anywhere; t = today
  const monthKeys = (keyval: number, shiftHeld: boolean) => {
    if ((shiftHeld && keyval === Gdk.KEY_H) || keyval === Gdk.KEY_Page_Up) return shift(-1), true
    if ((shiftHeld && keyval === Gdk.KEY_L) || keyval === Gdk.KEY_Page_Down) return shift(1), true
    if (keyval === Gdk.KEY_t) return setView(nowView()), true
    return false
  }

  // Full-screen (below the bar) transparent window: a click closes the popup
  // only if it landed outside the card. (Claiming the sequence on the card
  // instead would deny the buttons inside it their clicks.)
  return (
    <window
      name="calendar"
      class="CalendarPopup"
      visible={calendarOpen}
      layer={Astal.Layer.TOP}
      exclusivity={Astal.Exclusivity.NORMAL}
      keymode={calendarOpen.as((o) => (o ? Astal.Keymode.EXCLUSIVE : Astal.Keymode.NONE))}
      anchor={TOP | BOTTOM | LEFT | RIGHT}
      application={app}
      $={(self) => (win = self)}
    >
      <Gtk.EventControllerKey
        propagationPhase={Gtk.PropagationPhase.CAPTURE}
        onKeyPressed={popupKeys(() => win, { close, extra: monthKeys })}
      />
      <Gtk.GestureClick
        onPressed={(_, __, x, y) => {
          const hit = win.pick(x, y, Gtk.PickFlags.DEFAULT)
          if (!hit || (hit !== card && !hit.is_ancestor(card))) close()
        }}
      />
      <box halign={Gtk.Align.CENTER} valign={Gtk.Align.START}>
        <box class="calendar-card" spacing={16} $={(self) => (card = self)}>
          <Calendar />
          <box cssName="divider" class="card-divider" />
          <Media />
        </box>
      </box>
    </window>
  )
}
