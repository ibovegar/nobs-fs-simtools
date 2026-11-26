import { AIRCRAFT, descentSpeedKias, detectAircraft, trueAirspeedKt } from '~/aircraft'
import { type MockFlightState, type MockRoutePath, mockAircraft } from '~/dev/domain'
import { rateForAngle } from '~/pages/InFlight/domain'
import { planFlight } from '~/pages/InFlight/hooks'
import type { KeyValueStorage } from '~/storage'

/** Where useFlightPlanProfile saves the pilot's TOD reference pick. */
const TOD_REFERENCE_KEY = 'inflight.plan.todRef.v1'

/** Without the aircraft's own descent speed (a generic descent). */
const FALLBACK_DESCENT_KIAS = 250

/**
 * The mock aircraft at the TOD the app plans for this route and aircraft (the app's own
 * planning, so the two always agree), set up to descend: at the cruise altitude, at the
 * descent speed (no wind: groundspeed = TAS), with the planned descent's V/S and the
 * altitude it's planned to selected. Paused: press Fly to start down.
 */
export function mockDescentStart(
  state: MockFlightState,
  path: MockRoutePath,
  referenceKey: string | undefined,
): Partial<MockFlightState> {
  const mock = mockAircraft(state.aircraftId)
  const aircraft = detectAircraft(AIRCRAFT, mock.title, mock.atcModel)
  const plan = planFlight(path, aircraft, referenceKey)
  const { todNm, topFt } = plan.profile
  const kias =
    (aircraft?.performance && descentSpeedKias(aircraft.performance, topFt)) ??
    FALLBACK_DESCENT_KIAS
  const groundSpeedKt = Math.round(trueAirspeedKt(kias, topFt))
  const last = path.waypoints[path.waypoints.length - 1]
  const targetFt = plan.reference.altitudeFt ?? last?.elevationFt ?? 0

  return {
    running: false,
    routeProgressNm: todNm,
    altitudeFt: topFt,
    groundSpeedKt,
    verticalSpeedFpm: -Math.round(rateForAngle(groundSpeedKt, plan.basis.descentAngleDeg)),
    selectedAltitudeFt: Math.round(targetFt),
  }
}

/** The app's saved TOD reference pick (In flight › Flight plan), or undefined for the default. */
export function storedTodReference(storage: KeyValueStorage): string | undefined {
  try {
    const key: unknown = JSON.parse(storage.getItem(TOD_REFERENCE_KEY) ?? '""')
    return typeof key === 'string' && key !== '' ? key : undefined
  } catch {
    return undefined
  }
}
