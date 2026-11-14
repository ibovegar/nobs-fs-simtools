import { usePersistentState } from '~/storage'

/** The Descent page's two tools: top-of-descent planner and glideslope. */
export type DescentTool = 'tod' | 'gs'

/**
 * Which Descent tool (tab) is open. Saved immediately, so reopening SimTools returns
 * to the same one.
 */
export function useDescentTool() {
  return usePersistentState<DescentTool>('descent.tool.v1', 'tod', { debounceMs: 0 })
}
