import Mpris from "gi://AstalMpris"
import Pango from "gi://Pango"
import { createBinding, createComputed } from "ags"

export default function Media() {
  const mpris = Mpris.get_default()
  const players = createBinding(mpris, "players")

  const hasPlayer = createComputed(() => players().length > 0)
  const label = createComputed(() => {
    const player = players()[0]
    if (!player) return ""
    const title = createBinding(player, "title")()
    const artist = createBinding(player, "artist")()
    return artist ? `${artist} - ${title}` : title
  })

  return (
    <box cssName="media" visible={hasPlayer}>
      <label label={label} maxWidthChars={30} ellipsize={Pango.EllipsizeMode.END} />
    </box>
  )
}
