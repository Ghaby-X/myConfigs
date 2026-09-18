import Battery from "gi://AstalBattery"
import { createBinding, createComputed } from "ags"

export default function BatteryWidget() {
  const battery = Battery.get_default()
  const isPresent = createBinding(battery, "isPresent")
  const percentage = createBinding(battery, "percentage")
  const icon = createBinding(battery, "batteryIconName")

  return (
    <box cssName="battery" visible={isPresent}>
      <image iconName={icon} />
      <label label={createComputed(() => `${Math.round(percentage() * 100)}%`)} />
    </box>
  )
}
