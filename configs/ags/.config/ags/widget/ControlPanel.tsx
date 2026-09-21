import app from "ags/gtk4/app"
import { Astal, Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"
import Notifd from "gi://AstalNotifd"
import Wp from "gi://AstalWp"
import Network from "gi://AstalNetwork"
import Bluetooth from "gi://AstalBluetooth"
import Battery from "gi://AstalBattery"
import Pango from "gi://Pango"
import GLib from "gi://GLib"
import { Accessor, For, createBinding, createComputed, createState } from "ags"
import { interval } from "ags/time"
import { panelOpen, setPanelOpen } from "../state"
import { focusFirst, navItem, popupKeys } from "../nav"
import { keepAwake, toggleKeepAwake } from "../awake"
import { appIconPaintable, timeLabel } from "./NotificationPopups"

const close = () => setPanelOpen(false)
const run = (cmd: string) => {
  close()
  execAsync(["bash", "-c", cmd]).catch(console.error)
}

// ── quick-toggle tile ────────────────────────────────────────────────────
function Tile(props: {
  icon: Accessor<string>
  title: string
  subtitle: Accessor<string>
  active: Accessor<boolean>
  available?: Accessor<boolean>
  onClicked: () => void
  more?: () => void
}) {
  return (
    <button
      class={props.active.as((a) => (a ? "tile active" : "tile"))}
      sensitive={props.available ?? true}
      hexpand
      onClicked={props.onClicked}
      $={(self) => navItem(self, { more: props.more })}
    >
      <box spacing={10}>
        <image iconName={props.icon} />
        <box orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.CENTER} hexpand>
          <label class="tile-title" label={props.title} xalign={0} />
          <label class="tile-sub" label={props.subtitle} xalign={0} ellipsize={Pango.EllipsizeMode.END} maxWidthChars={12} />
        </box>
      </box>
    </button>
  )
}

// Compact toggle: icon with its name underneath.
function SquareTile(props: {
  icon: Accessor<string>
  title: string | Accessor<string>
  tooltip?: string
  active: Accessor<boolean>
  available?: Accessor<boolean>
  onClicked: () => void
  more?: () => void
}) {
  return (
    <button
      class={props.active.as((a) => (a ? "square active" : "square"))}
      tooltipText={props.tooltip ?? (typeof props.title === "string" ? props.title : "")}
      sensitive={props.available ?? true}
      hexpand
      onClicked={props.onClicked}
      $={(self) => navItem(self, { more: props.more })}
    >
      <box orientation={Gtk.Orientation.VERTICAL} spacing={1} halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER}>
        <image iconName={props.icon} />
        <label class="square-title" label={props.title} />
      </box>
    </button>
  )
}

// Power profile via power-profiles-daemon. Enter toggles performance <-> balanced;
// Shift+Enter toggles power-saver <-> balanced. Machines without a "performance"
// profile (VMs, some laptops) fall back to power-saver on Enter.
function usePowerProfile() {
  const [profile, setProfile] = createState("balanced")
  const [profiles, setProfiles] = createState<string[]>([])
  const refresh = () => {
    execAsync(["powerprofilesctl", "get"]).then((p) => setProfile(p.trim())).catch(() => {})
  }
  execAsync(["powerprofilesctl", "list"])
    .then((out) => setProfiles([...out.matchAll(/^\*?\s*([\w-]+):/gm)].map((m) => m[1])))
    .catch(() => setProfiles([]))
  refresh()
  interval(3000, refresh)

  const set = (target: string) =>
    execAsync(["powerprofilesctl", "set", profile.get() === target ? "balanced" : target])
      .then(refresh)
      .catch(console.error)
  const hasPerf = () => profiles.get().includes("performance")

  return {
    profile,
    available: profiles.as((l) => l.length > 1),
    hasPerf,
    toggle: () => set(hasPerf() ? "performance" : "power-saver"),
    toggleSaver: () => set("power-saver"),
  }
}

