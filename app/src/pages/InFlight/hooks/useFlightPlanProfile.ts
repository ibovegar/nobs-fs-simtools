import { useEffect, useRef, useState } from 'react'
import {
  type Aircraft,
  climbGradientFtPerNm,
  climbRateFpm,
  descentGradientFtPerNm,
  descentSpeedKias,
  useSimAircraft,
} from '~/aircraft'
import {
  type AircraftOnRoute,
  angleForGradientDeg,
  climbAnchor,
  computeVerticalProfile,
  type DescentGuidance,
  type DescentReference,
  descentGuidance,
  descentTarget,
  type FlightProgress,
  flightProgress,
  GENERIC_PROFILE_BASIS,
  gradientFtPerNm,
  inClimbWindow,
  MIN_GROUNDSPEED_KT,
  type PlannedWaypoint,
  PROFILE_ASSUMPTIONS,
  type ProfileBasis,
  type ProfileInputs,
  type ProfileView,
  planWaypoints,
  positionOnRoute,
  type RouteWaypoint,
  rateForAngle,
  resolveDescentReference,
  THRESHOLD_HEIGHT_FT,
  type VerticalProfile,
} from '~/pages/InFlight/domain'
import { useSimVars } from '~/sim'
import { usePersistentState } from '~/storage'
import { FLIGHT_PLAN_SIM_VARS } from './inFlightSimVars'
import { useClimbTarget } from './useClimbTarget'
import { type LoadedRoute, useFlightPlanRoute } from './useFlightPlanRoute'

export interface FlightPlanView {
  route: LoadedRoute
  waypoints: PlannedWaypoint<RouteWaypoint>[]
  profile: VerticalProfile
  /** The fix the descent from cruise (TOD) is planned to. */
  reference: DescentReference
  cruiseFt: number
  /** False when the plan has no cruise altitude and the fallback is assumed. */
  cruiseFromPlan: boolean
  /** The climb and descent the profile is planned with: the aircraft's, or generic. */
  basis: ProfileBasis
  progress: FlightProgress
  /** Live aircraft on the route, for the side view; undefined without a position. */
  aircraft: AircraftOnRoute | undefined
  /** Vertical speed that flies the planned descent at the current groundspeed. */
  descentRateFpm: number
  /** Near and past TOD: the speed and V/S to fly, and any slowdown cue. */
  descentGuidance: DescentGuidance | undefined
}

const GUIDED_STATUSES: readonly FlightProgress['status'][] = [
  'approaching',
  'descend',
  'on-path',
  'below-path',
]

/**
 * State behind the (read-only) Flight plan tab: the sim's flight plan as a route, the
 * planned vertical profile with TOC and TOD (the aircraft's climb / descent when SimTools
 * has its figures, generic ones otherwise), and where
 * the aircraft is along it. The route is loaded once (and on change); only the aircraft
 * position is polled, at 1 Hz.
 */
