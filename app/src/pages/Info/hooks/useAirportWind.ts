import { useEffect, useState } from 'react'
import type { AirportCandidate, MetarState } from '~/pages/Info/domain'
import { useNavData } from '~/sim'

/** METARs are issued every half hour or hour: asking every 10 min is plenty. */
const REFRESH_MS = 10 * 60 * 1000

/**
 * The METAR of the airport shown on the wind card, read when it's picked and every 10 min
 * while it is shown. Nothing runs without an airport.
 */
export function useAirportWind(airport: AirportCandidate | null): MetarState {
  const session = useNavData()
  const ident = airport?.ident
  const [state, setState] = useState<{ ident: string | undefined; metar: MetarState }>({
    ident: undefined,
    metar: { status: 'loading' },
  })

  useEffect(() => {
    if (!ident || !session) return
    let current = true
    const read = () => {
      void session.getMetar(ident).then((metar) => {
        if (!current) return
        setState({ ident, metar: metar ? { status: 'ready', metar } : { status: 'none' } })
      })
    }
    read()
    const timer = setInterval(read, REFRESH_MS)
    return () => {
      current = false
      clearInterval(timer)
    }
  }, [ident, session])

  if (session === null) return { status: 'none' }
  // Another airport than the one read: its METAR is on its way.
  return state.ident === ident ? state.metar : { status: 'loading' }
}