// Airplane mode = everything rfkill knows about is soft-blocked. On a machine
// with no radios at all (like this VM) the tile is unavailable.
function useAirplane() {
  const [on, setOn] = createState(false)
  const [available, setAvailable] = createState(false)
  const refresh = () =>
    execAsync(["bash", "-c", "rfkill -n -o SOFT list | sort -u"])
      .then((out) => {
        const states = out.split(/\s+/).filter(Boolean)
        setAvailable(states.length > 0)
        setOn(states.length > 0 && !states.includes("unblocked"))
      })
      .catch(() => setAvailable(false))
  refresh()
  interval(3000, refresh)
  const toggle = () =>
    execAsync(["rfkill", on.get() ? "unblock" : "block", "all"]).then(refresh).catch(console.error)
  return { on, available, toggle }
}

function Toggles() {
  const network = Network.get_default()
  const bt = Bluetooth.get_default()
  const wp = Wp.get_default()
  const notifd = Notifd.get_default()

  // Wi-Fi
  const wifiAvailable = createBinding(network, "wifi").as((w) => !!w)
  const wifiEnabled = createBinding(network, "wifi", "enabled")
  const wifiSsid = createBinding(network, "wifi", "ssid")
  const wifiIcon = createBinding(network, "wifi", "iconName")

  // Bluetooth
  const btAvailable = createBinding(bt, "adapter").as((a) => !!a)
  const btPowered = createBinding(bt, "isPowered")
  const btConnected = createBinding(bt, "isConnected")
  const btDevices = createBinding(bt, "devices")

  const airplane = useAirplane()
  const power = usePowerProfile()

  // DND / mic
  const dnd = createBinding(notifd, "dontDisturb")
  const micMuted = createBinding(wp, "audio", "defaultMicrophone", "mute")
  const speakerMuted = createBinding(wp, "audio", "defaultSpeaker", "mute")
  const speakerVolume = createBinding(wp, "audio", "defaultSpeaker", "volume")
  const speakerIcon = createBinding(wp, "audio", "defaultSpeaker", "volumeIcon")

  return (
    <box class="tiles" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
      <box spacing={8} homogeneous>
        <Tile
          title="Wi-Fi"
          icon={createComputed(() => (wifiEnabled() ? wifiIcon() || "network-wireless-symbolic" : "network-wireless-disabled-symbolic"))}
          subtitle={createComputed(() => {
            if (!wifiAvailable()) return "Unavailable"
            if (!wifiEnabled()) return "Off"
            return wifiSsid() || "Not connected"
          })}
          active={createComputed(() => wifiAvailable() && !!wifiEnabled())}
          available={wifiAvailable}
          onClicked={() => {
            const w = network.wifi
            if (w) w.enabled = !w.enabled
          }}
          more={() => run("kitty -e wifitui")}
        />
        <Tile
          title="Bluetooth"
          icon={btPowered.as((p) => (p ? "bluetooth-active-symbolic" : "bluetooth-disabled-symbolic"))}
          subtitle={createComputed(() => {
            if (!btAvailable()) return "Unavailable"
            if (!btPowered()) return "Off"
            if (btConnected()) return btDevices().find((d) => d.connected)?.name ?? "Connected"
            return "On"
          })}
          active={createComputed(() => btAvailable() && btPowered())}
          available={btAvailable}
          onClicked={() => {
            if (bt.adapter) bt.adapter.powered = !bt.adapter.powered
          }}
          more={() => run("kitty -e bluetoothctl")}
        />
      </box>
      <box class="squares" spacing={6} homogeneous>
        <SquareTile
          title="DND"
          icon={createComputed(() => "do-not-disturb-symbolic")}
          active={dnd}
          onClicked={() => (notifd.dontDisturb = !notifd.dontDisturb)}
        />
        <SquareTile
          title="Mic"
          icon={micMuted.as((m) => (m ? "microphone-disabled-symbolic" : "audio-input-microphone-symbolic"))}
          active={micMuted.as((m) => !m)}
          onClicked={() => {
            const mic = wp.audio.defaultMicrophone
            if (mic) mic.mute = !mic.mute
          }}
          more={() => run("pavucontrol -t 4")}
        />
        <SquareTile
          title="Speaker"
          icon={speakerIcon}
          active={speakerMuted.as((m) => !m)}
          onClicked={() => {
            const sp = wp.audio.defaultSpeaker
            if (sp) sp.mute = !sp.mute
          }}
          more={() => run("pavucontrol -t 3")}
        />
        <SquareTile
          title="Awake"
          tooltip="Keep screen awake (no auto-lock or screen-off)"
          icon={createComputed(() => "keep-awake-symbolic")}
          active={keepAwake}
          onClicked={toggleKeepAwake}
        />
        <SquareTile
          title="Airplane"
          icon={createComputed(() => "airplane-mode-symbolic")}
          active={airplane.on}
          available={airplane.available}
          onClicked={airplane.toggle}
        />
        <SquareTile
          title={power.profile.as((p) => (p === "performance" ? "Perf" : p === "power-saver" ? "Saver" : "Balanced"))}
          tooltip="Performance mode  (Shift+Enter: power saver)"
          icon={power.profile.as((p) =>
            p === "performance" ? "perf-performance-symbolic" : p === "power-saver" ? "perf-saver-symbolic" : "perf-balanced-symbolic",
          )}
          active={power.profile.as((p) => p === "performance" || p === "power-saver")}
          available={power.available}
          onClicked={power.toggle}
          more={power.toggleSaver}
        />
      </box>
    </box>
  )
}

