export interface DeviceState {
  type: 'state'
  hostname: string
  uptime_s: number
  camilladsp: string
  preset: string | null
  presets: string[]
}

export type LogUnit = 'camilladsp' | 'dsp-agent' | 'kernel'
export type ConfigFile = 'active' | 'base' | 'presets'

// page -> server -> device (the server adds `id`)
export type Command =
  | { type: 'ping' }
  | { type: 'get_state' }
  | { type: 'get_info' }
  | { type: 'get_audio' }
  | { type: 'get_config'; file: ConfigFile }
  | { type: 'get_logs'; unit: LogUnit; lines: number }
  | { type: 'restart_camilladsp' }
  | { type: 'set_preset'; preset: string }

// device -> server
export interface Reply {
  type: 'reply'
  id: string
  ok: boolean
  data?: unknown
  error?: string
  ms: number // time the device spent on the command
}

export interface DeviceLog {
  type: 'log'
  level: 'info' | 'warn' | 'error'
  msg: string
  ts: number
}

// server -> page
export interface DebugEvent {
  ts: number
  source: 'server' | 'device'
  level: 'info' | 'warn' | 'error'
  msg: string
}

export interface CommandResult {
  ok: boolean
  data?: unknown
  error?: string
  deviceMs?: number
  roundTripMs: number
}

export interface DeviceStatus {
  online: boolean
  lastSeen: number
  connectedAt: number
  state: DeviceState | null
}

const LOG_UNITS: readonly LogUnit[] = ['camilladsp', 'dsp-agent', 'kernel']
const CONFIG_FILES: readonly ConfigFile[] = ['active', 'base', 'presets']

export function parseCommand(x: unknown): Command | null {
  const c = x as Record<string, unknown> | null
  if (!c || typeof c.type !== 'string') return null
  const t = c.type
  switch (t) {
    case 'ping':
    case 'get_state':
    case 'get_info':
    case 'get_audio':
    case 'restart_camilladsp':
      return { type: t }
    case 'get_config':
      return CONFIG_FILES.includes(c.file as ConfigFile)
        ? { type: 'get_config', file: c.file as ConfigFile }
        : null
    case 'get_logs': {
      const lines = Number(c.lines ?? 100)
      return LOG_UNITS.includes(c.unit as LogUnit) && Number.isInteger(lines) && lines >= 1 && lines <= 500
        ? { type: 'get_logs', unit: c.unit as LogUnit, lines }
        : null
    }
    case 'set_preset':
      return typeof c.preset === 'string' ? { type: 'set_preset', preset: c.preset } : null
    default:
      return null
  }
}

export function isDeviceState(x: unknown): x is DeviceState {
  const s = x as Partial<DeviceState> | null
  return (
    !!s &&
    s.type === 'state' &&
    typeof s.hostname === 'string' &&
    typeof s.uptime_s === 'number' &&
    typeof s.camilladsp === 'string' &&
    (s.preset === null || typeof s.preset === 'string') &&
    Array.isArray(s.presets) &&
    s.presets.every((p) => typeof p === 'string')
  )
}

export function isReply(x: unknown): x is Reply {
  const r = x as Partial<Reply> | null
  return !!r && r.type === 'reply' && typeof r.id === 'string' && typeof r.ok === 'boolean' && typeof r.ms === 'number'
}

export function isDeviceLog(x: unknown): x is DeviceLog {
  const l = x as Partial<DeviceLog> | null
  return (
    !!l &&
    l.type === 'log' &&
    (l.level === 'info' || l.level === 'warn' || l.level === 'error') &&
    typeof l.msg === 'string'
  )
}