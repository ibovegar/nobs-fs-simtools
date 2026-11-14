import type { SimBridge } from '../SimBridge'

/** No simulator: every read is unavailable, so tools fall back to manual input. */
export const offlineBridge: SimBridge = {
  source: 'offline',
  read: () => undefined,
  readText: () => undefined,
}