// ── notifications ────────────────────────────────────────────────────────

// "Take me to it": run the notification's default action if it has one, and
// focus that app's window (matched on app_id via the desktop entry / app name).
function goTo(n: Notifd.Notification) {
  if (n.actions.some((a) => a.id === "default")) n.invoke("default")
  const ids = [n.desktopEntry, n.appName]
    .filter(Boolean)
    .map((i) => i.replace(/\.desktop$/, "").replace(/[^\w.\-]/g, ""))
    .filter(Boolean)
  if (ids.length) {
    const cmd = ids.map((i) => `[app_id="(?i)^${i}$"] focus`).join("; ")
    execAsync(["swaymsg", cmd]).catch(() => {})
  }
  n.dismiss()
  close()
}

function NotificationItem(props: {
  n: Notifd.Notification
  onActivate: () => void
  onClose: () => void
  closeTip?: string
  ref?: (w: Gtk.Widget) => void
}) {
  const { n } = props
  const hasFile = n.image && n.image.startsWith("/")
  const appIcon = hasFile ? null : appIconPaintable(n)

  return (
    <box
      class="notif-item"
      spacing={10}
      focusable
      $={(self) => {
        navItem(self, { activate: props.onActivate, dismiss: props.onClose })
        props.ref?.(self)
      }}
    >
      <Gtk.GestureClick onPressed={props.onActivate} />
      {hasFile ? (
        <image class="thumb" file={n.image} pixelSize={36} valign={Gtk.Align.START} />
      ) : appIcon ? (
        <image class="thumb" paintable={appIcon} pixelSize={36} valign={Gtk.Align.START} />
      ) : (
        <image class="thumb" iconName={n.appIcon || n.desktopEntry || "dialog-information-symbolic"} pixelSize={36} valign={Gtk.Align.START} />
      )}
      <box orientation={Gtk.Orientation.VERTICAL} spacing={2} hexpand>
        <box spacing={6}>
          <label class="notif-app" label={n.appName || "Notification"} xalign={0} hexpand />
          <label class="notif-time" label={timeLabel(n.time)} />
        </box>
        <label class="notif-title" label={n.summary} xalign={0} wrap maxWidthChars={30} />
        {n.body ? (
          <label class="notif-body" label={n.body} xalign={0} wrap maxWidthChars={34} lines={3} ellipsize={Pango.EllipsizeMode.END} />
        ) : (
          <box />
        )}
      </box>
      <button class="notif-close" focusable={false} valign={Gtk.Align.START} tooltipText={props.closeTip ?? "Dismiss"} onClicked={props.onClose}>
        <image iconName="window-close-symbolic" />
      </button>
    </box>
  )
}

