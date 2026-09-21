import { createState } from "ags"
import { execAsync } from "ags/process"
import { interval } from "ags/time"

// True while a screen recording is running (started by ~/.config/rice/screenrecord,
// i.e. wf-recorder). Polls the process list, so it also follows recordings started
// or stopped from a shell.
export const [recording, setRecording] = createState(false)

const check = () =>
  execAsync(["pgrep", "-x", "wf-recorder"])
    .then(() => setRecording(true))
    .catch(() => setRecording(false)) // pgrep exits 1 when nothing matches

check()
interval(2000, check)

// the screenrecord script is a toggle: while recording, running it stops the recording
export function stopRecording() {
  execAsync(["sh", "-c", "~/.config/rice/screenrecord"]).catch(() => {})
  setRecording(false)
}
