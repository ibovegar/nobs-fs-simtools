import { usePersistentState } from '~/storage'

/** The In flight page's tools: simple calculator, TOD from the flight plan, glideslope. */
export type InFlightTool = 'calc' | 'plan' | 'gs'

/**
 * Which In flight tool (tab) is open. Saved immediately, so reopening SimTools returns
 * to the same one.
 */
export function useInFlightTool() {
  return usePersistentState<InFlightTool>('inflight.tool.v2', 'calc', { debounceMs: 0 })
}
