import { createPoll } from "ags/time"

export default function Clock() {
  const time = createPoll("", 1000, "date '+%a %d %b  %H:%M:%S'")

  return <label cssName="clock" label={time} />
}
