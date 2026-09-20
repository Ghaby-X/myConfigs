import Notifd from "gi://AstalNotifd"
import { createBinding } from "ags"

// Shown in the bar only while do-not-disturb is on; click to turn it off.
export default function Dnd() {
  const notifd = Notifd.get_default()
  const dnd = createBinding(notifd, "dontDisturb")

  return (
    <button cssName="dnd" visible={dnd} tooltipText="Do not disturb — click to turn off" onClicked={() => (notifd.dontDisturb = false)}>
      <image iconName="do-not-disturb-symbolic" />
    </button>
  )
}
