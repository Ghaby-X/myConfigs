import { For, createState, createComputed } from "ags"
import { execAsync, subprocess } from "ags/process"

type SwayWorkspace = {
  num: number
  name: string
  focused: boolean
  urgent: boolean
}

function getWorkspaces(): Promise<SwayWorkspace[]> {
  return execAsync(["swaymsg", "-t", "get_workspaces"]).then((out) => JSON.parse(out))
}

export default function Workspaces() {
  const [workspaces, setWorkspaces] = createState<SwayWorkspace[]>([])

  getWorkspaces().then(setWorkspaces).catch(console.error)

  // sway has no polling API for this — subscribe to the IPC event stream and
  // re-fetch the full workspace list on every change. Cheap: this only fires
  // on actual workspace events, not on a timer.
  subprocess({
    cmd: ["swaymsg", "-t", "subscribe", "-m", '["workspace"]'],
    out: () => {
      getWorkspaces().then(setWorkspaces).catch(console.error)
    },
  })

  return (
    <box cssName="workspaces">
      <For each={workspaces} id={(ws) => ws.name}>
        {(ws) => {
          const name = ws.name
          const num = ws.num
          const focused = createComputed(() => workspaces().find((w) => w.name === name)?.focused ?? false)
          const urgent = createComputed(() => workspaces().find((w) => w.name === name)?.urgent ?? false)

          return (
            <button
              class={createComputed(() => {
                const classes = ["workspace"]
                if (focused()) classes.push("focused")
                if (urgent()) classes.push("urgent")
                return classes.join(" ")
              })}
              onClicked={() => execAsync(["swaymsg", "workspace", "number", String(num)])}
            >
              <label label={String(num)} />
            </button>
          )
        }}
      </For>
    </box>
  )
}
