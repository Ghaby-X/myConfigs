import app from "ags/gtk4/app"
import { Astal, Gtk } from "ags/gtk4"
import GLib from "gi://GLib"
import { For, Accessor, createState, createComputed } from "ags"
import { timeout } from "ags/time"
import { productivityOpen, setProductivityOpen } from "../state"
import { focusFirst, popupKeys } from "../nav"
import CircularTimer from "./CircularTimer"
import {
  phase,
  running,
  remaining,
  completedToday,
  fraction as pomFraction,
  pauseResume,
  skip as skipPomodoro,
  reset as resetPomodoro,
} from "../pomodoro"
import {
  reminderRemaining,
  reminderLabel,
  reminderFraction,
  startReminder,
  cancelReminder,
  stopwatchElapsed,
  stopwatchRunning,
  toggleStopwatch,
  resetStopwatch,
} from "../timers"
import { todos, addTodo, toggleTodo, removeTodo, clearCompletedTodos, type Todo } from "../todo"
import { routineItems, streak, addRoutineItem, toggleRoutineItem, removeRoutineItem, type RoutineItem } from "../routine"
import { readNotes, writeNotes } from "../notes"

/** "125" -> "2:05", "5400" -> "1:30:00" */
function fmt(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const mm = String(m).padStart(2, "0")
  const ss = String(s % 60).padStart(2, "0")
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

// ─── Timers: pomodoro / stopwatch / reminder, one card, tab-switched ───────

type TimerTab = "pomodoro" | "stopwatch" | "reminder"

function TimersNav({ tab, setTab }: { tab: Accessor<TimerTab>; setTab: (t: TimerTab) => void }) {
  let a: Gtk.ToggleButton
  return (
    <box class="tab-nav" spacing={2}>
      <togglebutton
        hexpand
        active={tab.as((t) => t === "pomodoro")}
        $={(self) => (a = self)}
        onToggled={(self: Gtk.ToggleButton) => self.get_active() && setTab("pomodoro")}
      >
        <label label="Pomodoro" />
      </togglebutton>
      <togglebutton
        hexpand
        active={tab.as((t) => t === "stopwatch")}
        $={(self) => self.set_group(a)}
        onToggled={(self: Gtk.ToggleButton) => self.get_active() && setTab("stopwatch")}
      >
        <label label="Stopwatch" />
      </togglebutton>
      <togglebutton
        hexpand
        active={tab.as((t) => t === "reminder")}
        $={(self) => self.set_group(a)}
        onToggled={(self: Gtk.ToggleButton) => self.get_active() && setTab("reminder")}
      >
        <label label="Reminder" />
      </togglebutton>
    </box>
  )
}

function PomodoroTab() {
  const phaseLabel = createComputed([phase], (p) =>
    p === "idle" ? "Ready to focus" : p === "work" ? "Focus" : p === "longBreak" ? "Long break" : "Break",
  )
  const buttonLabel = createComputed([running, phase], (r, p) => (r ? "Pause" : p === "idle" ? "Start" : "Resume"))
  const buttonIcon = running.as((r) => (r ? "media-playback-pause-symbolic" : "media-playback-start-symbolic"))

  return (
    <box name="pomodoro" $type="named" orientation={Gtk.Orientation.VERTICAL} spacing={10} halign={Gtk.Align.CENTER}>
      <CircularTimer fraction={pomFraction} text={remaining.as(fmt)} sub={phaseLabel} />
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
      <label class="tab-meta" label={completedToday.as((n) => `${n} today`)} />
    </box>
  )
}

function StopwatchTab() {
  const swFraction = createComputed([stopwatchElapsed], (e) => (e % 60) / 60)
  const icon = stopwatchRunning.as((r) => (r ? "media-playback-pause-symbolic" : "media-playback-start-symbolic"))
  const meta = stopwatchRunning.as((r) => (r ? "Running" : "Paused"))

  return (
    <box name="stopwatch" $type="named" orientation={Gtk.Orientation.VERTICAL} spacing={10} halign={Gtk.Align.CENTER}>
      <CircularTimer fraction={swFraction} text={stopwatchElapsed.as(fmt)} sub={undefined} />
      <box spacing={6}>
        <button hexpand onClicked={toggleStopwatch}>
          <box spacing={4} halign={Gtk.Align.CENTER}>
            <image iconName={icon} />
            <label label={stopwatchRunning.as((r) => (r ? "Pause" : "Start"))} />
          </box>
        </button>
        <button onClicked={resetStopwatch} tooltipText="Reset">
          <image iconName="edit-clear-symbolic" />
        </button>
      </box>
      <label class="tab-meta" label={meta} />
    </box>
  )
}

function ReminderTab() {
  const active = reminderRemaining.as((r) => r > 0)
  const idle = reminderRemaining.as((r) => r <= 0)

  return (
    <box name="reminder" $type="named" orientation={Gtk.Orientation.VERTICAL} spacing={10} halign={Gtk.Align.CENTER}>
      <box visible={active} orientation={Gtk.Orientation.VERTICAL} spacing={10} halign={Gtk.Align.CENTER}>
        <CircularTimer fraction={reminderFraction} text={reminderRemaining.as(fmt)} sub={reminderLabel.as((l) => l || "Reminder")} />
        <button onClicked={cancelReminder} tooltipText="Cancel">
          <box spacing={4} halign={Gtk.Align.CENTER}>
            <image iconName="edit-clear-symbolic" />
            <label label="Cancel" />
          </box>
        </button>
      </box>
      <box visible={idle} orientation={Gtk.Orientation.VERTICAL} spacing={8} widthRequest={200}>
        <box spacing={6}>
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
          onActivate={(self) => {
            const n = Number(self.get_text())
            if (n > 0) startReminder(n, "")
            self.set_text("")
          }}
        />
      </box>
    </box>
  )
}

function TimersCard() {
  const [tab, setTab] = createState<TimerTab>("pomodoro")
  return (
    <box class="notif-item timers-card" orientation={Gtk.Orientation.VERTICAL} spacing={10}>
      <TimersNav tab={tab} setTab={setTab} />
      <stack
        transitionType={Gtk.StackTransitionType.CROSSFADE}
        transitionDuration={150}
        // set after construction, not as a prop: Gtk.Stack needs its named
        // children added first, or it (harmlessly) warns about a missing name
        $={(self: Gtk.Stack) => {
          self.set_visible_child_name(tab.get())
          tab.subscribe(() => self.set_visible_child_name(tab.get()))
        }}
      >
        <PomodoroTab />
        <StopwatchTab />
        <ReminderTab />
      </stack>
    </box>
  )
}

// ─── Tasks: todo / routine, one card, tab-switched ─────────────────────────

type TaskTab = "todo" | "routine" | "notes"

function TasksNav({ tab, setTab }: { tab: Accessor<TaskTab>; setTab: (t: TaskTab) => void }) {
  let a: Gtk.ToggleButton
  return (
    <box class="tab-nav" spacing={2}>
      <togglebutton
        hexpand
        active={tab.as((t) => t === "todo")}
        $={(self) => (a = self)}
        onToggled={(self: Gtk.ToggleButton) => self.get_active() && setTab("todo")}
      >
        <label label="Todo" />
      </togglebutton>
      <togglebutton
        hexpand
        active={tab.as((t) => t === "routine")}
        $={(self) => self.set_group(a)}
        onToggled={(self: Gtk.ToggleButton) => self.get_active() && setTab("routine")}
      >
        <label label="Routine" />
      </togglebutton>
      <togglebutton
        hexpand
        active={tab.as((t) => t === "notes")}
        $={(self) => self.set_group(a)}
        onToggled={(self: Gtk.ToggleButton) => self.get_active() && setTab("notes")}
      >
        <label label="Notes" />
      </togglebutton>
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

function TodoTab() {
  const doneCount = createComputed([todos], (list) => list.filter((t) => t.done).length)
  const empty = todos.as((l) => l.length === 0)
  return (
    <box name="todo" $type="named" orientation={Gtk.Orientation.VERTICAL} spacing={6}>
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

function RoutineTab() {
  const empty = routineItems.as((l) => l.length === 0)
  return (
    <box name="routine" $type="named" orientation={Gtk.Orientation.VERTICAL} spacing={6}>
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

// A real scratchpad, not a one-line entry — folded into the Todo/Routine nav
// as a third tab rather than its own separate card.
function NotesTab() {
  let saveTimer: ReturnType<typeof timeout> | null = null

  return (
    <box name="notes" $type="named" orientation={Gtk.Orientation.VERTICAL}>
      <Gtk.ScrolledWindow heightRequest={260} hscrollbarPolicy={Gtk.PolicyType.NEVER} overlayScrolling={false}>
        <Gtk.TextView
          class="notes-view"
          wrapMode={Gtk.WrapMode.WORD_CHAR}
          topMargin={8}
          bottomMargin={8}
          leftMargin={8}
          rightMargin={8}
          $={(self: Gtk.TextView) => {
            const buffer = self.get_buffer()
            buffer.set_text(readNotes(), -1)
            buffer.connect("changed", () => {
              saveTimer?.cancel()
              saveTimer = timeout(500, () => {
                writeNotes(buffer.get_text(buffer.get_start_iter(), buffer.get_end_iter(), false))
              })
            })
          }}
        />
      </Gtk.ScrolledWindow>
    </box>
  )
}

function TasksCard() {
  const [tab, setTab] = createState<TaskTab>("todo")
  return (
    <box class="notif-item tasks-card" orientation={Gtk.Orientation.VERTICAL} spacing={6}>
      <TasksNav tab={tab} setTab={setTab} />
      <stack
        transitionType={Gtk.StackTransitionType.CROSSFADE}
        transitionDuration={150}
        // set after construction, not as a prop: Gtk.Stack needs its named
        // children added first, or it (harmlessly) warns about a missing name
        $={(self: Gtk.Stack) => {
          self.set_visible_child_name(tab.get())
          tab.subscribe(() => self.set_visible_child_name(tab.get()))
        }}
      >
        <TodoTab />
        <RoutineTab />
        <NotesTab />
      </stack>
    </box>
  )
}

// ─── Panel ──────────────────────────────────────────────────────────────

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
            <TasksCard />
            <TimersCard />
          </box>
        </Gtk.ScrolledWindow>
      </box>
    </window>
  )
}
