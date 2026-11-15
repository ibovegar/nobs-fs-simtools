import { usePersistentState } from '~/storage'

/** The Descent page's tools: simple calculator, TOD from the flight plan, glideslope. */
export type DescentTool = 'calc' | 'plan' | 'gs'

/**
 * Which Descent tool (tab) is open. Saved immediately, so reopening SimTools returns
 * to the same one.
 */
export function useDescentTool() {
  return usePersistentState<DescentTool>('descent.tool.v2', 'calc', { debounceMs: 0 })
}
