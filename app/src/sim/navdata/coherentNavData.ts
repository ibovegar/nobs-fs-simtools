import { getRegisterViewListener } from '../simGlobals'
import { facilityIcao, icaoKey, isEmptyRoute } from './icao'
import type { NavData, NavDataSession } from './NavData'
import type { NavAirport, NavFacility, NavFlightPlanRoute, NavIcao } from './navTypes'

// MSFS 2024 SDK: JS_LISTENER_PLANNEDROUTE and JS_LISTENER_FACILITY (LOAD_*_FROM_STRUCT,
// answered by a Send* event). Mirrors how Microsoft's msfs-avionics-mirror
// FlightPlanRouteManager and FacilityLoader use them.
//
// The sim keeps several routes. The EFB's saved route (GET_EFB_ROUTE / EfbRouteUpdated) can
// be empty while the avionics have a plan: the EFB's "Send to avionics" goes to them
// directly (AvionicsRouteSync), and "Send to ATC" files a separate ATC route
// (GET_ATC_ROUTE). So the plan is read from the avionics first (REQUEST_AVIONICS_ROUTE,
// answered by AvionicsRouteRequestResponse when an avionics package replies), then the
// EFB, then ATC.

/** Airport data to load: approaches | departures | arrivals | runways (SDK flags). */
const AIRPORT_DATA_FLAGS = 1 | 2 | 4 | 64

const LOAD_CALLS: Record<string, string> = {
  A: 'LOAD_AIRPORT_FROM_STRUCT',
  V: 'LOAD_VOR_FROM_STRUCT',
  N: 'LOAD_NDB_FROM_STRUCT',
  W: 'LOAD_INTERSECTION_FROM_STRUCT',
}
const FACILITY_EVENTS = ['SendAirport', 'SendIntersection', 'SendVor', 'SendNdb']

/** Give up on a sim answer after this long (missing facility, listener never bound). */
const TIMEOUT_MS = 8000

/** Wait this long for the avionics to answer a route request (they may never). */
const AVIONICS_TIMEOUT_MS = 1500

interface Bound {
  listener: SimViewListener
  ready: Promise<boolean>
}

interface Pending {
  icao: NavIcao
  resolve: (facility: NavFacility | null) => void
  timer: ReturnType<typeof setTimeout>
}

function bind(name: string): Bound | undefined {
  const register = getRegisterViewListener()
  if (!register) return undefined
  try {
    let onReady: (ok: boolean) => void = () => {}
    const ready = new Promise<boolean>((resolve) => {
      onReady = resolve
    })
    const listener = register(name, () => onReady(true))
    setTimeout(() => onReady(false), TIMEOUT_MS)
    return { listener, ready }
  } catch {
    return undefined
  }
}

function withTimeout<T>(promise: Promise<T>, fallback: T, ms = TIMEOUT_MS): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      () => {
        clearTimeout(timer)
        resolve(fallback)
      },
    )
  })
}

/** Same facility, ignoring the airport field (terminal fixes may come back without it). */
function looseMatch(a: NavIcao, b: NavIcao) {
  return a.type === b.type && a.region === b.region && a.ident === b.ident
}

/**
 * Reads the flight plan and navigation database through the sim's Coherent listeners.
 * Listeners are registered on the first `open()` and unregistered on the last `close()`.
 */
