import { createState } from "ags"
import { interval } from "ags/time"
import { readJSON, writeJSON, todayStr, notify } from "./store"

// Standard pomodoro cadence: 25 min work / 5 min break, a 15 min long break
// every 4th session. Breaks auto-start (no reason to make you click twice);
// work does not auto-start after a break, so you decide when you're back.
const WORK_SEC = 25 * 60
const BREAK_SEC = 5 * 60
const LONG_BREAK_SEC = 15 * 60
const SESSIONS_UNTIL_LONG = 4

type Phase = "idle" | "work" | "break" | "longBreak"
type Stored = { date: string; completed: number }

const stored = readJSON<Stored>("pomodoro", { date: todayStr(), completed: 0 })
let currentDate = stored.date

export const [completedToday, setCompletedToday] = createState(
  stored.date === todayStr() ? stored.completed : 0,
)
export const [phase, setPhase] = createState<Phase>("idle")
export const [running, setRunning] = createState(false)
export const [remaining, setRemaining] = createState(0) // seconds left in the current phase
export const [sessionCount, setSessionCount] = createState(0) // work sessions this run, for long-break cadence

function persistCompleted(n: number) {
  setCompletedToday(n)
  writeJSON("pomodoro", { date: currentDate, completed: n })
}

export function startWork() {
  setPhase("work")
  setRemaining(WORK_SEC)
  setRunning(true)
}

export function pauseResume() {
  if (phase.get() === "idle") startWork()
  else setRunning(!running.get())
}

export function reset() {
  setPhase("idle")
  setRunning(false)
  setRemaining(0)
}

export function skip() {
  if (phase.get() !== "idle") advance(false)
}

/** Move to the next phase. `natural`: the timer actually ran out (vs. a manual skip). */
function advance(natural: boolean) {
  if (phase.get() === "work") {
    if (natural) persistCompleted(completedToday.get() + 1)
    const n = sessionCount.get() + 1
    setSessionCount(n)
    const long = n % SESSIONS_UNTIL_LONG === 0
    setPhase(long ? "longBreak" : "break")
    setRemaining(long ? LONG_BREAK_SEC : BREAK_SEC)
    setRunning(true)
    if (natural) notify("Pomodoro done", long ? "Long break time" : "Short break time")
  } else {
    setPhase("idle")
    setRunning(false)
    setRemaining(0)
    if (natural) notify("Break's over", "Ready to focus again?")
  }
}

interval(1000, () => {
  if (!running.get()) return
  const r = remaining.get() - 1
  if (r > 0) setRemaining(r)
  else advance(true)
})

// daily counter's date can roll over without an AGS restart
interval(60_000, () => {
  if (currentDate === todayStr()) return
  currentDate = todayStr()
  persistCompleted(0)
})
