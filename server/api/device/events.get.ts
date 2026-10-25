import type { DebugEvent } from '~~/types/device'

export default defineEventHandler((): { events: DebugEvent[] } => ({ events: deviceHub.events }))