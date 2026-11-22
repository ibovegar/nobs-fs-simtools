import { logLine } from '~/diagnostics'
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

/** After an empty route event made us read again, ignore further ones for this long. */
const REREAD_PAUSE_MS = 5000

interface Bound {
  listener: SimViewListener
  ready: Promise<boolean>
}

interface Pending {
  icao: NavIcao
  resolve: (facility: NavFacility | null) => void
  timer: ReturnType<typeof setTimeout>
}

interface BindOptions {
  /** Share one listener of this name per view. */
  singleton?: boolean
  /**
   * Wait this long after the sim says the listener is bound before using it. Microsoft's
   * FacilityLoader waits 2 s for JS_LISTENER_FACILITY: requests sent sooner get no answer.
   */
  settleMs?: number
}

function bind(name: string, options: BindOptions = {}): Bound | undefined {
  const { singleton = false, settleMs = 0 } = options
  const register = getRegisterViewListener()
  if (!register) return undefined
  try {
    let onReady: (ok: boolean) => void = () => {}
    const ready = new Promise<boolean>((resolve) => {
      onReady = resolve
    })
    const started = Date.now()
    const listener = register(
      name,
      () => {
        logLine(`${name} bound (${Date.now() - started} ms)`)
        setTimeout(() => onReady(true), settleMs)
      },
      singleton,
    )
    setTimeout(() => onReady(false), TIMEOUT_MS + settleMs)
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

function describeIcao(icao: NavIcao) {
  return `${icao.type} ${icao.ident}${icao.airport ? ` (${icao.airport})` : ''}`
}

/** One line about a route for the log: what came back from the sim. */
function describeRoute(plan: NavFlightPlanRoute | null) {
  if (!plan) return 'none'
  const dep = plan.departureAirport?.ident || '?'
  const dest = plan.destinationAirport?.ident || '?'
  const procedures = [plan.departure, plan.arrival, plan.approach?.type].filter(Boolean)
  const named = procedures.length > 0 ? `, ${procedures.join(' / ')}` : ''
  return `${dep} → ${dest}, ${plan.enroute?.length ?? 0} enroute legs${named}`
}

/**
 * Same facility, ignoring the airport field (terminal fixes may come back without it). An
 * airport's ident is unique on its own: the route names it without a region, and the
 * answer may come back with one.
 */
function looseMatch(a: NavIcao, b: NavIcao) {
  if (a.type !== b.type || a.ident.trim() !== b.ident.trim()) return false
  return a.type === 'A' || a.region === b.region
}

let instance: NavData | undefined

/**
 * Reads the flight plan and navigation database through the sim's Coherent listeners.
 *
 * One instance per panel (the app may remount, e.g. once the sim's storage is ready). The
 * listeners are registered on the first `open()` and then kept, as Microsoft's own
 * FlightPlanRouteManager and FacilityLoader do: never unregistered. Unregistering a
 * listener while the sim still owes it an answer (a route or facility request in flight)
 * crashed the sim. A registered listener costs nothing while nobody calls it, so the
 * last `close()` only drops the subscribers.
 */
export function createCoherentNavData(): NavData {
  instance ??= buildCoherentNavData()
  return instance
}

function buildCoherentNavData(): NavData {
  let route: Bound | undefined
  let facility: Bound | undefined
  const routeSubscribers = new Set<(route: NavFlightPlanRoute | null) => void>()
  const pending = new Map<string, Pending>()
  const cache = new Map<string, Promise<NavFacility | null>>()

  // Avionics route requests waiting for their answer, by request id.
  const routeRequests = new Map<unknown, (route: NavFlightPlanRoute | null) => void>()

  // When an empty route event last made us read again. Reading asks the avionics for their
  // route, which may itself send a route event: without a pause the two could keep
  // triggering each other and flood the sim.
  let rereadAt = Number.NEGATIVE_INFINITY
  let rereading = false

  const onRouteUpdated = (next: NavFlightPlanRoute) => {
    logLine(`route changed in the sim: ${describeRoute(next)}`)
    // An empty EFB route doesn't clear a plan the avionics may still have: read again.
    if (isEmptyRoute(next)) {
      const now = Date.now()
      if (rereading || now - rereadAt < REREAD_PAUSE_MS) {
        logLine('empty route event ignored (read again moments ago)')
        return
      }
      rereading = true
      rereadAt = now
      void readFlightPlanOnce().then((plan) => {
        rereading = false
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
      logLine('calling REQUEST_AVIONICS_ROUTE')
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
      logLine(`calling ${call}`)
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
    if (!bound || !(await bound.ready)) {
      logLine('flight plan listener not ready')
      return null
    }
    const sources: [string, () => Promise<NavFlightPlanRoute | null>][] = [
      ['avionics', () => requestAvionicsRoute(bound)],
      ['EFB', () => readRoute(bound, 'GET_EFB_ROUTE')],
      ['ATC', () => readRoute(bound, 'GET_ATC_ROUTE')],
    ]
    for (const [source, read] of sources) {
      const started = Date.now()
      const plan = await read()
      const took = Date.now() - started
      if (!isEmptyRoute(plan)) {
        logLine(`flight plan from the ${source} route (${took} ms): ${describeRoute(plan)}`)
        return plan
      }
      logLine(`${source} route empty (${took} ms)`)
    }
    logLine('no flight plan: avionics, EFB and ATC routes are empty')
    return null
  }

  // A read in progress: callers at the same moment (e.g. a remount) share it, so the sim
  // gets one set of requests.
  let reading: Promise<NavFlightPlanRoute | null> | undefined
  const readFlightPlanOnce = () => {
    reading ??= readFlightPlan().then(
      (plan) => {
        reading = undefined
        return plan
      },
      () => {
        reading = undefined
        return null
      },
    )
    return reading
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
    if (!pending.has(key)) {
      logLine(`facility answer not asked for: ${describeIcao(icao)}`)
      return
    }
    // An airport answer without the procedures we asked for belongs to someone else.
    if (
      icao.type === 'A' &&
      received.loadedDataFlags !== undefined &&
      (received.loadedDataFlags & AIRPORT_DATA_FLAGS) !== AIRPORT_DATA_FLAGS
    ) {
      logLine(`${describeIcao(icao)} answered without the procedures (${received.loadedDataFlags})`)
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

  let connected = false
  const connect = () => {
    if (connected) return
    connected = true
    logLine('registering the flight plan and facility listeners')
    route = bind('JS_LISTENER_PLANNEDROUTE')
    route?.listener.on('EfbRouteUpdated', onRouteUpdated)
    route?.listener.on('AvionicsRouteSync', onRouteUpdated)
    route?.listener.on('AvionicsRouteRequestResponse', onAvionicsRouteResponse)
    facility = bind('JS_LISTENER_FACILITY', { singleton: true, settleMs: 2000 })
    for (const event of FACILITY_EVENTS) facility?.listener.on(event, onFacility)
  }

  const request = async (icao: NavIcao): Promise<NavFacility | null> => {
    const call = LOAD_CALLS[icao.type]
    const bound = facility
    if (!call || !bound) return null
    if (!(await bound.ready)) {
      logLine(`facility listener not ready: ${describeIcao(icao)} not loaded`)
      return null
    }

    const key = icaoKey(icao)
    const answer = new Promise<NavFacility | null>((resolve) => {
      const timer = setTimeout(() => {
        logLine(`no answer for ${describeIcao(icao)} after ${TIMEOUT_MS / 1000} s`)
        settle(key, null)
      }, TIMEOUT_MS)
      pending.set(key, { icao, resolve, timer })
    })

    try {
      // The sim's bindings expect exactly the C++ struct: tagged with its type, four strings
      // (never undefined or extra fields copied from whatever object the icao came from).
      const struct = {
        __Type: 'JS_ICAO',
        type: String(icao.type ?? ''),
        region: String(icao.region ?? ''),
        airport: String(icao.airport ?? ''),
        ident: String(icao.ident ?? ''),
      }
      logLine(`calling ${call} ${JSON.stringify(struct)}`)
      const found =
        icao.type === 'A'
          ? await bound.listener.call(call, struct, AIRPORT_DATA_FLAGS)
          : await bound.listener.call(call, struct)
      // false = not in the database; the Send* event never comes.
      if (found === false) {
        logLine(`${describeIcao(icao)} not in the database`)
        settle(key, null)
      }
    } catch (error) {
      logLine(`loading ${describeIcao(icao)} failed: ${String(error)}`)
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
      // Only found facilities stay cached: a miss (e.g. a timeout) is asked again next time.
      void promise.then((found) => {
        if (!found) cache.delete(key)
      })
    }
    return promise
  }

  return {
    open(): NavDataSession {
      connect()
      const mine = new Set<(route: NavFlightPlanRoute | null) => void>()
      let closed = false

      return {
        getFlightPlan: readFlightPlanOnce,
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
        },
      }
    },
  }
}
