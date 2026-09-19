import app from "ags/gtk4/app"
import { Astal, Gtk } from "ags/gtk4"
import GLib from "gi://GLib"
import Wp from "gi://AstalWp"
import { createBinding, createState } from "ags"

// On-screen display: a small pill at the bottom of the screen that shows the new
// level when volume, mute, mic or brightness change, then hides itself.
//   volume / mute / mic  — watched here, so it also shows when another app changes them
//   brightness           — `ags request osd brightness <percent>` (theme/.config/rice/brightness)

type Osd = { icon: string; value: number; label: string; muted: boolean }

const HIDE_AFTER_MS = 1500
const [osd, setOsd] = createState<Osd>({ icon: "audio-volume-medium-symbolic", value: 0, label: "", muted: false })
const [visible, setVisible] = createState(false)
let timer = 0

export function showOsd(o: Osd) {
  setOsd(o)
  setVisible(true)
  if (timer) GLib.source_remove(timer)
  timer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, HIDE_AFTER_MS, () => {
    setVisible(false)
    timer = 0
    return GLib.SOURCE_REMOVE
  })
}

export function showBrightness(percent: number) {
  showOsd({
    icon: "display-brightness-symbolic",
    value: percent / 100,
    label: `${Math.round(percent)}%`,
    muted: false,
  })
}

export default function OsdPopup() {
  const wp = Wp.get_default()

  // ignore the change notifications that fire while the audio stack starts up
  let ready = false
  GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3000, () => {
    ready = true
    return GLib.SOURCE_REMOVE
  })

  const showVolume = () => {
    const sp = wp.audio.defaultSpeaker
    if (!ready || !sp) return
    showOsd({
      icon: sp.mute ? "audio-volume-muted-symbolic" : sp.volumeIcon,
      value: sp.mute ? 0 : sp.volume,
      label: sp.mute ? "Muted" : `${Math.round(sp.volume * 100)}%`,
      muted: sp.mute,
    })
  }
  createBinding(wp, "audio", "defaultSpeaker", "volume").subscribe(showVolume)
  createBinding(wp, "audio", "defaultSpeaker", "mute").subscribe(showVolume)

  createBinding(wp, "audio", "defaultMicrophone", "mute").subscribe(() => {
    const mic = wp.audio.defaultMicrophone
    if (!ready || !mic) return
    showOsd({
      icon: mic.mute ? "microphone-disabled-symbolic" : "audio-input-microphone-symbolic",
      value: mic.mute ? 0 : 1,
      label: mic.mute ? "Mic muted" : "Mic on",
      muted: mic.mute,
    })
  })

  const { BOTTOM } = Astal.WindowAnchor
  return (
    <window
      name="osd"
      class="OsdPopup"
      visible={visible}
      layer={Astal.Layer.OVERLAY}
      exclusivity={Astal.Exclusivity.IGNORE}
      keymode={Astal.Keymode.NONE}
      anchor={BOTTOM}
      marginBottom={90}
      application={app}
    >
      <box class="osd" spacing={12}>
        <image iconName={osd.as((o) => o.icon)} />
        <Gtk.ProgressBar class={osd.as((o) => (o.muted ? "osd-bar muted" : "osd-bar"))} fraction={osd.as((o) => Math.min(1, Math.max(0, o.value)))} valign={Gtk.Align.CENTER} hexpand />
        <label class="osd-label" label={osd.as((o) => o.label)} />
      </box>
    </window>
  )
}
