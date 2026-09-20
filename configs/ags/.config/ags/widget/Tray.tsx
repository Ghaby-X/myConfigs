import Tray from "gi://AstalTray"
import { For, createBinding, createComputed } from "ags"

export default function TrayWidget() {
  const tray = Tray.get_default()
  const items = createBinding(tray, "items")
  const hasItems = createComputed(() => items().length > 0)

  return (
    <box cssName="tray" spacing={6} visible={hasItems}>
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
