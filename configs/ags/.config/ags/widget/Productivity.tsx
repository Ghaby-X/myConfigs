import app from "ags/gtk4/app"
import { Astal, Gtk } from "ags/gtk4"
import GLib from "gi://GLib"
import { For, createComputed } from "ags"
import { productivityOpen, setProductivityOpen } from "../state"
import { focusFirst, popupKeys } from "../nav"
import { timeLabel } from "./NotificationPopups"
import {
  phase,
  running,
  remaining,
  completedToday,
  pauseResume,
  skip as skipPomodoro,
  reset as resetPomodoro,
} from "../pomodoro"
import {
  reminderRemaining,
  reminderLabel,
  startReminder,
  cancelReminder,
  stopwatchElapsed,
  stopwatchRunning,
  toggleStopwatch,
  resetStopwatch,
} from "../timers"
import { todos, addTodo, toggleTodo, removeTodo, clearCompletedTodos, type Todo } from "../todo"
import { routineItems, streak, addRoutineItem, toggleRoutineItem, removeRoutineItem, type RoutineItem } from "../routine"
import { notes, addNote, removeNote, type Note } from "../notes"

/** "125" -> "2:05", "5400" -> "1:30:00" */
function fmt(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const mm = String(m).padStart(2, "0")
  const ss = String(s % 60).padStart(2, "0")
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

function PomodoroSection() {
  const phaseLabel = createComputed([phase], (p) =>
    p === "idle" ? "Ready to focus" : p === "work" ? "Focus" : p === "longBreak" ? "Long break" : "Break",
  )
  const buttonLabel = createComputed([running, phase], (r, p) => (r ? "Pause" : p === "idle" ? "Start" : "Resume"))
  const buttonIcon = running.as((r) => (r ? "media-playback-pause-symbolic" : "media-playback-start-symbolic"))

  return (
    <box class="notif-item" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
      <box class="section-header">
        <label class="section-title" label="Pomodoro" xalign={0} hexpand />
        <label label={completedToday.as((n) => `${n} today`)} />
      </box>
      <box spacing={10} valign={Gtk.Align.CENTER}>
        <label class="timer-display" label={remaining.as(fmt)} hexpand xalign={0} />
        <label label={phaseLabel} />
      </box>
      <box spacing={6}>
        <button hexpand onClicked={pauseResume}>
          <box spacing={4} halign={Gtk.Align.CENTER}>
            <image iconName={buttonIcon} />
            <label label={buttonLabel} />
          </box>
        </button>
        <button onClicked={skipPomodoro} tooltipText="Skip to the next phase">
          <image iconName="media-skip-forward-symbolic" />
        </button>
        <button onClicked={resetPomodoro} tooltipText="Reset">
          <image iconName="edit-clear-symbolic" />
        </button>
      </box>
    </box>
  )
}

function TodoRow({ t }: { t: Todo }) {
  return (
    <box class="notif-item" spacing={8} valign={Gtk.Align.CENTER}>
      <button onClicked={() => toggleTodo(t.id)}>
        <image iconName={t.done ? "checkbox-checked-symbolic" : "checkbox-symbolic"} />
      </button>
      <label class={t.done ? "task-text done" : "task-text"} label={t.text} hexpand xalign={0} wrap />
      <button class="notif-close" onClicked={() => removeTodo(t.id)}>
        <image iconName="window-close-symbolic" />
      </button>
    </box>
  )
}

function TodoSection() {
  const doneCount = createComputed([todos], (list) => list.filter((t) => t.done).length)
  const empty = todos.as((l) => l.length === 0)
  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={8}>
      <box class="section-header">
        <label class="section-title" label="Todo" xalign={0} hexpand />
        <button class="clear" visible={doneCount.as((n) => n > 0)} onClicked={clearCompletedTodos}>
          <label label="Clear done" />
        </button>
      </box>
      <entry
        placeholderText="Add a task, Enter to save"
        onActivate={(self) => {
          addTodo(self.get_text())
          self.set_text("")
        }}
      />
      <box orientation={Gtk.Orientation.VERTICAL} spacing={4}>
        <For each={todos} id={(t) => `${t.id}:${t.done ? 1 : 0}:${t.text}`}>{(t) => <TodoRow t={t} />}</For>
        <label class="empty-hint" label="Nothing on your list" visible={empty} />
      </box>
    </box>
  )
}

function RoutineRow({ i }: { i: RoutineItem }) {
  return (
    <box class="notif-item" spacing={8} valign={Gtk.Align.CENTER}>
      <button onClicked={() => toggleRoutineItem(i.id)}>
        <image iconName={i.done ? "checkbox-checked-symbolic" : "checkbox-symbolic"} />
      </button>
      <label class={i.done ? "task-text done" : "task-text"} label={i.text} hexpand xalign={0} wrap />
      <button class="notif-close" onClicked={() => removeRoutineItem(i.id)}>
        <image iconName="window-close-symbolic" />
      </button>
    </box>
  )
}

function RoutineSection() {
  const empty = routineItems.as((l) => l.length === 0)
  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={8}>
      <box class="section-header">
        <label class="section-title" label="Routine" xalign={0} hexpand />
        <label label={streak.as((n) => (n > 0 ? `🔥 ${n}d streak` : "resets daily"))} />
      </box>
      <entry
        placeholderText="Add a routine item, Enter to save"
        onActivate={(self) => {
          addRoutineItem(self.get_text())
          self.set_text("")
        }}
      />
      <box orientation={Gtk.Orientation.VERTICAL} spacing={4}>
        <For each={routineItems} id={(i) => `${i.id}:${i.done ? 1 : 0}:${i.text}`}>{(i) => <RoutineRow i={i} />}</For>
        <label class="empty-hint" label="No routine items yet" visible={empty} />
      </box>
    </box>
  )
}

