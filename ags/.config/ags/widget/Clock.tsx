import { Gtk } from "ags/gtk4"
import { createPoll } from "ags/time"

export default function Clock() {
  // Forced via `sh -c` so LC_TIME=C applies regardless of the system locale
  // (this system has LC_TIME=rw_RW while everything else is en_US.UTF-8).
  // No seconds, so no need to poll every second either.
  const time = createPoll("", 15000, ["sh", "-c", "LC_TIME=C date '+%H:%M'"])

  return (
    <menubutton cssName="clock">
      <label label={time} />
      <popover>
        <Gtk.Calendar />
      </popover>
    </menubutton>
  )
}
