<script setup lang="ts">
import { DeviceDebugpanel } from '#components'
import { Role } from '~/generated/prisma/enums'
import type { DeviceStatus } from '~~/types/device'

const { $api } = useNuxtApp()
const sessionStore = useSessionStore() // however you already get your session store
// Role: import it the same way you do elsewhere
const isAdmin = computed(() => sessionStore!.sessionData!.roles.includes(Role.ADMIN))

const { data, refresh } = await useAPI<DeviceStatus>('/api/device/state')

let timer: ReturnType<typeof setInterval>
onMounted(() => { timer = setInterval(refresh, 2000) })
onBeforeUnmount(() => clearInterval(timer))

const busy = ref(false)
const error = ref<string | null>(null)

async function setPreset(preset: string) {
  busy.value = true
  error.value = null
  try {
    const res = await $api<{ ok: boolean; error?: string }>('/api/device/preset', {
      method: 'POST',
      body: { preset },
    })
    if (!res.ok) error.value = res.error ?? 'Failed'
  } catch (e) {
    error.value = 'Request failed'
  } finally {
    busy.value = false
    refresh()
  }
}

const time = (ts: number) => new Date(ts).toLocaleTimeString()

const INPUT_A = 'PC'
const INPUT_B = 'BT'
const OUTPUT_A = 'Woonkamer'
const OUTPUT_B = 'Keuken'

type Chan = 'A' | 'B'
type Connection = { input: Chan; output: Chan }
const PRESETS: {
  id: string
  title: string
  description: string
  connections: Connection[]
}[] = [
  {
    id: 'straight',
    title: 'Straight',
    description: `${INPUT_A} → ${OUTPUT_A}, ${INPUT_B} → ${OUTPUT_B}`,
    connections: [{ input: 'A', output: 'A' }, { input: 'B', output: 'B' }],
  },
  {
    id: 'a-to-both',
    title: 'A to both',
    description: `${INPUT_A} → ${OUTPUT_A} + ${OUTPUT_B}`,
    connections: [{ input: 'A', output: 'A' }, { input: 'A', output: 'B' }],
  },
  {
    id: 'b-to-both',
    title: 'B to both',
    description: `${INPUT_B} → ${OUTPUT_A} + ${OUTPUT_B}`,
    connections: [{ input: 'B', output: 'A' }, { input: 'B', output: 'B' }],
  },
  {
    id: 'swapped',
    title: 'Swapped',
    description: `${INPUT_A} → ${OUTPUT_B}, ${INPUT_B} → ${OUTPUT_A}`,
    connections: [{ input: 'A', output: 'B' }, { input: 'B', output: 'A' }],
  },
  {
    id: 'mix-to-both',
    title: 'Mix to both',
    description: `${INPUT_A} + ${INPUT_B} → both outputs (−6 dB each)`,
    connections: [
      { input: 'A', output: 'A' }, { input: 'B', output: 'A' },
      { input: 'A', output: 'B' }, { input: 'B', output: 'B' },
    ],
  },
]
const lineColor: Record<Chan, string> = { A: '#0ea5e9', B: '#f59e0b' }
const availablePresets = computed(() => new Set(data.value?.state?.presets ?? []))
</script>

<template>
  <div class="flex w-full min-w-0 max-w-full flex-col gap-5 overflow-x-hidden xl:max-w-7xl">
    <header class="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-xl border bg-card px-4 py-4 shadow-sm sm:px-5 sm:py-5">
      <div class="flex min-w-0 items-start gap-3">
        <div class="rounded-lg bg-primary/10 p-2.5 text-primary">
          <Icon name="lucide:audio-lines" class="size-5" />
        </div>
        <div class="min-w-0">
          <h1 class="text-xl font-semibold tracking-tight">DSP device</h1>
        </div>
      </div>
      <div class="flex items-center gap-2 rounded-lg bg-muted/60 px-4 py-2">
        <span class="size-2.5 rounded-full" :class="data?.online ? 'bg-emerald-500' : 'bg-red-500'" />
        <div>
          <p class="text-sm font-semibold">{{ data?.online ? 'Online' : 'Offline' }}</p>
          <p v-if="data?.online && data.connectedAt" class="text-xs text-muted-foreground">
            sinds {{ time(data.connectedAt) }}
          </p>
        </div>
      </div>
    </header>

    <div v-if="error" class="min-w-0 break-words rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      {{ error }}
    </div>

    <section class="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm">
      <div class="flex items-center justify-between border-b px-4 py-3">
        <div class="flex items-center gap-2">
          <Icon name="lucide:route" class="size-4 text-primary" />
          <h2 class="font-semibold">Routing</h2>
        </div>
        <span class="flex items-center gap-1 text-xs text-muted-foreground">
          {{ data?.state?.preset ?? 'onbekend' }}
          <Icon v-if="busy" name="lucide:loader-circle" class="size-3 animate-spin" />
        </span>
      </div>

      <div v-if="!data?.online" class="p-6 text-center text-sm text-muted-foreground">
        Het apparaat is offline; de routing kan niet worden aangepast.
      </div>

      <div v-else class="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
        <button
          v-for="preset in PRESETS"
          :key="preset.id"
          type="button"
          class="min-w-0 rounded-xl border bg-card p-3 text-left transition hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          :class="data?.state?.preset === preset.id && 'border-primary bg-primary/5 ring-1 ring-primary'"
          :disabled="busy || !availablePresets.has(preset.id) || data?.state?.preset === preset.id"
          :aria-pressed="data?.state?.preset === preset.id"
          @click="setPreset(preset.id)"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <span class="block font-semibold">{{ preset.title }}</span>
              <span class="mt-0.5 block text-xs text-muted-foreground">{{ preset.description }}</span>
            </div>
            <Icon
              v-if="data?.state?.preset === preset.id"
              name="lucide:check"
              class="size-4 shrink-0 text-primary"
            />
          </div>
          <svg viewBox="0 0 200 52" class="mt-3 h-12 w-full" aria-hidden="true">
            <text x="0" y="17" class="fill-muted-foreground" font-size="9">{{ INPUT_A }}</text>
            <text x="0" y="45" class="fill-muted-foreground" font-size="9">{{ INPUT_B }}</text>
            <text x="200" y="17" text-anchor="end" class="fill-muted-foreground" font-size="9">{{ OUTPUT_A }}</text>
            <text x="200" y="45" text-anchor="end" class="fill-muted-foreground" font-size="9">{{ OUTPUT_B }}</text>
            <line
              v-for="(connection, index) in preset.connections"
              :key="index"
              x1="35"
              x2="140"
              :y1="connection.input === 'A' ? 14 : 42"
              :y2="connection.output === 'A' ? 14 : 42"
              :stroke="lineColor[connection.input]"
              stroke-width="2.5"
              stroke-linecap="round"
            />
            <circle cx="35" cy="14" r="3" fill="#0ea5e9" />
            <circle cx="35" cy="42" r="3" fill="#f59e0b" />
            <circle cx="140" cy="14" r="3" class="fill-foreground" />
            <circle cx="140" cy="42" r="3" class="fill-foreground" />
          </svg>
        </button>
      </div>
    </section>

    <DeviceDebugpanel v-if="isAdmin" :state="data?.state ?? null" />
  </div>
</template>