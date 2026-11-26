import { useEffect, useState } from 'react'
import { useSim } from '~/providers/SimProvider'
import type { SimBridge, SimVarSpec } from '../SimBridge'

export type SimVarMap = Record<string, SimVarSpec>
export type SimValues<T extends SimVarMap> = { [K in keyof T]: number | undefined }

function readAll<T extends SimVarMap>(bridge: SimBridge, vars: T): SimValues<T> {
  const out = {} as SimValues<T>
  for (const key of Object.keys(vars) as (keyof T)[]) {
    out[key] = bridge.read(vars[key] as SimVarSpec)
  }
  return out
}

/** Same keys and values: a map of variables that changed never counts as equal. */
export function shallowEqual(a: Record<string, unknown>, b: Record<string, unknown>) {
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((k) => Object.is(a[k], b[k]))
}

/**
 * Poll a set of sim variables at `hz` (default 4 Hz — plenty for these tools and cheap
 * for the sim). Polling pauses while the panel is closed, and `hz` 0 stops it (the values
 * are read once, on mount): for a value only shown some of the time.
 *
 * Define `vars` at module level so its identity is stable:
 *
 * ```ts
 * const VARS = { altitude: { name: 'INDICATED ALTITUDE', unit: 'feet' } }
 * const { altitude } = useSimVars(VARS)
 * ```
 */
export function useSimVars<T extends SimVarMap>(vars: T, hz = 4): SimValues<T> {
  const { bridge, panelVisible } = useSim()
  const [values, setValues] = useState(() => readAll(bridge, vars))

  useEffect(() => {
    if (!panelVisible || hz <= 0) return
    const poll = () =>
      setValues((prev) => {
        const next = readAll(bridge, vars)
        return shallowEqual(prev, next) ? prev : next
      })
    poll()
    const id = setInterval(poll, 1000 / hz)
    return () => clearInterval(id)
  }, [bridge, vars, hz, panelVisible])

  return values
}
