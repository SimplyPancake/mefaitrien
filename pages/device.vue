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
</script>

<template>
  <div class="space-y-4 p-4">
    <h1 class="text-2xl font-bold">DSP device</h1>
    <p>
      {{ data?.online ? 'Online' : 'Offline' }}
      <span v-if="data?.online && data.connectedAt"> · connected since {{ time(data.connectedAt) }}</span>
    </p>

    <section v-if="data?.online && data.state" class="space-y-2">
      <p>Routing: {{ data.state.preset ?? 'unknown' }}</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="p in data.state.presets"
          :key="p"
          :disabled="busy || p === data.state.preset"
          @click="setPreset(p)"
        >
          {{ p }}
        </button>
      </div>
      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
    </section>

    <DeviceDebugpanel v-if="isAdmin" :state="data?.state ?? null" />
  </div>
</template>