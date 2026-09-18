import Bluetooth from "gi://AstalBluetooth"
import { createBinding, createComputed } from "ags"

export default function BluetoothWidget() {
  const bt = Bluetooth.get_default()
  const isPowered = createBinding(bt, "isPowered")
  const isConnected = createBinding(bt, "isConnected")

  const iconName = createComputed(() => {
    if (!isPowered()) return "bluetooth-disabled-symbolic"
    if (isConnected()) return "bluetooth-active-symbolic"
    return "bluetooth-symbolic"
  })

  const stateClass = createComputed(() => {
    if (!isPowered()) return "off"
    if (isConnected()) return "connected"
    return "on"
  })

  return <image cssName="bluetooth" class={stateClass} iconName={iconName} />
}