export function createCoherentNavData(): NavData {
  let sessions = 0
  let route: Bound | undefined
  let facility: Bound | undefined
  const routeSubscribers = new Set<(route: NavFlightPlanRoute | null) => void>()
  const pending = new Map<string, Pending>()
  const cache = new Map<string, Promise<NavFacility | null>>()

  // Avionics route requests waiting for their answer, by request id.
  const routeRequests = new Map<unknown, (route: NavFlightPlanRoute | null) => void>()

  const onRouteUpdated = (next: NavFlightPlanRoute) => {
    // An empty EFB route doesn't clear a plan the avionics may still have: read again.
    if (isEmptyRoute(next)) {
      void readFlightPlan().then((plan) => {
        for (const subscriber of routeSubscribers) subscriber(plan)
      })
      return
    }
    for (const subscriber of routeSubscribers) subscriber(next)
  }

  const onAvionicsRouteResponse = (next: NavFlightPlanRoute, requestId: unknown) => {
    const resolve = routeRequests.get(requestId)
    if (!resolve) return
    routeRequests.delete(requestId)
    resolve(next)
  }

  /** The avionics' current route, if a package answers the request in time. */
  const requestAvionicsRoute = async (bound: Bound): Promise<NavFlightPlanRoute | null> => {
    try {
      const requestId = await bound.listener.call('REQUEST_AVIONICS_ROUTE')
      const answer = new Promise<NavFlightPlanRoute | null>((resolve) => {
        routeRequests.set(requestId, resolve)
      })
      const route = await withTimeout(answer, null, AVIONICS_TIMEOUT_MS)
      routeRequests.delete(requestId)
      return route
    } catch {
      return null
    }
  }

  const readRoute = async (bound: Bound, call: string) => {
    try {
      return await withTimeout(
        bound.listener.call(call) as Promise<NavFlightPlanRoute | null>,
        null,
      )
    } catch {
      return null
    }
  }

  /** The first non-empty route of: the avionics', the EFB's, the one filed with ATC. */
  const readFlightPlan = async (): Promise<NavFlightPlanRoute | null> => {
    const bound = route
    if (!bound || !(await bound.ready)) return null
    const sources: [string, () => Promise<NavFlightPlanRoute | null>][] = [
      ['avionics', () => requestAvionicsRoute(bound)],
      ['EFB', () => readRoute(bound, 'GET_EFB_ROUTE')],
      ['ATC', () => readRoute(bound, 'GET_ATC_ROUTE')],
    ]
    for (const [source, read] of sources) {
      const plan = await read()
      if (!isEmptyRoute(plan)) {
        // One line per read, for the Coherent debugger when a plan doesn't show.
        console.info(`[SimTools] flight plan from the ${source} route`)
        return plan
      }
    }
    console.info('[SimTools] no flight plan: avionics, EFB and ATC routes are empty')
    return null
  }

  const onFacility = (received: NavFacility & { loadedDataFlags?: number }) => {
    const icao = facilityIcao(received)
    if (!icao) return
    let key = icaoKey(icao)
    if (!pending.has(key)) {
      for (const [k, p] of pending) {
        if (looseMatch(p.icao, icao)) {
          key = k
          break
        }
      }
    }
    if (!pending.has(key)) return
    // An airport answer without the procedures we asked for belongs to someone else.
    if (
      icao.type === 'A' &&
      received.loadedDataFlags !== undefined &&
      (received.loadedDataFlags & AIRPORT_DATA_FLAGS) !== AIRPORT_DATA_FLAGS
    ) {
      return
    }
    settle(key, received)
  }

  const settle = (key: string, value: NavFacility | null) => {
    const waiting = pending.get(key)
    if (!waiting) return
    pending.delete(key)
    clearTimeout(waiting.timer)
    waiting.resolve(value)
  }

  const connect = () => {
    route = bind('JS_LISTENER_PLANNEDROUTE')
    route?.listener.on('EfbRouteUpdated', onRouteUpdated)
    route?.listener.on('AvionicsRouteSync', onRouteUpdated)
    route?.listener.on('AvionicsRouteRequestResponse', onAvionicsRouteResponse)
    facility = bind('JS_LISTENER_FACILITY')
    for (const event of FACILITY_EVENTS) facility?.listener.on(event, onFacility)
  }

  const disconnect = () => {
    try {
      route?.listener.off('EfbRouteUpdated', onRouteUpdated)
      route?.listener.off('AvionicsRouteSync', onRouteUpdated)
      route?.listener.off('AvionicsRouteRequestResponse', onAvionicsRouteResponse)
      route?.listener.unregister()
      for (const event of FACILITY_EVENTS) facility?.listener.off(event, onFacility)
      facility?.listener.unregister()
    } catch {
      // Already gone with the view.
    }
    route = undefined
    facility = undefined
    for (const waiting of pending.values()) {
      clearTimeout(waiting.timer)
      waiting.resolve(null)
    }
    pending.clear()
    for (const resolve of routeRequests.values()) resolve(null)
    routeRequests.clear()
    cache.clear()
    routeSubscribers.clear()
  }

  const request = async (icao: NavIcao): Promise<NavFacility | null> => {
    const call = LOAD_CALLS[icao.type]
    const bound = facility
    if (!call || !bound || !(await bound.ready)) return null

    const key = icaoKey(icao)
    const answer = new Promise<NavFacility | null>((resolve) => {
      const timer = setTimeout(() => settle(key, null), TIMEOUT_MS)
      pending.set(key, { icao, resolve, timer })
    })

    try {
      // The sim's bindings expect the struct tagged with its C++ type.
      const struct = { __Type: 'JS_ICAO', ...icao }
      const found =
        icao.type === 'A'
          ? await bound.listener.call(call, struct, AIRPORT_DATA_FLAGS)
          : await bound.listener.call(call, struct)
      // false = not in the database; the Send* event never comes.
      if (found === false) settle(key, null)
    } catch {
      settle(key, null)
    }
    return answer
  }

  const load = (icao: NavIcao) => {
    const key = icaoKey(icao)
    let promise = cache.get(key)
    if (!promise) {
      promise = request(icao)
      cache.set(key, promise)
    }
    return promise
  }

  return {
    open(): NavDataSession {
      if (sessions++ === 0) connect()
      const mine = new Set<(route: NavFlightPlanRoute | null) => void>()
      let closed = false

      return {
        getFlightPlan: readFlightPlan,
        onFlightPlanChanged(callback) {
          routeSubscribers.add(callback)
          mine.add(callback)
          return () => {
            routeSubscribers.delete(callback)
            mine.delete(callback)
          }
        },
        loadAirport: (icao) => load({ ...icao, type: 'A' }) as Promise<NavAirport | null>,
        loadFacility: load,
        close() {
          if (closed) return
          closed = true
          for (const callback of mine) routeSubscribers.delete(callback)
          if (--sessions === 0) disconnect()
        },
      }
    },
  }
}
