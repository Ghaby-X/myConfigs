import { createState, createComputed } from "ags"
import { interval } from "ags/time"
import { readJSON, writeJSON, todayStr, notify } from "./store"

// Standard pomodoro cadence: 25 min work / 5 min break by default (both
// adjustable, in 5-min steps, while idle), a fixed 15 min long break every
// 4th session. Breaks auto-start (no reason to make you click twice); work
// does not auto-start after a break, so you decide when you're back.
const DEFAULT_WORK_MIN = 25
const DEFAULT_BREAK_MIN = 5
const LONG_BREAK_SEC = 15 * 60
const SESSIONS_UNTIL_LONG = 4
const WORK_RANGE = [5, 90] as const
const BREAK_RANGE = [1, 30] as const
const STEP_MIN = 5

type Phase = "idle" | "work" | "break" | "longBreak"
type Stored = { date: string; completed: number; workMin: number; breakMin: number }

const stored = readJSON<Stored>("pomodoro", {
  date: todayStr(),
  completed: 0,
  workMin: DEFAULT_WORK_MIN,
  breakMin: DEFAULT_BREAK_MIN,
})
let currentDate = stored.date

export const [completedToday, setCompletedToday] = createState(
  stored.date === todayStr() ? stored.completed : 0,
)
export const [workMin, setWorkMinState] = createState(stored.workMin ?? DEFAULT_WORK_MIN)
export const [breakMin, setBreakMinState] = createState(stored.breakMin ?? DEFAULT_BREAK_MIN)
export const [phase, setPhase] = createState<Phase>("idle")
export const [running, setRunning] = createState(false)
export const [remaining, setRemaining] = createState(0) // seconds left in the current phase
export const [sessionCount, setSessionCount] = createState(0) // work sessions this run, for long-break cadence

// how much of the current phase is left, 0..1 — drives the circular timer ring
export const fraction = createComputed([phase, remaining], (p, r) => {
  if (p === "idle") return 0
  const total = p === "work" ? workMin.get() * 60 : p === "longBreak" ? LONG_BREAK_SEC : breakMin.get() * 60
  return r / total
})

function persist() {
  writeJSON("pomodoro", { date: currentDate, completed: completedToday.get(), workMin: workMin.get(), breakMin: breakMin.get() })
}

function persistCompleted(n: number) {
  setCompletedToday(n)
  persist()
}

/** Only takes effect while idle — the steppers are hidden once a session starts. */
export function adjustWorkMin(delta: number) {
  const [min, max] = WORK_RANGE
  setWorkMinState(Math.min(max, Math.max(min, workMin.get() + delta)))
  persist()
}

export function adjustBreakMin(delta: number) {
  const [min, max] = BREAK_RANGE
  setBreakMinState(Math.min(max, Math.max(min, breakMin.get() + delta)))
  persist()
}

export const STEP = STEP_MIN

export function startWork() {
  setPhase("work")
  setRemaining(workMin.get() * 60)
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
    setRemaining(long ? LONG_BREAK_SEC : breakMin.get() * 60)
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
