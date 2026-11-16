import { createCoherentNavData } from '../navdata'
import type { SimBridge } from '../SimBridge'
import { getSimVar } from '../simGlobals'

/**
 * Reads live values from MSFS through the sim's `SimVar` API, and the flight plan and
 * navigation database through its Coherent listeners.
 */
export function createCoherentBridge(): SimBridge {
  return {
    source: 'sim',
    navData: createCoherentNavData(),
    read({ name, unit }) {
      try {
        const value = getSimVar()?.GetSimVarValue(name, unit)
        return typeof value === 'number' && Number.isFinite(value) ? value : undefined
      } catch {
        return undefined
      }
    },
    readText(name) {
      try {
        const value = getSimVar()?.GetSimVarValue(name, 'string')
        return typeof value === 'string' && value.trim() !== '' ? value : undefined
      } catch {
        return undefined
      }
    },
  }
}