// Apps whose stack is expanded. Module-level so it survives the list
// re-rendering when a new notification arrives.
const [expanded, setExpanded] = createState<Set<string>>(new Set())
const toggleExpanded = (app: string) =>
  setExpanded((s) => {
    const next = new Set(s)
    if (next.has(app)) next.delete(app)
    else next.add(app)
    return next
  })

type Group = { app: string; key: string; items: Notifd.Notification[] }

// Same app = similar. The key is normalised so variants of one app land in the
// same stack (Slack / slack / slack.desktop, Firefox / firefox / Mozilla
// Firefox): desktop entry if the sender gave one, else the app name.
// Input is newest-first, so groups come out ordered by their newest item and
// take their display name from it.
function groupKey(n: Notifd.Notification): string {
  const raw = (n.desktopEntry || n.appName || "notification").toLowerCase()
  return raw
    .replace(/\.desktop$/, "")
    .replace(/^(org|com|io)\.[a-z0-9_]+\./, "")
    .replace(/^mozilla[\s-]+/, "")
    .replace(/[\s_-]+(desktop|browser|app)$/, "")
    .trim()
}

function groupByApp(list: Notifd.Notification[]): Group[] {
  const groups = new Map<string, Group>()
  for (const n of list) {
    const key = groupKey(n)
    if (!groups.has(key)) groups.set(key, { app: n.appName || "Notification", key, items: [] })
    groups.get(key)!.items.push(n)
  }
  return [...groups.values()]
}

function NotificationGroup({ group }: { group: Group }) {
  const { app, key, items } = group
  const one = (n: Notifd.Notification) => <NotificationItem n={n} onActivate={() => goTo(n)} onClose={() => n.dismiss()} />
  if (items.length === 1) return one(items[0])

  const open = expanded.as((s) => s.has(key))
  const clearAll = () => items.forEach((n) => n.dismiss())

  // Expanding hides the card you were on and collapsing hides the header, so
  // move keyboard focus to the counterpart or it would fall back to the top.
  let stackCard: Gtk.Widget | undefined
  let header: Gtk.Widget | undefined
  const toggleAndFocus = () => {
    const wasOpen = expanded.get().has(key)
    toggleExpanded(key)
    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      ;(wasOpen ? stackCard : header)?.grab_focus()
      return GLib.SOURCE_REMOVE
    })
  }

  return (
    <box class={open.as((o) => (o ? "notif-group open" : "notif-group collapsed"))} orientation={Gtk.Orientation.VERTICAL} spacing={6}>
      {/* collapsed: newest card with the rest peeking out beneath it; click to expand */}
      <box class="stack" orientation={Gtk.Orientation.VERTICAL} visible={open.as((o) => !o)}>
        <NotificationItem
          n={items[0]}
          onActivate={toggleAndFocus}
          onClose={clearAll}
          closeTip={`Clear all ${items.length}`}
          ref={(w) => (stackCard = w)}
        />
        <box class="ghost g1" />
        {items.length > 2 && <box class="ghost g2" />}
      </box>
      {/* expanded: header (click to collapse) + every notification */}
      <box orientation={Gtk.Orientation.VERTICAL} spacing={6} visible={open}>
        <box
          class="group-bar"
          spacing={4}
          focusable
          $={(self) => {
            navItem(self, { activate: toggleAndFocus, dismiss: clearAll })
            header = self
          }}
        >
          <Gtk.GestureClick onPressed={toggleAndFocus} />
          <image iconName="pan-down-symbolic" />
          <label class="group-title" label={`${app} · ${items.length}`} xalign={0} hexpand />
          <button class="group-btn" onClicked={clearAll}>
            <label label="Clear all" />
          </button>
        </box>
        {items.map(one)}
      </box>
    </box>
  )
}

