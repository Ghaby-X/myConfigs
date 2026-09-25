import { createState } from "ags"
import { readJSON, writeJSON } from "./store"

// Quick-capture log: short notes with a timestamp, newest first. Not a
// freeform document editor — for that, just use a text editor.
export type Note = { id: number; text: string; at: number } // at = unix seconds

const initial = readJSON<Note[]>("notes", [])
export const [notes, setNotes] = createState<Note[]>(initial)
let nextId = 1 + initial.reduce((m, n) => Math.max(m, n.id), 0)

function persist(list: Note[]) {
  setNotes(list)
  writeJSON("notes", list)
}

export function addNote(text: string) {
  const t = text.trim()
  if (!t) return
  persist([{ id: nextId++, text: t, at: Math.floor(Date.now() / 1000) }, ...notes.get()])
}

export function removeNote(id: number) {
  persist(notes.get().filter((n) => n.id !== id))
}
