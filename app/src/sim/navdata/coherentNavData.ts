import { getRegisterViewListener } from '../simGlobals'
import { facilityIcao, icaoKey, isEmptyRoute } from './icao'
import type { NavData, NavDataSession } from './NavData'
import type { NavAirport, NavFacility, NavFlightPlanRoute, NavIcao } from './navTypes'

// MSFS 2024 SDK: JS_LISTENER_PLANNEDROUTE (GET_EFB_ROUTE, EfbRouteUpdated) and
// JS_LISTENER_FACILITY (LOAD_*_FROM_STRUCT, answered by a Send* event). Mirrors how
// Microsoft's msfs-avionics-mirror FlightPlanRouteManager and FacilityLoader use them.

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

function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), TIMEOUT_MS)
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

  const onRouteUpdated = (next: NavFlightPlanRoute) => {
    const value = isEmptyRoute(next) ? null : next
    for (const subscriber of routeSubscribers) subscriber(value)
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
    facility = bind('JS_LISTENER_FACILITY')
    for (const event of FACILITY_EVENTS) facility?.listener.on(event, onFacility)
  }

  const disconnect = () => {
    try {
      route?.listener.off('EfbRouteUpdated', onRouteUpdated)
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
        async getFlightPlan() {
          const bound = route
          if (!bound || !(await bound.ready)) return null
          const result = await withTimeout(
            bound.listener.call('GET_EFB_ROUTE') as Promise<NavFlightPlanRoute | null>,
            null,
          )
          return isEmptyRoute(result) ? null : result
        },
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
