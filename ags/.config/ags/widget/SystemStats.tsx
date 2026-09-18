import GLib from "gi://GLib"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

type CpuSample = { idleTotal: number; total: number; usage: number }

function readFile(path: string): string {
  const [, contents] = GLib.file_get_contents(path)
  return new TextDecoder().decode(contents)
}

function readCpu(prev: CpuSample): CpuSample {
  const line = readFile("/proc/stat").split("\n")[0]
  const parts = line.trim().split(/\s+/).slice(1).map(Number)
  const idleTotal = parts[3] + parts[4]
  const total = parts.reduce((a, b) => a + b, 0)
  const diffIdle = idleTotal - prev.idleTotal
  const diffTotal = total - prev.total
  const usage = diffTotal > 0 ? Math.round((1 - diffIdle / diffTotal) * 100) : prev.usage
  return { idleTotal, total, usage }
}

function readMem(): number {
  const text = readFile("/proc/meminfo")
  const get = (key: string) => Number(text.match(new RegExp(`${key}:\\s+(\\d+)`))?.[1] ?? 0)
  const total = get("MemTotal")
  const avail = get("MemAvailable")
  return total > 0 ? Math.round(((total - avail) / total) * 100) : 0
}

// GPU monitoring is vendor-specific and there's no generic Astal lib for it.
// Try nvidia-smi if present; otherwise show nothing (this VM's virtio GPU
// exposes no usable stats either way — revisit on real hardware).
async function readGpu(): Promise<string | null> {
  try {
    const out = await execAsync(["nvidia-smi", "--query-gpu=utilization.gpu", "--format=csv,noheader,nounits"])
    return `${out.trim()}%`
  } catch {
    return null
  }
}

export default function SystemStats() {
  const cpu = createPoll<CpuSample>({ idleTotal: 0, total: 0, usage: 0 }, 2000, readCpu)
  const mem = createPoll<number>(0, 2000, () => readMem())
  const gpu = createPoll<string | null>(null, 2000, () => readGpu())

  return (
    <box cssName="system-stats">
      <label label={cpu.as((c) => `  ${c.usage}%`)} />
      <label label={mem.as((m) => `  ${m}%`)} />
      <label label={gpu} visible={gpu.as((g) => g !== null)} />
    </box>
  )
}
