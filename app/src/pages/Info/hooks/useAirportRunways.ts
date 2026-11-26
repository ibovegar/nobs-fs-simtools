import { useEffect, useState } from 'react'
import type { AirportCandidate, RunwayInput } from '~/pages/Info/domain'
import { useNavData } from '~/sim'

const NO_RUNWAYS: readonly RunwayInput[] = []

/**
 * The runways of the airport shown on the wind card, loaded once when it's picked (the sim
 * connection keeps loaded airports). None without an airport, or until they're loaded.
 */
export function useAirportRunways(airport: AirportCandidate | null): readonly RunwayInput[] {
  const session = useNavData()
  const ident = airport?.ident
  const [loaded, setLoaded] = useState<{ ident: string; runways: readonly RunwayInput[] }>()

  useEffect(() => {
    if (!ident || !session) return
    let current = true
    // Airports are identified by their code alone (no region).
    void session.loadAirport({ type: 'A', region: '', airport: '', ident }).then((found) => {
      if (current) setLoaded({ ident, runways: found?.runways ?? NO_RUNWAYS })
    })
    return () => {
      current = false
    }
  }, [ident, session])

  return loaded && loaded.ident === ident ? loaded.runways : NO_RUNWAYS
}
