import Wp from "gi://AstalWp"
import { createBinding } from "ags"

export default function Audio() {
  const wp = Wp.get_default()

  const speakerIcon = createBinding(wp, "audio", "defaultSpeaker", "volumeIcon")
  const speakerMuted = createBinding(wp, "audio", "defaultSpeaker", "mute")
  const micIcon = createBinding(wp, "audio", "defaultMicrophone", "volumeIcon")
  const micMuted = createBinding(wp, "audio", "defaultMicrophone", "mute")

  return (
    <box cssName="audio" spacing={6}>
      <button
        cssName="speaker"
        class={speakerMuted.as((muted) => (muted ? "muted" : ""))}
        onClicked={() => {
          const speaker = wp.audio.defaultSpeaker
          if (speaker) speaker.mute = !speaker.mute
        }}
      >
        <image iconName={speakerIcon} />
      </button>
      <button
        cssName="microphone"
        class={micMuted.as((muted) => (muted ? "muted" : ""))}
        onClicked={() => {
          const mic = wp.audio.defaultMicrophone
          if (mic) mic.mute = !mic.mute
        }}
      >
        <image iconName={micIcon} />
      </button>
    </box>
  )
}
