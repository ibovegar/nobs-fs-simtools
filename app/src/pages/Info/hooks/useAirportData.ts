import { useEffect, useState } from 'react'
import type { AirportCandidate, RunwayInput } from '~/pages/Info/domain'
import { useNavData } from '~/sim'

const NO_RUNWAYS: readonly RunwayInput[] = []

export interface AirportData {
  runways: readonly RunwayInput[]
  /** Metres; undefined until loaded. */
  elevationM: number | undefined
}

const NOT_LOADED: AirportData = { runways: NO_RUNWAYS, elevationM: undefined }

/**
 * The runways and elevation of the wind card's airport, loaded once when it's picked (the
 * sim connection keeps loaded airports). Nothing without an airport, or until loaded.
 */
export function useAirportData(airport: AirportCandidate | null): AirportData {
  const session = useNavData()
  const ident = airport?.ident
  const [loaded, setLoaded] = useState<{ ident: string; data: AirportData }>()

  useEffect(() => {
    if (!ident || !session) return
    let current = true
    // Airports are identified by their code alone (no region).
    void session.loadAirport({ type: 'A', region: '', airport: '', ident }).then((found) => {
      if (!current) return
      const data = found
        ? { runways: found.runways ?? NO_RUNWAYS, elevationM: found.altitude }
        : NOT_LOADED
      setLoaded({ ident, data })
    })
    return () => {
      current = false
    }
  }, [ident, session])

  return loaded && loaded.ident === ident ? loaded.data : NOT_LOADED
}
