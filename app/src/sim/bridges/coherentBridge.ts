import type { SimBridge } from '../SimBridge'
import { getSimVar } from '../simGlobals'

/** Reads live values from MSFS through the sim's `SimVar` API. */
export function createCoherentBridge(): SimBridge {
  return {
    source: 'sim',
    read({ name, unit }) {
      try {
        const value = getSimVar()?.GetSimVarValue(name, unit)
        return typeof value === 'number' && Number.isFinite(value) ? value : undefined
      } catch {
        return undefined
      }
    },
  }
}