export function useFlightPlanProfile() {
  const { state, reload } = useFlightPlanRoute()
  const [view, setView] = usePersistentState<ProfileView>('inflight.plan.view.v1', 'all', {
    debounceMs: 0,
  })
  // Whether the waypoint list is unfolded. Not saved: it starts unfolded every time the
  // tab opens.
  const [waypointsOpen, setWaypointsOpen] = useState(true)
  // The fix picked as the TOD reference (its route key); '' for the default. A key that is
  // no longer on the route (another flight plan) falls back to the default.
  const [referenceKey, setReferenceKey] = usePersistentState('inflight.plan.todRef.v1', '', {
    debounceMs: 0,
  })
  // Where this flight reached cruise (the TOC), on which route: saved, so reopening the
  // panel in cruise keeps it.
  const [rememberedToc, setRememberedToc] = usePersistentState<{
    route: string
    tocNm: number | undefined
  }>('inflight.plan.reachedToc.v1', { route: '', tocNm: undefined })
  const sim = useSimVars(FLIGHT_PLAN_SIM_VARS, 1)
  const { aircraft: simAircraft } = useSimAircraft()

  const plan =
    state.status === 'ready'
      ? planFlight(state.route, simAircraft, referenceKey || undefined)
      : undefined

  /** Pick a fix as the TOD reference; picking the current pick again returns to the default. */
  const selectReference = (index: number | undefined) => {
    const key = index === undefined ? undefined : plan?.route.waypoints[index]?.key
    const isPicked = plan?.reference.source === 'selected' && plan.reference.index === index
    setReferenceKey(key === undefined || isPicked ? '' : key)
  }

  let live: FlightPlanView | undefined
  let reachedTocNm: number | undefined
  if (plan) {
    const position =
      sim.latitude !== undefined && sim.longitude !== undefined
        ? positionOnRoute(plan.route.waypoints, { lat: sim.latitude, lon: sim.longitude })
        : undefined
    // The climb ahead is planned from the aircraft (TOC moves with it), and TOC stays
    // where cruise was reached.
    const anchor = climbAnchor({
      planned: plan.profile,
      aircraft:
        position && sim.altitude !== undefined
          ? { distanceNm: position.distanceNm, altitudeFt: sim.altitude }
          : undefined,
      reachedTocNm: rememberedToc.route === plan.routeKey ? rememberedToc.tocNm : undefined,
    })
    reachedTocNm = anchor.reachedTocNm
    const profile = anchor.climbFrom
      ? computeVerticalProfile({ ...plan.inputs, climbFrom: anchor.climbFrom })
      : plan.profile
    const waypoints = anchor.climbFrom
      ? planWaypoints(plan.route.waypoints, profile)
      : plan.waypoints
    const progress = flightProgress({
      profile,
      startNm: plan.route.waypoints[0]?.distanceNm,
      position,
      altitudeFt: sim.altitude,
      groundSpeedKt: sim.groundSpeed,
    })
    live = {
      ...plan,
      profile,
      waypoints,
      progress,
      aircraft:
        position && sim.altitude !== undefined
          ? {
              distanceNm: position.distanceNm,
              altitudeFt: sim.altitude,
              trendFtPerNm:
                sim.verticalSpeed !== undefined &&
                sim.groundSpeed !== undefined &&
                sim.groundSpeed >= MIN_GROUNDSPEED_KT
                  ? gradientFtPerNm(sim.verticalSpeed, sim.groundSpeed)
                  : undefined,
              groundSpeedKt: sim.groundSpeed,
            }
          : undefined,
      descentRateFpm: rateForAngle(
        sim.groundSpeed ?? PROFILE_ASSUMPTIONS.climbSpeedKt,
        plan.basis.descentAngleDeg,
      ),
      descentGuidance: GUIDED_STATUSES.includes(progress.status)
        ? descentGuidance({
            waypoints,
            referenceIndex: plan.reference.index,
            flownNm: position?.distanceNm,
            altitudeFt: sim.altitude,
            groundSpeedKt: sim.groundSpeed,
            iasKt: sim.indicatedSpeed,
            descentFtPerNm: plan.basis.descentFtPerNm,
            descentSpeedKias:
              simAircraft?.performance && sim.altitude !== undefined
                ? descentSpeedKias(simAircraft.performance, sim.altitude)
                : undefined,
            approachStartKias: simAircraft?.performance?.descent?.approachStartKias,
          })
        : undefined,
    }
  }

  const climbTarget = useClimbTarget(
    simAircraft?.performance,
    live?.progress.status === 'climb',
    sim.altitude,
  )

  // Remember the TOC once cruise is reached (a single write; nothing while climbing).
  const routeKey = plan?.routeKey
  useEffect(() => {
    if (routeKey === undefined || reachedTocNm === undefined) return
    if (rememberedToc.route === routeKey && rememberedToc.tocNm === reachedTocNm) return
    setRememberedToc({ route: routeKey, tocNm: reachedTocNm })
  }, [routeKey, reachedTocNm, rememberedToc, setRememberedToc])

  // Flying out of the climb view's window switches the chart to the whole flight. Only on
  // that moment: picking Climb again afterwards sticks.
  const insideClimb = live
    ? inClimbWindow(live.profile, live.aircraft?.distanceNm, live.route.waypoints[0]?.distanceNm)
    : undefined
  const wasInsideClimb = useRef(insideClimb)
  useEffect(() => {
    if (wasInsideClimb.current === true && insideClimb === false && view === 'departure') {
      setView('all')
    }
    wasInsideClimb.current = insideClimb
  }, [insideClimb, view, setView])

  return {
    state,
    reload,
    plan: live,
    climbTarget,
    view,
    setView,
    waypointsOpen,
    setWaypointsOpen,
    selectReference,
  }
}

