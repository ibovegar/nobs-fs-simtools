import { normaliseCallsign } from '~/pages/Info/domain'
import { usePersistentState } from '~/storage'

interface InfoState {
  callsign: string
}

const DEFAULT_INFO: InfoState = { callsign: '' }

/**
 * The flight info the pilot enters once: the callsign. Saved in the sim's storage at once
 * (no debounce), so it survives closing the panel and the sim, even an abrupt exit.
 */
export function useInfo() {
  const [stored, setStored] = usePersistentState<InfoState>('info.v1', DEFAULT_INFO, {
    debounceMs: 0,
  })
  const info: InfoState = { ...DEFAULT_INFO, ...stored }

  return {
    callsign: info.callsign,
    setCallsign: (callsign: string) =>
      setStored((prev) => ({ ...prev, callsign: normaliseCallsign(callsign) })),
  }
}
