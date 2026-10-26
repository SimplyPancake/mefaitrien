<script setup lang="ts">
import type {
  Command, CommandResult, ConfigFile, DebugEvent, DeviceState, LogUnit,
} from '~~/types/device'

const props = defineProps<{ online: boolean; state: DeviceState | null }>()

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
  if (!props.online) return
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
  <div class="space-y-5">
    <section class="overflow-hidden rounded-xl border bg-card shadow-sm">
      <header class="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-5">
        <div class="flex items-center gap-3">
          <div class="rounded-lg bg-primary/10 p-2.5 text-primary">
            <Icon name="lucide:bug" class="size-5" />
          </div>
          <div>
            <h2 class="font-semibold tracking-tight">Device diagnostics</h2>
            <p class="text-xs text-muted-foreground">Admin tools and device status</p>
          </div>
        </div>
        <div class="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
          :class="props.online ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'"
          role="status">
          <span class="size-2 rounded-full" :class="props.online ? 'bg-emerald-500' : 'bg-destructive'" />
          {{ props.online ? 'Online' : 'Offline' }}
        </div>
        <div v-if="props.online && state" class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span><span class="font-medium text-foreground">Host</span> {{ state.hostname }}</span>
          <span><span class="font-medium text-foreground">CamillaDSP</span> {{ state.camilladsp }}</span>
          <span><span class="font-medium text-foreground">Uptime</span> {{ Math.round(state.uptime_s / 60) }} min</span>
        </div>
      </header>

      <div v-if="!props.online" class="flex items-start gap-3 border-b border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive sm:px-5">
        <Icon name="lucide:circle-alert" class="mt-0.5 size-4 shrink-0" />
        <p>The device is offline. Device commands are disabled until it reconnects.</p>
      </div>

      <div class="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
        <section class="space-y-3">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick commands</h3>
          <div class="grid grid-cols-2 gap-2">
            <button
              class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="busy || !props.online"
              @click="run({ type: 'ping' })"
            >
              <Icon name="lucide:radio" class="size-4" /> Ping
            </button>
            <button
              class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="busy || !props.online"
              @click="run({ type: 'get_state' })"
            >
              <Icon name="lucide:activity" class="size-4" /> State
            </button>
            <button
              class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="busy || !props.online"
              @click="run({ type: 'get_info' })"
            >
              <Icon name="lucide:info" class="size-4" /> System info
            </button>
            <button
              class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="busy || !props.online"
              @click="run({ type: 'get_audio' })"
            >
              <Icon name="lucide:volume-2" class="size-4" /> Audio devices
            </button>
            <button
              class="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="busy || !props.online"
              @click="run({ type: 'restart_camilladsp' })"
            >
              <Icon name="lucide:rotate-cw" class="size-4" /> Restart CamillaDSP
            </button>
          </div>
        </section>

        <section class="space-y-3">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Read device files</h3>
          <div class="space-y-3 rounded-lg border bg-muted/20 p-3">
            <div class="flex flex-wrap items-end gap-2">
              <label class="min-w-36 flex-1 space-y-1">
                <span class="text-xs font-medium text-muted-foreground">Log service</span>
                <select v-model="unit" :disabled="!props.online" class="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="camilladsp">camilladsp</option>
                  <option value="dsp-agent">dsp-agent</option>
                  <option value="kernel">kernel</option>
                </select>
              </label>
              <label class="w-24 space-y-1">
                <span class="text-xs font-medium text-muted-foreground">Lines</span>
                <input v-model.number="lines" type="number" min="1" max="500" :disabled="!props.online" class="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50" />
              </label>
              <button
                class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="busy || !props.online"
                @click="run({ type: 'get_logs', unit, lines })"
              >
                <Icon name="lucide:file-text" class="size-4" /> Get logs
              </button>
            </div>
            <div class="flex flex-wrap items-end gap-2">
              <label class="min-w-36 flex-1 space-y-1">
                <span class="text-xs font-medium text-muted-foreground">Configuration</span>
                <select v-model="file" :disabled="!props.online" class="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="active">active.yml</option>
                  <option value="base">base.yml</option>
                  <option value="presets">presets.yml</option>
                </select>
              </label>
              <button
                class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="busy || !props.online"
                @click="run({ type: 'get_config', file })"
              >
                <Icon name="lucide:braces" class="size-4" /> Show config
              </button>
            </div>
          </div>
        </section>
      </div>

      <div v-if="last" class="border-t px-4 py-4 sm:px-5">
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2 text-sm">
            <span class="font-mono font-medium">{{ last.cmd }}</span>
            <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="last.res.ok ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'">
              {{ last.res.ok ? 'Success' : 'Failed' }}
            </span>
          </div>
          <span class="text-xs text-muted-foreground">
            Round trip {{ last.res.roundTripMs }} ms
            <span v-if="last.res.deviceMs !== undefined"> · Device {{ last.res.deviceMs }} ms</span>
          </span>
        </div>
        <pre class="max-h-96 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed">{{ output }}</pre>
      </div>
    </section>

    <section class="overflow-hidden rounded-xl border bg-card shadow-sm">
      <header class="flex items-center justify-between border-b px-4 py-3 sm:px-5">
        <div class="flex items-center gap-2">
          <Icon name="lucide:scroll-text" class="size-4 text-primary" />
          <h2 class="font-semibold">Device events</h2>
        </div>
        <span class="text-xs text-muted-foreground">{{ eventsNewestFirst.length }} recent</span>
      </header>
      <ul v-if="eventsNewestFirst.length" class="max-h-80 divide-y overflow-auto">
        <li v-for="(e, i) in eventsNewestFirst" :key="i" class="flex gap-3 px-4 py-2.5 text-xs sm:px-5">
          <time class="shrink-0 pt-0.5 font-mono text-muted-foreground">{{ time(e.ts) }}</time>
          <span class="shrink-0 rounded px-1.5 py-0.5 font-semibold uppercase" :class="levelClass(e.level)">{{ e.level }}</span>
          <span class="shrink-0 text-muted-foreground">[{{ e.source }}]</span>
          <span class="min-w-0 break-words">{{ e.msg }}</span>
        </li>
      </ul>
      <p v-else class="px-4 py-8 text-center text-sm text-muted-foreground">
        No device events yet.
      </p>
    </section>
  </div>
</template>