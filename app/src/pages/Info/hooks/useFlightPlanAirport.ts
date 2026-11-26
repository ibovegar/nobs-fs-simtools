import { useEffect, useState } from 'react'
import {
  type AirportCandidate,
  flightPlanAirportNow,
  type PlanAirport,
  planAirportKey,
  planRunwayName,
} from '~/pages/Info/domain'
import { type NavFlightPlanRoute, useNavData, useSimVars } from '~/sim'
import { usePersistentState } from '~/storage'

const POSITION_SIM_VARS = {
  lat: { name: 'PLANE LATITUDE', unit: 'degrees' },
  lon: { name: 'PLANE LONGITUDE', unit: 'degrees' },
}
/** Leaving the departure airport is slow: checking every 5 s is plenty. */
const POSITION_HZ = 0.2

interface PlanAirports {
  departure: PlanAirport | undefined
  destination: PlanAirport | undefined
}

/** The flight plan's two airports and their runways. */
function planAirports(route: NavFlightPlanRoute | null): PlanAirports | undefined {
  if (!route) return undefined
  const airport = (ident: string | undefined, runway: NavFlightPlanRoute['departureRunway']) =>
    ident ? { ident, runway: planRunwayName(runway) } : undefined
  return {
    departure: airport(route.departureAirport?.ident, route.departureRunway),
    destination: airport(route.destinationAirport?.ident, route.destinationRunway),
  }
}

/**
 * Follows the sim's flight plan on the wind card: its departure airport and runway while
 * the aircraft is there, then its destination and runway once it's 10 nm away. Each change
 * is shown once (`show`), so the pilot's own pick in between stays, also after reopening.
 * The aircraft's position is read every 5 s, only while there is a flight plan.
 */
export function useFlightPlanAirport(show: (airport: AirportCandidate) => void) {
  const session = useNavData()
  const [plan, setPlan] = useState<PlanAirports>()
  const [summaries, setSummaries] = useState<Record<string, AirportCandidate>>({})
  const [shown, setShown] = usePersistentState('info.wind.planAirport.v1', '', { debounceMs: 0 })

  useEffect(() => {
    if (!session) return
    let current = true
    const take = (route: NavFlightPlanRoute | null) => {
      if (current) setPlan(planAirports(route))
    }
    void session.getFlightPlan().then(take)
    const unsubscribe = session.onFlightPlanChanged(take)
    return () => {
      current = false
      unsubscribe()
    }
  }, [session])

  // The plan's airports' names and positions (cheap loads, kept by the sim connection).
  const departureIdent = plan?.departure?.ident
  const destinationIdent = plan?.destination?.ident
  useEffect(() => {
    if (!session) return
    let current = true
    for (const ident of [departureIdent, destinationIdent]) {
      if (!ident) continue
      void session
        .loadAirportSummary({ type: 'A', region: '', airport: '', ident })
        .then((summary) => {
          if (!current || !summary) return
          const candidate = { ident, name: summary.name, lat: summary.lat, lon: summary.lon }
          setSummaries((prev) => (prev[ident] ? prev : { ...prev, [ident]: candidate }))
        })
    }
    return () => {
      current = false
    }
  }, [session, departureIdent, destinationIdent])

  const sim = useSimVars(POSITION_SIM_VARS, plan ? POSITION_HZ : 0)
  const departureSummary = departureIdent ? summaries[departureIdent] : undefined
  // With a departure, wait for its position before deciding (else it would skip to the
  // destination).
  const waiting = departureIdent !== undefined && !departureSummary
  const aircraft =
    sim.lat !== undefined && sim.lon !== undefined ? { lat: sim.lat, lon: sim.lon } : undefined
  const target = waiting
    ? undefined
    : flightPlanAirportNow(
        plan?.departure && departureSummary && { ...plan.departure, ...departureSummary },
        plan?.destination,
        aircraft,
      )
  const targetSummary = target ? summaries[target.ident] : undefined
  const targetKey = target ? planAirportKey(target) : undefined

  useEffect(() => {
    if (!target || !targetSummary || targetKey === undefined || targetKey === shown) return
    setShown(targetKey)
    show({ ...targetSummary, runway: target.runway })
  }, [target, targetSummary, targetKey, shown, setShown, show])
}
