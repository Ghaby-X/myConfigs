import app from "ags/gtk4/app"
import style from "./style.scss"
import Bar from "./widget/Bar"
import NotificationPopups from "./widget/NotificationPopups"

app.start({
  css: style,
  main() {
    app.get_monitors().map(Bar)
    NotificationPopups()
  },
})
