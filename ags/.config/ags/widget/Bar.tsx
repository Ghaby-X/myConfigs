import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import Workspaces from "./Workspaces"
import Clock from "./Clock"
import Tray from "./Tray"
import Network from "./Network"
import Bluetooth from "./Bluetooth"
import Audio from "./Audio"
import Battery from "./Battery"
import Media from "./Media"
import SystemStats from "./SystemStats"

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  return (
    <window
      visible
      name="bar"
      class="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox cssName="centerbox">
        <box $type="start" halign={Gtk.Align.START}>
          <Workspaces />
        </box>
        <box $type="center" halign={Gtk.Align.CENTER}>
          <Clock />
        </box>
        <box $type="end" halign={Gtk.Align.END}>
          <Media />
          <SystemStats />
          <Audio />
          <Tray />
          <box cssName="status-group" spacing={3}>
            <Network />
            <Bluetooth />
            <Battery />
          </box>
        </box>
      </centerbox>
    </window>
  )
}
