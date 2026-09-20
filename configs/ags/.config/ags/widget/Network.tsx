import NetworkLib from "gi://AstalNetwork"
import { createBinding, createComputed } from "ags"

export default function Network() {
  const network = NetworkLib.get_default()
  const primary = createBinding(network, "primary")
  const wifiIcon = createBinding(network, "wifi", "iconName")
  const wiredIcon = createBinding(network, "wired", "iconName")

  const icon = createComputed(() => {
    switch (primary()) {
      case NetworkLib.Primary.WIFI:
        return wifiIcon() ?? "network-wireless-symbolic"
      case NetworkLib.Primary.WIRED:
        return wiredIcon() ?? "network-wired-symbolic"
      default:
        return "network-offline-symbolic"
    }
  })

  return <image cssName="network" iconName={icon} />
}
