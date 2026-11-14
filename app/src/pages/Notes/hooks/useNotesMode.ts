import { usePersistentState } from '~/storage'

export type NotesMode = 'draw' | 'atc' | 'text'

/**
 * Which note mode is open (Draw / ATC / Text). Saved immediately, so reopening
 * SimTools — even after a sim restart — returns to the same mode.
 */
export function useNotesMode() {
  return usePersistentState<NotesMode>('scratchpad.mode.v1', 'draw', { debounceMs: 0 })
}
