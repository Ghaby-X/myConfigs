import { recording, stopRecording } from "../recording"

// Shown in the bar only while a screen recording is running; click to stop it.
export default function Recording() {
  return (
    <button cssName="recording" visible={recording} tooltipText="Recording the screen — click to stop" onClicked={stopRecording}>
      <image iconName="screen-recording-symbolic" />
    </button>
  )
}
