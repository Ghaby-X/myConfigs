import { createState } from "ags"
import { interval } from "ags/time"
import { notify } from "./store"

// Reminder: one-shot countdown, optionally labelled, notifies when it hits 0.
// Stopwatch: plain count-up. Both ephemeral (not persisted) — if AGS restarts
// mid-timer it's lost, same as any other in-progress state in the bar.

export const [reminderRemaining, setReminderRemaining] = createState(0) // seconds; 0 = not running
export const [reminderLabel, setReminderLabel] = createState("")

export function startReminder(minutes: number, label: string) {
  if (!(minutes > 0)) return
  setReminderLabel(label.trim())
  setReminderRemaining(Math.round(minutes * 60))
}

export function cancelReminder() {
  setReminderRemaining(0)
  setReminderLabel("")
}

interval(1000, () => {
  const r = reminderRemaining.get()
  if (r <= 0) return
  if (r === 1) {
    setReminderRemaining(0)
    notify("Reminder", reminderLabel.get() || "Time's up")
    setReminderLabel("")
  } else {
    setReminderRemaining(r - 1)
  }
})

export const [stopwatchElapsed, setStopwatchElapsed] = createState(0) // seconds
export const [stopwatchRunning, setStopwatchRunning] = createState(false)

export function toggleStopwatch() {
  setStopwatchRunning(!stopwatchRunning.get())
}

export function resetStopwatch() {
  setStopwatchRunning(false)
  setStopwatchElapsed(0)
}

interval(1000, () => {
  if (stopwatchRunning.get()) setStopwatchElapsed(stopwatchElapsed.get() + 1)
})
