import GLib from "gi://GLib"

// Small JSON-file persistence shared by the productivity panel's tools
// (pomodoro/todo/routine/notes) — same idea as awake.ts's flag file, just
// with real data. Lives outside the repo (state, not config).

const DIR = `${GLib.get_user_state_dir()}/rice/productivity`
GLib.mkdir_with_parents(DIR, 0o755)

export function readJSON<T>(name: string, fallback: T): T {
  try {
    const [ok, bytes] = GLib.file_get_contents(`${DIR}/${name}.json`)
    if (!ok) return fallback
    return JSON.parse(new TextDecoder().decode(bytes)) as T
  } catch {
    return fallback
  }
}

export function writeJSON(name: string, data: unknown) {
  GLib.file_set_contents(`${DIR}/${name}.json`, JSON.stringify(data))
}

export const todayStr = (): string => GLib.DateTime.new_now_local().format("%Y-%m-%d") ?? ""

export function notify(summary: string, body = "") {
  GLib.spawn_command_line_async(
    `notify-send -a Productivity ${GLib.shell_quote(summary)} ${GLib.shell_quote(body)}`,
  )
}
