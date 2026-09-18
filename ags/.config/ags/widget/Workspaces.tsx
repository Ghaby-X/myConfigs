import { For, createState, createComputed } from "ags"
import { execAsync, subprocess } from "ags/process"

const MIN_WORKSPACES = 4

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

  // sway only reports workspaces that currently exist (have windows, or are
  // focused) — always show at least 1..MIN_WORKSPACES as click-to-create
  // slots, plus any real workspace beyond that range.
  const displayNumbers = createComputed(() => {
    const nums = new Set<number>(Array.from({ length: MIN_WORKSPACES }, (_, i) => i + 1))
    for (const ws of workspaces()) nums.add(ws.num)
    return Array.from(nums).sort((a, b) => a - b)
  })

  return (
    <box cssName="workspaces">
      <For each={displayNumbers}>
        {(num) => {
          const focused = createComputed(() => workspaces().find((w) => w.num === num)?.focused ?? false)
          const urgent = createComputed(() => workspaces().find((w) => w.num === num)?.urgent ?? false)

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
