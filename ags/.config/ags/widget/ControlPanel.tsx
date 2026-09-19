import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { execAsync } from "ags/process"
import Notifd from "gi://AstalNotifd"
import Wp from "gi://AstalWp"
import Network from "gi://AstalNetwork"
import Bluetooth from "gi://AstalBluetooth"
import Pango from "gi://Pango"
import { Accessor, For, createBinding, createComputed } from "ags"
import { panelOpen, setPanelOpen } from "../state"
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
}) {
  return (
    <button
      class={props.active.as((a) => (a ? "tile active" : "tile"))}
      sensitive={props.available ?? true}
      hexpand
      onClicked={props.onClicked}
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

  // DND / mic
  const dnd = createBinding(notifd, "dontDisturb")
  const micMuted = createBinding(wp, "audio", "defaultMicrophone", "mute")

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
        />
      </box>
      <box spacing={8} homogeneous>
        <Tile
          title="Do not disturb"
          icon={dnd.as((d) => (d ? "notifications-disabled-symbolic" : "preferences-system-notifications-symbolic"))}
          subtitle={dnd.as((d) => (d ? "On" : "Off"))}
          active={dnd}
          onClicked={() => (notifd.dontDisturb = !notifd.dontDisturb)}
        />
        <Tile
          title="Microphone"
          icon={micMuted.as((m) => (m ? "microphone-disabled-symbolic" : "audio-input-microphone-symbolic"))}
          subtitle={micMuted.as((m) => (m ? "Muted" : "On"))}
          active={micMuted.as((m) => !m)}
          onClicked={() => {
            const mic = wp.audio.defaultMicrophone
            if (mic) mic.mute = !mic.mute
          }}
        />
      </box>
    </box>
  )
}

// ── volume slider ────────────────────────────────────────────────────────
function VolumeSlider() {
  const wp = Wp.get_default()
  const icon = createBinding(wp, "audio", "defaultSpeaker", "volumeIcon")
  const volume = createBinding(wp, "audio", "defaultSpeaker", "volume")

  return (
    <box class="slider-row" spacing={10}>
      <button
        onClicked={() => {
          const s = wp.audio.defaultSpeaker
          if (s) s.mute = !s.mute
        }}
      >
        <image iconName={icon} />
      </button>
      <Gtk.Scale
        hexpand
        drawValue={false}
        $={(self) => {
          self.set_range(0, 1)
          self.set_increments(0.05, 0.1)
          const sync = (v: number) => {
            if (Math.abs(self.get_value() - v) > 0.001) self.set_value(v)
          }
          sync(volume.get())
          volume.subscribe(() => sync(volume.get()))
          self.connect("value-changed", () => {
            const s = wp.audio.defaultSpeaker
            if (s && Math.abs(s.volume - self.get_value()) > 0.001) s.volume = self.get_value()
          })
        }}
      />
      <label class="slider-value" label={volume.as((v) => `${Math.round(v * 100)}%`)} />
    </box>
  )
}

// ── notifications ────────────────────────────────────────────────────────
function NotificationItem({ n }: { n: Notifd.Notification }) {
  const hasFile = n.image && n.image.startsWith("/")
  const appIcon = hasFile ? null : appIconPaintable(n)

  return (
    <box class="notif-item" spacing={10}>
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
      <button class="notif-close" valign={Gtk.Align.START} onClicked={() => n.dismiss()}>
        <image iconName="window-close-symbolic" />
      </button>
    </box>
  )
}

function Notifications() {
  const notifd = Notifd.get_default()
  const list = createBinding(notifd, "notifications").as((l) => [...l].sort((a, b) => b.time - a.time))
  const count = list.as((l) => l.length)

  return (
    <box class="notifs" orientation={Gtk.Orientation.VERTICAL} spacing={8} vexpand>
      <box class="section-header">
        <label class="section-title" label="Notifications" xalign={0} hexpand />
        <button class="clear" visible={count.as((c) => c > 0)} onClicked={() => [...notifd.notifications].forEach((n) => n.dismiss())}>
          <label label="Clear all" />
        </button>
      </box>
      <Gtk.ScrolledWindow vexpand hscrollbarPolicy={Gtk.PolicyType.NEVER}>
        <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
          <For each={list} id={(n) => `${n.id}-${n.time}`}>
            {(n) => <NotificationItem n={n} />}
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
export default function ControlPanel() {
  const { TOP, BOTTOM, RIGHT } = Astal.WindowAnchor

  return (
    <window
      name="panel"
      class="ControlPanel"
      visible={panelOpen}
      layer={Astal.Layer.TOP}
      exclusivity={Astal.Exclusivity.NORMAL}
      keymode={Astal.Keymode.ON_DEMAND}
      anchor={TOP | BOTTOM | RIGHT}
      application={app}
    >
      <Gtk.EventControllerKey
        onKeyPressed={(_, keyval) => {
          if (keyval === Gdk.KEY_Escape) close()
        }}
      />
      <box class="panel-card" orientation={Gtk.Orientation.VERTICAL} spacing={14} widthRequest={370}>
        <box class="panel-header" spacing={4}>
          <label class="panel-title" label="Control center" xalign={0} hexpand />
          <button onClicked={() => run("~/.config/rice/lock")}>
            <image iconName="system-lock-screen-symbolic" />
          </button>
          <button onClicked={() => run("~/.config/rofi/powermenu.sh")}>
            <image iconName="system-shutdown-symbolic" />
          </button>
        </box>
        <Toggles />
        <VolumeSlider />
        <Notifications />
      </box>
    </window>
  )
}
