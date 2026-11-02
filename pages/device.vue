<script setup lang="ts">
import { DeviceDebugpanel } from '#components'
import { Role } from '~/generated/prisma/enums'
import type { DeviceStatus } from '~~/types/device'

const { $api } = useNuxtApp()
const sessionStore = useSessionStore()
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
const INPUT_B = 'Bluetooth'
const OUTPUT_A = 'Woonkamer'
const OUTPUT_B = 'Keuken'

type Input = 'A' | 'B'

interface RouteOption {
  id: string
  woonkamer: Input
  keuken: Input
}

const ROUTES: RouteOption[] = [
  { id: 'straight', woonkamer: 'A', keuken: 'B' },
  { id: 'a-to-both', woonkamer: 'A', keuken: 'A' },
  { id: 'b-to-both', woonkamer: 'B', keuken: 'B' },
  { id: 'swapped', woonkamer: 'B', keuken: 'A' },
]

const inputIcon: Record<Input, string> = { A: 'lucide:monitor', B: 'lucide:bluetooth' }
const inputLabel: Record<Input, string> = { A: INPUT_A, B: INPUT_B }
const inputColor: Record<Input, string> = { A: '#6b7280', B: '#0ea5e9' }
const availablePresets = computed(() => new Set(data.value?.state?.presets ?? []))

function getRouteDescription(route: RouteOption): string {
  const a = inputLabel[route.woonkamer]
  const b = inputLabel[route.keuken]
  return `${a} → ${OUTPUT_A}, ${b} → ${OUTPUT_B}`
}

function getRouteTitle(route: RouteOption): string {
  if (route.woonkamer === 'A' && route.keuken === 'B') return 'Standaard'
  if (route.woonkamer === 'A' && route.keuken === 'A') return `${INPUT_A} overal`
  if (route.woonkamer === 'B' && route.keuken === 'B') return `${INPUT_B} overal`
  if (route.woonkamer === 'B' && route.keuken === 'A') return 'Omgewisseld'
  return getRouteDescription(route)
}
</script>

<template>
  <div class="flex w-full min-w-0 max-w-full flex-col gap-5 overflow-x-hidden xl:max-w-7xl">
    <header
      class="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-xl border bg-card px-4 py-4 shadow-sm sm:px-5 sm:py-5">
      <div class="flex min-w-0 items-start gap-3">
        <div class="rounded-lg bg-primary/10 p-2.5 text-primary">
          <Icon name="lucide:audio-lines" class="size-5" />
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
      </div>
    </header>

    <div v-if="error"
      class="min-w-0 break-words rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
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

      <div v-else class="p-4 sm:p-5">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button v-for="route in ROUTES" :key="route.id" type="button"
            class="group flex min-h-24 flex-col justify-between rounded-lg border bg-card p-3 text-left transition hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            :class="data?.state?.preset === route.id && 'border-primary bg-primary/5 ring-1 ring-primary'"
            :disabled="busy || !availablePresets.has(route.id) || data?.state?.preset === route.id"
            @click="setPreset(route.id)">
            <div>
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1">
                  <span class="block font-semibold">{{ getRouteTitle(route) }}</span>
                  <span class="mt-1 block text-xs text-muted-foreground">{{ getRouteDescription(route) }}</span>
                </div>
                <Icon v-if="data?.state?.preset === route.id" name="lucide:check" class="size-4 shrink-0 text-primary" />
              </div>
            </div>
            
            <!-- Visual routing diagram -->
            <div class="mt-3 flex items-center justify-between gap-2 text-xs">
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-1.5">
                  <Icon :name="inputIcon[route.woonkamer]" class="size-3.5" :style="{ color: inputColor[route.woonkamer] }" />
                  <span class="font-medium">{{ OUTPUT_A }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <Icon :name="inputIcon[route.keuken]" class="size-3.5" :style="{ color: inputColor[route.keuken] }" />
                  <span class="font-medium">{{ OUTPUT_B }}</span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </section>

    <DeviceDebugpanel v-if="isAdmin" :online="data?.online ?? false" :state="data?.state ?? null" />
  </div>
</template>
