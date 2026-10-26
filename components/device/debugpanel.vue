<script setup lang="ts">
import type {
  Command, CommandResult, ConfigFile, DebugEvent, DeviceState, LogUnit,
} from '~~/types/device'

defineProps<{ state: DeviceState | null }>()

const { $api } = useNuxtApp()
const { data: ev, refresh: refreshEvents } = await useAPI<{ events: DebugEvent[] }>('/api/device/events')

let timer: ReturnType<typeof setInterval>
onMounted(() => { timer = setInterval(refreshEvents, 2000) })
onBeforeUnmount(() => clearInterval(timer))

const unit = ref<LogUnit>('camilladsp')
const lines = ref(100)
const file = ref<ConfigFile>('active')
const busy = ref(false)
const last = ref<{ cmd: string; res: CommandResult } | null>(null)

async function run(cmd: Command) {
  busy.value = true
  try {
    const res = await $api<CommandResult>('/api/device/command', { method: 'POST', body: cmd })
    last.value = { cmd: cmd.type, res }
  } catch (e) {
    last.value = { cmd: cmd.type, res: { ok: false, error: String(e), roundTripMs: 0 } }
  } finally {
    busy.value = false
    refreshEvents()
  }
}

function fmt(d: unknown): string {
  if (d === undefined) return ''
  if (typeof d === 'string') return d
  if (d && typeof d === 'object') {
    return Object.entries(d as Record<string, unknown>)
      .map(([k, v]) =>
        typeof v === 'string' && v.includes('\n')
          ? `── ${k} ──\n${v}`
          : `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join('\n')
  }
  return JSON.stringify(d, null, 2)
}

const output = computed(() => {
  const r = last.value?.res
  if (!r) return ''
  return r.ok ? fmt(r.data) : `ERROR: ${r.error}`
})

const time = (ts: number) => new Date(ts).toLocaleTimeString()
const eventsNewestFirst = computed(() => [...(ev.value?.events ?? [])].reverse())
const levelClass = (l: DebugEvent['level']) =>
  l === 'error' ? 'text-red-500' : l === 'warn' ? 'text-yellow-500' : 'text-muted-foreground'
</script>

<template>
  <div class="space-y-4">
    <section class="space-y-2">
      <h2 class="text-lg font-semibold">Debug</h2>
      <p v-if="state" class="text-sm text-muted-foreground">
        CamillaDSP: {{ state.camilladsp }} · {{ state.hostname }} · up {{ Math.round(state.uptime_s / 60) }} min
      </p>

      <div class="flex flex-wrap items-center gap-2">
        <button :disabled="busy" @click="run({ type: 'ping' })">Ping</button>
        <button :disabled="busy" @click="run({ type: 'get_state' })">State</button>
        <button :disabled="busy" @click="run({ type: 'get_info' })">System info</button>
        <button :disabled="busy" @click="run({ type: 'get_audio' })">Audio devices</button>
        <button :disabled="busy" @click="run({ type: 'restart_camilladsp' })">Restart CamillaDSP</button>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <select v-model="unit">
          <option value="camilladsp">camilladsp</option>
          <option value="dsp-agent">dsp-agent</option>
          <option value="kernel">kernel</option>
        </select>
        <input v-model.number="lines" type="number" min="1" max="500" class="w-24" />
        <button :disabled="busy" @click="run({ type: 'get_logs', unit, lines })">Get logs</button>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <select v-model="file">
          <option value="active">active.yml</option>
          <option value="base">base.yml</option>
          <option value="presets">presets.yml</option>
        </select>
        <button :disabled="busy" @click="run({ type: 'get_config', file })">Show config</button>
      </div>

      <div v-if="last">
        <p class="text-sm text-muted-foreground">
          {{ last.cmd }} ·
          <span :class="last.res.ok ? '' : 'text-red-500'">{{ last.res.ok ? 'ok' : 'failed' }}</span>
          · round trip {{ last.res.roundTripMs }} ms
          <span v-if="last.res.deviceMs !== undefined"> · device {{ last.res.deviceMs }} ms</span>
        </p>
        <pre class="max-h-96 overflow-auto rounded bg-black/40 p-2 text-xs">{{ output }}</pre>
      </div>
    </section>

    <section>
      <h2 class="text-lg font-semibold">Events</h2>
      <ul class="max-h-64 overflow-auto font-mono text-xs">
        <li v-for="(e, i) in eventsNewestFirst" :key="i" :class="levelClass(e.level)">
          {{ time(e.ts) }} [{{ e.source }}] {{ e.msg }}
        </li>
      </ul>
    </section>
  </div>
</template>