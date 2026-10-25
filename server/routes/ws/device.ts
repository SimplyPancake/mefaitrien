import { createPublicKey, verify } from 'node:crypto'
import { failAllPending, pushEvent } from '~/server/utils/deviceHub'
import { isDeviceLog, isDeviceState, isReply } from '~~/types/device'

const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')
let lastTs = 0

export default defineWebSocketHandler({
  upgrade(request) {
    // the reason is logged server-side only, never sent to the client
    const deny = (why: string) => {
      pushEvent('server', 'warn', `connection denied: ${why}`)
      return new Response('Unauthorized', { status: 401 })
    }
    const { deviceId, devicePubkey } = useRuntimeConfig()
    const id = request.headers.get('x-device-id')
    const tsStr = request.headers.get('x-timestamp')
    const sig = request.headers.get('x-signature')
    const ts = Number(tsStr)

    if (!id || !tsStr || !sig || !Number.isFinite(ts)) return deny('missing or malformed auth headers')
    if (!deviceId || !devicePubkey) return deny('NUXT_DEVICE_ID / NUXT_DEVICE_PUBKEY not configured')
    if (id !== deviceId) return deny(`unknown device id "${id}"`)
    const skew = Date.now() - ts
    if (Math.abs(skew) > 120_000) return deny(`clock skew ${Math.round(skew / 1000)} s (device clock wrong?)`)
    if (ts <= lastTs) return deny('replayed or out-of-order timestamp')

    const key = createPublicKey({
      key: Buffer.concat([SPKI_PREFIX, Buffer.from(devicePubkey, 'base64')]),
      format: 'der',
      type: 'spki',
    })
    if (!verify(null, Buffer.from(`${tsStr}\n${id}\nws`), key, Buffer.from(sig, 'base64'))) {
      return deny('bad signature (wrong key registered?)')
    }
    lastTs = ts
  },

  open(peer) {
    const old = deviceHub.peer
    deviceHub.peer = peer
    deviceHub.connectedAt = Date.now()
    old?.close()
    pushEvent('server', 'info', 'device connected')
  },

  message(_peer, message) {
    let data: unknown
    try {
      data = message.json<unknown>()
    } catch {
      pushEvent('server', 'warn', 'malformed JSON from device')
      return
    }

    if (isDeviceState(data)) {
      deviceHub.state = data
      deviceHub.lastSeen = Date.now()
    } else if (isReply(data)) {
      const p = deviceHub.pending.get(data.id)
      if (p) {
        clearTimeout(p.timer)
        deviceHub.pending.delete(data.id)
        p.resolve(data)
      } else {
        pushEvent('server', 'warn', `reply for unknown/expired command ${data.id}`)
      }
    } else if (isDeviceLog(data)) {
      pushEvent('device', data.level, data.msg)
    } else {
      pushEvent('server', 'warn', 'unrecognised message from device')
    }
  },

  close(peer) {
    if (deviceHub.peer?.id === peer.id) {
      deviceHub.peer = null
      failAllPending('device disconnected')
      pushEvent('server', 'warn', 'device disconnected')
    }
  },
})