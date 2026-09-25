import GLib from "gi://GLib"

// Freeform scratchpad — one plain-text file, not a database of entries.
// (An earlier version modeled this as a list of timestamped notes; a single
// text box is what was actually wanted, so it's just a file on disk now.)
const DIR = `${GLib.get_user_state_dir()}/rice/productivity`
GLib.mkdir_with_parents(DIR, 0o755)
const FILE = `${DIR}/notes.txt`

export function readNotes(): string {
  try {
    const [ok, bytes] = GLib.file_get_contents(FILE)
    return ok ? new TextDecoder().decode(bytes) : ""
  } catch {
    return ""
  }
}

export function writeNotes(text: string) {
  GLib.file_set_contents(FILE, text)
}
