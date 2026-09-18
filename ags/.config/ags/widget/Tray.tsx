import Tray from "gi://AstalTray"
import { For, createBinding } from "ags"

export default function TrayWidget() {
  const tray = Tray.get_default()
  const items = createBinding(tray, "items")

  return (
    <box cssName="tray">
      <For each={items}>
        {(item) => (
          <image
            gicon={createBinding(item, "gicon")}
            tooltipText={createBinding(item, "tooltipMarkup")}
          />
        )}
      </For>
    </box>
  )
}
