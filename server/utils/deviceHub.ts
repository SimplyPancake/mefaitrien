import type { Peer } from 'crossws'
import type { Command, CommandResult, DebugEvent, DeviceState, Reply } from '~~/types/device'

interface Pending {
  timer: ReturnType<typeof setTimeout>
  resolve: (r: Reply) => void
}

export const deviceHub = {
  peer: null as Peer | null,
  state: null as DeviceState | null,
  lastSeen: 0,
  connectedAt: 0,
  pending: new Map<string, Pending>(),
  events: [] as DebugEvent[],
}

export function pushEvent(source: DebugEvent['source'], level: DebugEvent['level'], msg: string) {
  deviceHub.events.push({ ts: Date.now(), source, level, msg })
  if (deviceHub.events.length > 200) deviceHub.events.shift()
  console.log(`[device:${source}] ${level} ${msg}`)
}

export function failAllPending(reason: string) {
  for (const [id, p] of deviceHub.pending) {
    clearTimeout(p.timer)
    p.resolve({ type: 'reply', id, ok: false, error: reason, ms: 0 })
  }
  deviceHub.pending.clear()
}

export function sendCommand(cmd: Command, timeoutMs = 10_000): Promise<CommandResult> {
  const peer = deviceHub.peer
  if (!peer) return Promise.resolve({ ok: false, error: 'device offline', roundTripMs: 0 })

  const id = crypto.randomUUID()
  const t0 = Date.now()
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      deviceHub.pending.delete(id)
      pushEvent('server', 'warn', `${cmd.type} timed out after ${timeoutMs} ms`)
      resolve({ ok: false, error: `timeout after ${timeoutMs} ms`, roundTripMs: Date.now() - t0 })
    }, timeoutMs)

    deviceHub.pending.set(id, {
      timer,
      resolve: (r) =>
        resolve({ ok: r.ok, data: r.data, error: r.error, deviceMs: r.ms, roundTripMs: Date.now() - t0 }),
    })
    peer.send(JSON.stringify({ ...cmd, id }))
  })
}