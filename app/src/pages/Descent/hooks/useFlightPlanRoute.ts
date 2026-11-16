import { useEffect, useRef, useState } from 'react'
import {
  buildRoute,
  collectRouteFixes,
  fixesToLoad,
  icaoKey,
  isSamePlan,
  type PlanRoute,
  planCruiseFt,
  type RouteWaypoint,
} from '~/pages/Descent/domain'
import { type NavDataSession, type NavFlightPlanRoute, useNavData } from '~/sim'

export interface LoadedRoute {
  plan: PlanRoute
  waypoints: RouteWaypoint[]
  totalNm: number
  /** The plan's cruise altitude; undefined when it has none. */
  cruiseFt: number | undefined
  missingFixes: string[]
  missingProcedures: string[]
}

export type RouteState =
  | { status: 'unavailable' } // no sim: nothing to read the flight plan from
  | { status: 'loading' }
  | { status: 'none' } // the sim has no flight plan
  | { status: 'ready'; route: LoadedRoute }

/** Loads the airports and fixes a plan needs from the sim and builds the route. */
async function resolveRoute(
  session: NavDataSession,
  plan: NavFlightPlanRoute,
): Promise<LoadedRoute> {
  const [departure, destination] = await Promise.all([
    plan.departureAirport.ident ? session.loadAirport(plan.departureAirport) : null,
    plan.destinationAirport.ident ? session.loadAirport(plan.destinationAirport) : null,
  ])
  const { fixes, missingProcedures } = collectRouteFixes(plan, departure, destination)

  const icaos = fixesToLoad(fixes)
  const facilities = await Promise.all(icaos.map((icao) => session.loadFacility(icao)))
  const positions = new Map(icaos.map((icao, i) => [icaoKey(icao), facilities[i]]))
  const built = buildRoute(fixes, (icao) => {
    const facility = positions.get(icaoKey(icao))
    return facility ? { lat: facility.lat, lon: facility.lon } : undefined
  })

  return {
    plan,
    waypoints: built.waypoints,
    totalNm: built.totalNm,
    cruiseFt: planCruiseFt(plan),
    missingFixes: built.missingFixes,
    missingProcedures,
  }
}

/**
 * The last route loaded, kept for the whole sim session (outside React, so it survives tab
 * switches and closing the panel; a few KB, no work while idle). Reopening the tab shows it
 * at once instead of a loader.
 */
let cache: { plan: NavFlightPlanRoute | null; state: RouteState } | undefined

/**
 * The sim's flight plan (EFB / World Map) as a positioned route with procedure limits.
 * Loaded the first time it's needed and cached. On later visits the cached route shows at
 * once, and the plan is read again in the background (one request, no loader) in case it
 * was changed while the panel was closed; airports and fixes are only loaded again when it
 * did. While open, the sim's change events load it again in full, as does `reload`. Nothing
 * is polled.
 */
export function useFlightPlanRoute() {
  const session = useNavData()
  const [state, setState] = useState<RouteState>(() => cache?.state ?? { status: 'loading' })
  // Reads the plan again; set by the effect for the open session. `force` skips the cache.
  const readAgain = useRef<(force: boolean) => void>(undefined)

  useEffect(() => {
    if (!session) return
    let cancelled = false
    let generation = 0

    const publish = (plan: NavFlightPlanRoute | null, next: RouteState) => {
      cache = { plan, state: next }
      setState(next)
    }

    const load = async (plan: NavFlightPlanRoute | null, force = false) => {
      const mine = ++generation
      if (!plan) {
        publish(null, { status: 'none' })
        return
      }
      if (!force && cache?.plan && cache.state.status === 'ready' && isSamePlan(cache.plan, plan)) {
        setState(cache.state)
        return
      }
      // Keep showing the old route while a changed one loads.
      setState((prev) => (prev.status === 'ready' ? prev : { status: 'loading' }))
      try {
        const route = await resolveRoute(session, plan)
        if (!cancelled && mine === generation) publish(plan, { status: 'ready', route })
      } catch {
        if (!cancelled && mine === generation) publish(null, { status: 'none' })
      }
    }

    const read = (force: boolean) => {
      void session.getFlightPlan().then((plan) => {
        if (!cancelled) void load(plan, force)
      })
    }
    read(false)
    readAgain.current = read
    const unsubscribe = session.onFlightPlanChanged((plan) => void load(plan, true))
    return () => {
      cancelled = true
      readAgain.current = undefined
      unsubscribe()
    }
  }, [session])

  return {
    state: session === null ? ({ status: 'unavailable' } as const) : state,
    reload: () => {
      setState({ status: 'loading' })
      readAgain.current?.(true)
    },
  }
}
