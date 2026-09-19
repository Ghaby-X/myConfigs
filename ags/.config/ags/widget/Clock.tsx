import { Gtk } from "ags/gtk4"
import { createPoll } from "ags/time"
import { calendarOpen, setCalendarOpen } from "../state"

export default function Clock() {
  // Forced via `sh -c` so LC_TIME=C applies regardless of the system locale
  // (this system has LC_TIME=rw_RW while everything else is en_US.UTF-8).
  const time = createPoll("", 15000, ["sh", "-c", "LC_TIME=C date '+%A  %H:%M'"])

  // A plain box + click gesture (not a button/menubutton — their chrome
  // inflated the bar). Hover and open both get the oval highlight via CSS.
  return (
    <box cssName="clock" class={calendarOpen.as((o) => (o ? "open" : ""))}>
      <Gtk.GestureClick onPressed={() => setCalendarOpen((o) => !o)} />
      <label label={time} />
    </box>
  )
}
