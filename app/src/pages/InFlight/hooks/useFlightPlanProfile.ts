import { useEffect, useRef, useState } from 'react'
import {
  type Aircraft,
  climbGradientFtPerNm,
  climbRateFpm,
  descentGradientFtPerNm,
  useSimAircraft,
} from '~/aircraft'
import {
  type AircraftOnRoute,
  angleForGradientDeg,
  computeVerticalProfile,
  type FlightProgress,
  flightProgress,
  GENERIC_PROFILE_BASIS,
  gradientFtPerNm,
  inClimbWindow,
  MIN_GROUNDSPEED_KT,
  type PlannedWaypoint,
  PROFILE_ASSUMPTIONS,
  type ProfileBasis,
  type ProfileView,
  planWaypoints,
  positionOnRoute,
  type RouteWaypoint,
  rateForAngle,
  THRESHOLD_HEIGHT_FT,
  type VerticalProfile,
} from '~/pages/InFlight/domain'
import { useSimVars } from '~/sim'
import { usePersistentState } from '~/storage'
import { FLIGHT_PLAN_SIM_VARS } from './inFlightSimVars'
import { type LoadedRoute, useFlightPlanRoute } from './useFlightPlanRoute'

export interface FlightPlanView {
  route: LoadedRoute
  waypoints: PlannedWaypoint<RouteWaypoint>[]
  profile: VerticalProfile
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
}

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
  const sim = useSimVars(FLIGHT_PLAN_SIM_VARS, 1)
  const { aircraft: simAircraft } = useSimAircraft()

  const plan = state.status === 'ready' ? planView(state.route, simAircraft) : undefined

  let live: FlightPlanView | undefined
  if (plan) {
    const position =
      sim.latitude !== undefined && sim.longitude !== undefined
        ? positionOnRoute(plan.route.waypoints, { lat: sim.latitude, lon: sim.longitude })
        : undefined
    const progress = flightProgress({
      profile: plan.profile,
      startNm: plan.route.waypoints[0]?.distanceNm,
      position,
      altitudeFt: sim.altitude,
      groundSpeedKt: sim.groundSpeed,
    })
    live = {
      ...plan,
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
    }
  }

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
    view,
    setView,
    waypointsOpen,
    setWaypointsOpen,
  }
}

/**
 * The planned profile for a route and aircraft (no live data: recomputed only when either
 * changes).
 */
function planView(route: LoadedRoute, aircraft: Aircraft | undefined) {
  const cruiseFt = route.cruiseFt ?? PROFILE_ASSUMPTIONS.fallbackCruiseFt
  const basis = profileBasis(aircraft, cruiseFt)
  const first = route.waypoints[0]
  const last = route.waypoints[route.waypoints.length - 1]
  const profile = computeVerticalProfile({
    waypoints: route.waypoints,
    startFt: first?.elevationFt ?? 0,
    endFt: (last?.elevationFt ?? 0) + (last?.runway ? THRESHOLD_HEIGHT_FT : 0),
    cruiseFt,
    climbFtPerNm: basis.climbFtPerNm,
    descentFtPerNm: basis.descentFtPerNm,
  })
  return {
    route,
    waypoints: planWaypoints(route.waypoints, profile),
    profile,
    cruiseFt,
    cruiseFromPlan: route.cruiseFt !== undefined,
    basis,
  }
}

/**
 * The climb and descent to and from the cruise altitude: each the aircraft's own when
 * ~/aircraft has figures for it (climb: its climb table; descent: its table, or its descent
 * speed and vertical speed), the generic figures otherwise.
 */
function profileBasis(aircraft: Aircraft | undefined, cruiseFt: number): ProfileBasis {
  const generic = GENERIC_PROFILE_BASIS
  const perf = aircraft?.performance
  if (!aircraft || !perf) return generic

  const climbGradient = climbGradientFtPerNm(perf, cruiseFt)
  const climbRate = climbRateFpm(perf, cruiseFt)
  const ownClimb =
    perf.climb && climbGradient !== undefined && climbRate !== undefined
      ? { ftPerNm: climbGradient, rateFpm: climbRate, speedKt: perf.climb.speedKias }
      : undefined
  const descentGradient = descentGradientFtPerNm(perf, cruiseFt)
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
