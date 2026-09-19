import app from "ags/gtk4/app"
import { Gdk, Gtk } from "ags/gtk4"
import GLib from "gi://GLib"
import style from "./style.scss"
import Bar from "./widget/Bar"
import NotificationPopups from "./widget/NotificationPopups"
import CalendarPopup from "./widget/CalendarPopup"
import ControlPanel from "./widget/ControlPanel"
import ThemePicker from "./widget/ThemePicker"
import { togglePanel, toggleCalendar, toggleThemePicker } from "./state"

app.start({
  css: style,
  // `ags request panel|calendar|themes` — bound to $mod+n / $mod+c / $mod+t in the sway config
  requestHandler(argv: string[] | string, res: (response: string) => void) {
    const cmd = Array.isArray(argv) ? argv[0] : argv
    if (cmd === "panel") {
      togglePanel()
      res("ok")
    } else if (cmd === "calendar") {
      toggleCalendar()
      res("ok")
    } else if (cmd === "themes") {
      toggleThemePicker()
      res("ok")
    } else {
      res(`unknown request: ${cmd}`)
    }
  },
  main() {
    // our own symbolic icons (e.g. do-not-disturb), laid out like an icon theme
    Gtk.IconTheme.get_for_display(Gdk.Display.get_default()!).add_search_path(
      `${GLib.get_home_dir()}/.config/ags/icons`,
    )
    app.get_monitors().map(Bar)
    NotificationPopups()
    CalendarPopup()
    ControlPanel()
    ThemePicker()
  },
})