/** What planning needs of a loaded route. */
type PlannableRoute = Pick<LoadedRoute, 'waypoints' | 'totalNm' | 'cruiseFt'>

/**
 * The planned profile for a route and aircraft (no live data: recomputed only when either
 * changes). Exported for the dev harness, which starts its mock descent at this TOD.
 */
export function planFlight<R extends PlannableRoute>(
  route: R,
  aircraft: Aircraft | undefined,
  referenceKey: string | undefined,
) {
  const cruiseFt = route.cruiseFt ?? PROFILE_ASSUMPTIONS.fallbackCruiseFt
  const first = route.waypoints[0]
  const last = route.waypoints[route.waypoints.length - 1]
  const reference = resolveDescentReference(route.waypoints, referenceKey)
  const endFt = (last?.elevationFt ?? 0) + (last?.runway ? THRESHOLD_HEIGHT_FT : 0)
  const basis = profileBasis(aircraft, cruiseFt, reference.altitudeFt ?? endFt)
  const inputs: ProfileInputs = {
    reference: descentTarget(reference),
    waypoints: route.waypoints,
    startFt: first?.elevationFt ?? 0,
    endFt,
    cruiseFt,
    climbFtPerNm: basis.climbFtPerNm,
    descentFtPerNm: basis.descentFtPerNm,
  }
  const profile = computeVerticalProfile(inputs)
  return {
    route,
    /** The plan's inputs, to plan the climb again from the aircraft. */
    inputs,
    /** Identifies the route, for the TOC remembered on it. */
    routeKey: `${first?.key}|${last?.key}|${route.totalNm.toFixed(1)}`,
    waypoints: planWaypoints(route.waypoints, profile),
    profile,
    reference,
    cruiseFt,
    cruiseFromPlan: route.cruiseFt !== undefined,
    basis,
  }
}

/**
 * The climb and descent to and from the cruise altitude: each the aircraft's own when
 * ~/aircraft has figures for it (climb: its climb table; descent: its table, or its descent
 * speed and vertical speed, from cruise to the altitude the descent is planned to), the
 * generic figures otherwise.
 */
function profileBasis(
  aircraft: Aircraft | undefined,
  cruiseFt: number,
  descentToFt: number,
): ProfileBasis {
  const generic = GENERIC_PROFILE_BASIS
  const perf = aircraft?.performance
  if (!aircraft || !perf) return generic

  const climbGradient = climbGradientFtPerNm(perf, cruiseFt)
  const climbRate = climbRateFpm(perf, cruiseFt)
  const ownClimb =
    perf.climb && climbGradient !== undefined && climbRate !== undefined
      ? { ftPerNm: climbGradient, rateFpm: climbRate, speedKt: perf.climb.speedKias }
      : undefined
  const descentGradient = descentGradientFtPerNm(perf, cruiseFt, descentToFt)
  const descentFtPerNm = descentGradient ?? generic.descentFtPerNm

  return {
    aircraftName: ownClimb || descentGradient !== undefined ? aircraft.shortName : undefined,
    climbFromAircraft: ownClimb !== undefined,
    descentFromAircraft: descentGradient !== undefined,
    climbFtPerNm: ownClimb?.ftPerNm ?? generic.climbFtPerNm,
    climbSpeedKt: ownClimb?.speedKt ?? generic.climbSpeedKt,
    climbRateFpm: ownClimb?.rateFpm ?? generic.climbRateFpm,
    descentFtPerNm,
    descentAngleDeg: angleForGradientDeg(descentFtPerNm),
  }
}
