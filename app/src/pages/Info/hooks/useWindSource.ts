import type { AirportCandidate } from '~/pages/Info/domain'
import { usePersistentState } from '~/storage'

export type WindSource = 'aircraft' | 'airport'

interface WindSourceState {
  source: WindSource
  /** The last airport picked; kept when switching back to the aircraft. */
  airport: AirportCandidate | null
}

const DEFAULT_SOURCE: WindSourceState = { source: 'aircraft', airport: null }

/**
 * Whose wind the wind card shows: the aircraft's, or a picked airport's. Saved at once, so
 * reopening SimTools shows the same.
 */
export function useWindSource() {
  const [stored, setStored] = usePersistentState<WindSourceState>('info.wind.v1', DEFAULT_SOURCE, {
    debounceMs: 0,
  })
  const state: WindSourceState = { ...DEFAULT_SOURCE, ...stored }
  const airport = state.airport
  const source: WindSource = state.source === 'airport' && airport ? 'airport' : 'aircraft'

  return {
    source,
    airport,
    showAircraft: () => setStored((prev) => ({ ...prev, source: 'aircraft' })),
    showAirport: (picked: AirportCandidate) => setStored({ source: 'airport', airport: picked }),
  }
}