function Notifications() {
  const notifd = Notifd.get_default()
  const list = createBinding(notifd, "notifications").as((l) => [...l].sort((a, b) => b.time - a.time || b.id - a.id))
  const count = list.as((l) => l.length)
  const groups = list.as(groupByApp)

  return (
    <box class="notifs" orientation={Gtk.Orientation.VERTICAL} spacing={8} vexpand>
      <box class="section-header">
        <label class="section-title" label="Notifications" xalign={0} hexpand />
        <button class="clear" visible={count.as((c) => c > 0)} onClicked={() => [...notifd.notifications].forEach((n) => n.dismiss())}>
          <label label="Clear all" />
        </button>
      </box>
      <Gtk.ScrolledWindow vexpand focusable={false} hscrollbarPolicy={Gtk.PolicyType.NEVER} overlayScrolling={false}>
        <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
          <For each={groups} id={(g) => `${g.key}|${g.items.map((n) => `${n.id}-${n.time}`).join(",")}`}>
            {(g) => <NotificationGroup group={g} />}
          </For>
          <box class="notifs-empty" orientation={Gtk.Orientation.VERTICAL} spacing={8} visible={count.as((c) => c === 0)} valign={Gtk.Align.CENTER}>
            <image iconName="preferences-system-notifications-symbolic" pixelSize={40} />
            <label label="No notifications" />
          </box>
        </box>
      </Gtk.ScrolledWindow>
    </box>
  )
}

// ── panel ────────────────────────────────────────────────────────────────
function BatteryChip() {
  const bat = Battery.get_default()
  const present = createBinding(bat, "isPresent")
  const percent = createBinding(bat, "percentage")
  const icon = createBinding(bat, "batteryIconName")
  const charging = createBinding(bat, "charging")

  return (
    <box class={charging.as((c) => (c ? "battery-chip charging" : "battery-chip"))} spacing={4} visible={present} valign={Gtk.Align.CENTER}>
      <image iconName={icon} />
      <label label={percent.as((p) => `${Math.round(p * 100)}%`)} />
    </box>
  )
}

export default function ControlPanel() {
  const { TOP, BOTTOM, RIGHT } = Astal.WindowAnchor
  let win: Astal.Window

  // take keyboard focus as soon as the panel opens and land on the first item
  panelOpen.subscribe(() => {
    if (panelOpen.get()) {
      GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
        if (win) focusFirst(win)
        return GLib.SOURCE_REMOVE
      })
    }
  })

  return (
    <window
      name="panel"
      class="ControlPanel"
      visible={panelOpen}
      layer={Astal.Layer.TOP}
      exclusivity={Astal.Exclusivity.NORMAL}
      keymode={panelOpen.as((o) => (o ? Astal.Keymode.EXCLUSIVE : Astal.Keymode.NONE))}
      anchor={TOP | BOTTOM | RIGHT}
      application={app}
      $={(self) => (win = self)}
    >
      <Gtk.EventControllerKey
        propagationPhase={Gtk.PropagationPhase.CAPTURE}
        onKeyPressed={popupKeys(() => win, { close })}
      />
      <box class="panel-card" orientation={Gtk.Orientation.VERTICAL} spacing={14} widthRequest={370}>
        <box class="panel-header" spacing={4}>
          <label class="panel-title" label="Control center" xalign={0} hexpand />
          <BatteryChip />
          {/* Settings button — commented out until there is a settings view to open:
          <button tooltipText="Settings">
            <image iconName="emblem-system-symbolic" />
          </button>
          */}
          <button onClicked={() => run("~/.config/rofi/powermenu.sh")}>
            <image iconName="system-shutdown-symbolic" />
          </button>
        </box>
        <Toggles />
        <Notifications />
      </box>
    </window>
  )
}
