import Bluetooth from "gi://AstalBluetooth"
import { createBinding, createComputed, createState } from "ags"

export default function BluetoothWidget() {
  const bt = Bluetooth.get_default()
  const isPowered = createBinding(bt, "isPowered")
  const isConnected = createBinding(bt, "isConnected")
  const [mockPowered, setMockPowered] = createState<boolean>(false)

  const effectivePowered = createComputed(() => {
    if (bt.adapter) return isPowered()
    return mockPowered()
  })

  const iconName = createComputed(() => {
    if (!effectivePowered()) return "bluetooth-disabled-symbolic"
    if (isConnected()) return "bluetooth-active-symbolic"
    return "bluetooth-symbolic"
  })

  const stateClass = createComputed(() => {
    if (!effectivePowered()) return "off"
    if (isConnected()) return "connected"
    return "on"
  })

  const toggle = () => {
    if (bt.adapter) {
      try {
        bt.adapter.powered = !bt.adapter.powered
      } catch (e) {
        console.error("Failed to toggle bluetooth adapter:", e)
      }
    } else {
      setMockPowered(!mockPowered())
    }
  }

  return (
    <button cssName="bluetooth" class={stateClass} onClicked={toggle}>
      <image iconName={iconName} />
    </button>
  )
}
