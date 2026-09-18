import { createPoll } from "ags/time"

export default function Clock() {
  // Forced via `sh -c` so LC_TIME=C applies regardless of the system locale
  // (this system has LC_TIME=rw_RW while everything else is en_US.UTF-8).
  // No seconds, so no need to poll every second either.
  const time = createPoll("", 15000, ["sh", "-c", "LC_TIME=C date '+%a %d %b  %H:%M'"])

  return <label cssName="clock" label={time} />
}
