import Battery from "gi://AstalBattery"
import { createBinding, createComputed } from "ags"

export default function BatteryWidget() {
  const battery = Battery.get_default()
  const isPresent = createBinding(battery, "isPresent")
  const percentage = createBinding(battery, "percentage")
  const icon = createBinding(battery, "batteryIconName")

  const isLow = createComputed(() => percentage() < 0.2)

  return (
    <box cssName="battery" spacing={4} class={isLow.as((low) => (low ? "low" : ""))} visible={isPresent}>
      <image iconName={icon} />
      <label label={createComputed(() => `${Math.round(percentage() * 100)}%`)} />
    </box>
  )
}
