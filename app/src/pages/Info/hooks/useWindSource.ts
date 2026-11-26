import type { AirportCandidate } from '~/pages/Info/domain'
import { usePersistentState } from '~/storage'

export type WindSource = 'aircraft' | 'airport'

interface WindSourceState {
  source: WindSource
  /** The last airport picked; kept when switching back to the aircraft. */
  airport: AirportCandidate | null
  /** The aircraft's wind is drawn heading up (else north up). */
  headingUp: boolean
}

const DEFAULT_SOURCE: WindSourceState = { source: 'aircraft', airport: null, headingUp: false }

/**
 * Whose wind the wind card shows: the aircraft's, or a picked airport's; and whether the
 * aircraft's is drawn heading up. Saved at once, so reopening SimTools shows the same.
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
    headingUp: state.headingUp,
    setHeadingUp: (headingUp: boolean) => setStored((prev) => ({ ...prev, headingUp })),
    showAircraft: () => setStored((prev) => ({ ...prev, source: 'aircraft' })),
    showAirport: (picked: AirportCandidate) =>
      setStored((prev) => ({ ...prev, source: 'airport', airport: picked })),
  }
}
