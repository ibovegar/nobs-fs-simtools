import { useEffect, useState } from 'react'
import { useSim } from '~/providers/SimProvider'
import type { SimBridge } from '../SimBridge'

/** Names of text sim variables to read, keyed by what the caller calls them. */
export type SimTextMap = Record<string, string>
export type SimTexts<T extends SimTextMap> = { [K in keyof T]: string | undefined }

function readAll<T extends SimTextMap>(bridge: SimBridge, vars: T): SimTexts<T> {
  const out = {} as SimTexts<T>
  for (const key of Object.keys(vars) as (keyof T)[]) {
    out[key] = bridge.readText(vars[key] as string)
  }
  return out
}

/**
 * Poll text sim variables (e.g. the aircraft `TITLE`) at `hz` (default 1 Hz: they rarely
 * change). Like `useSimVars`, define `vars` at module level and expect `undefined` when
 * there is no sim. Polling pauses while the panel is closed.
 */
export function useSimText<T extends SimTextMap>(vars: T, hz = 1): SimTexts<T> {
  const { bridge, panelVisible } = useSim()
  const [values, setValues] = useState(() => readAll(bridge, vars))

  useEffect(() => {
    if (!panelVisible) return
    const poll = () =>
      setValues((prev) => {
        const next = readAll(bridge, vars)
        return Object.keys(next).every((k) => prev[k] === next[k]) ? prev : next
      })
    poll()
    const id = setInterval(poll, 1000 / hz)
    return () => clearInterval(id)
  }, [bridge, vars, hz, panelVisible])

  return values
}
