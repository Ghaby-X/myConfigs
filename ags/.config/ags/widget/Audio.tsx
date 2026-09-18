import Wp from "gi://AstalWp"
import { createBinding } from "ags"

export default function Audio() {
  const wp = Wp.get_default()

  const speakerIcon = createBinding(wp, "audio", "defaultSpeaker", "volumeIcon")
  const micIcon = createBinding(wp, "audio", "defaultMicrophone", "volumeIcon")

  return (
    <box cssName="audio">
      <button
        cssName="speaker"
        onClicked={() => {
          const speaker = wp.audio.defaultSpeaker
          if (speaker) speaker.mute = !speaker.mute
        }}
      >
        <image iconName={speakerIcon} />
      </button>
      <button
        cssName="microphone"
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
