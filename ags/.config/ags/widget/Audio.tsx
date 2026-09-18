import Wp from "gi://AstalWp"
import { createBinding, createComputed } from "ags"

export default function Audio() {
  const wp = Wp.get_default()

  const speakerIcon = createBinding(wp, "audio", "defaultSpeaker", "volumeIcon")
  const speakerVolume = createBinding(wp, "audio", "defaultSpeaker", "volume")
  const micIcon = createBinding(wp, "audio", "defaultMicrophone", "volumeIcon")

  const speakerLabel = createComputed(() => `${Math.round((speakerVolume() ?? 0) * 100)}%`)

  return (
    <box cssName="audio" spacing={10}>
      <box spacing={4}>
        <button
          cssName="speaker"
          onClicked={() => {
            const speaker = wp.audio.defaultSpeaker
            if (speaker) speaker.mute = !speaker.mute
          }}
        >
          <image iconName={speakerIcon} />
        </button>
        <label label={speakerLabel} />
      </box>
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