function ReminderBlock() {
  const active = reminderRemaining.as((r) => r > 0)
  const idle = reminderRemaining.as((r) => r <= 0)
  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
      <label class="section-title" label="Reminder" xalign={0} />
      <box spacing={8} valign={Gtk.Align.CENTER} visible={active}>
        <label class="timer-display" label={reminderRemaining.as(fmt)} hexpand xalign={0} />
        <label label={reminderLabel} visible={reminderLabel.as((l) => !!l)} />
        <button onClicked={cancelReminder} tooltipText="Cancel">
          <image iconName="edit-clear-symbolic" />
        </button>
      </box>
      <box spacing={6} visible={idle}>
        <button hexpand onClicked={() => startReminder(5, "")}>
          <label label="5m" />
        </button>
        <button hexpand onClicked={() => startReminder(10, "")}>
          <label label="10m" />
        </button>
        <button hexpand onClicked={() => startReminder(15, "")}>
          <label label="15m" />
        </button>
        <button hexpand onClicked={() => startReminder(25, "")}>
          <label label="25m" />
        </button>
      </box>
      <entry
        placeholderText="or custom minutes"
        visible={idle}
        onActivate={(self) => {
          const n = Number(self.get_text())
          if (n > 0) startReminder(n, "")
          self.set_text("")
        }}
      />
    </box>
  )
}

function StopwatchBlock() {
  const icon = stopwatchRunning.as((r) => (r ? "media-playback-pause-symbolic" : "media-playback-start-symbolic"))
  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
      <label class="section-title" label="Stopwatch" xalign={0} />
      <box spacing={10} valign={Gtk.Align.CENTER}>
        <label class="timer-display" label={stopwatchElapsed.as(fmt)} hexpand xalign={0} />
        <button onClicked={toggleStopwatch}>
          <image iconName={icon} />
        </button>
        <button onClicked={resetStopwatch} tooltipText="Reset">
          <image iconName="edit-clear-symbolic" />
        </button>
      </box>
    </box>
  )
}

function TimersSection() {
  return (
    <box class="notif-item" orientation={Gtk.Orientation.VERTICAL} spacing={14}>
      <ReminderBlock />
      <StopwatchBlock />
    </box>
  )
}

function NoteRow({ n }: { n: Note }) {
  return (
    <box class="notif-item" spacing={8} valign={Gtk.Align.CENTER}>
      <label class="notif-time" label={timeLabel(n.at)} />
      <label label={n.text} hexpand xalign={0} wrap />
      <button class="notif-close" onClicked={() => removeNote(n.id)}>
        <image iconName="window-close-symbolic" />
      </button>
    </box>
  )
}

function NotesSection() {
  const empty = notes.as((l) => l.length === 0)
  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={8}>
      <box class="section-header">
        <label class="section-title" label="Notes" xalign={0} hexpand />
      </box>
      <entry
        placeholderText="Jot something down, Enter to save"
        onActivate={(self) => {
          addNote(self.get_text())
          self.set_text("")
        }}
      />
      <box orientation={Gtk.Orientation.VERTICAL} spacing={4}>
        <For each={notes} id={(n) => `${n.id}`}>{(n) => <NoteRow n={n} />}</For>
        <label class="empty-hint" label="No notes yet" visible={empty} />
      </box>
    </box>
  )
}

export default function Productivity() {
  const { TOP, BOTTOM, LEFT } = Astal.WindowAnchor
  let win: Astal.Window

  productivityOpen.subscribe(() => {
    if (productivityOpen.get()) {
      GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
        if (win) focusFirst(win)
        return GLib.SOURCE_REMOVE
      })
    }
  })

  const close = () => setProductivityOpen(false)

  return (
    <window
      name="productivity"
      class="ProductivityPanel"
      visible={productivityOpen}
      layer={Astal.Layer.TOP}
      exclusivity={Astal.Exclusivity.NORMAL}
      keymode={productivityOpen.as((o) => (o ? Astal.Keymode.EXCLUSIVE : Astal.Keymode.NONE))}
      anchor={TOP | BOTTOM | LEFT}
      application={app}
      $={(self) => (win = self)}
    >
      {/* BUBBLE, not the usual CAPTURE: this panel has text entries, and they need
          first crack at their own keys (typing, Enter-to-submit) before
          h/j/k/l/Enter/Escape/x get treated as panel navigation. */}
      <Gtk.EventControllerKey propagationPhase={Gtk.PropagationPhase.BUBBLE} onKeyPressed={popupKeys(() => win, { close })} />
      <box class="panel-card productivity-card" orientation={Gtk.Orientation.VERTICAL} spacing={14} widthRequest={370}>
        <box class="panel-header" spacing={4}>
          <label class="panel-title" label="Productivity" xalign={0} hexpand />
        </box>
        <Gtk.ScrolledWindow vexpand focusable={false} hscrollbarPolicy={Gtk.PolicyType.NEVER} overlayScrolling={false}>
          <box orientation={Gtk.Orientation.VERTICAL} spacing={14}>
            <PomodoroSection />
            <TodoSection />
            <RoutineSection />
            <TimersSection />
            <NotesSection />
          </box>
        </Gtk.ScrolledWindow>
      </box>
    </window>
  )
}
