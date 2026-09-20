import GLib from "gi://GLib"
import { createState } from "ags"
import { interval } from "ags/time"

// "Keep awake": while ~/.local/state/rice/keep-awake exists, the idle timers
// (theme/.config/rice/idle, called by swayidle) skip auto-lock and screen-off.
// Suspending still locks.
const DIR = `${GLib.get_user_state_dir()}/rice`
const FLAG = `${DIR}/keep-awake`
const exists = () => GLib.file_test(FLAG, GLib.FileTest.EXISTS)

export const [keepAwake, setKeepAwake] = createState(exists())
interval(3000, () => setKeepAwake(exists())) // also follows changes made from a shell

export function toggleKeepAwake() {
  if (exists()) GLib.unlink(FLAG)
  else {
    GLib.mkdir_with_parents(DIR, 0o755)
    GLib.file_set_contents(FLAG, "")
  }
  setKeepAwake(exists())
}
