import { createState } from "ags"
import { interval } from "ags/time"
import { readJSON, writeJSON, todayStr } from "./store"

// A fixed checklist that resets every day (as opposed to todo.ts, which is
// open-ended tasks that persist until done). Completing every item before
// the day rolls over extends the streak; missing any of them breaks it.
export type RoutineItem = { id: number; text: string; done: boolean }
type Stored = { date: string; items: RoutineItem[]; streak: number }

const stored = readJSON<Stored>("routine", { date: todayStr(), items: [], streak: 0 })
let currentDate = stored.date

export const [routineItems, setRoutineItems] = createState<RoutineItem[]>(stored.items)
export const [streak, setStreak] = createState(stored.streak)
let nextId = 1 + stored.items.reduce((m, i) => Math.max(m, i.id), 0)

function persist(items: RoutineItem[], streakVal: number) {
  setRoutineItems(items)
  setStreak(streakVal)
  writeJSON("routine", { date: currentDate, items, streak: streakVal })
}

export function addRoutineItem(text: string) {
  const t = text.trim()
  if (!t) return
  persist([...routineItems.get(), { id: nextId++, text: t, done: false }], streak.get())
}

export function toggleRoutineItem(id: number) {
  persist(
    routineItems.get().map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    streak.get(),
  )
}

export function removeRoutineItem(id: number) {
  persist(routineItems.get().filter((i) => i.id !== id), streak.get())
}

// AGS is long-running, so the date can roll over without a restart — check
// on an interval, not just at module load.
function checkRollover() {
  const today = todayStr()
  if (currentDate === today) return
  const items = routineItems.get()
  const completedFully = items.length > 0 && items.every((i) => i.done)
  currentDate = today
  persist(
    items.map((i) => ({ ...i, done: false })),
    completedFully ? streak.get() + 1 : 0,
  )
}

checkRollover()
interval(60_000, checkRollover)
