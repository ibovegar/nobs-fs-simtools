import { useEffect, useRef, useState } from 'react'
import {
  type AircraftOnRoute,
  CLIMB_FT_PER_NM,
  computeVerticalProfile,
  DESCENT_FT_PER_NM,
  type FlightProgress,
  flightProgress,
  gradientFtPerNm,
  inClimbWindow,
  MIN_GROUNDSPEED_KT,
  type PlannedWaypoint,
  PROFILE_ASSUMPTIONS,
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
  progress: FlightProgress
  /** Live aircraft on the route, for the side view; undefined without a position. */
  aircraft: AircraftOnRoute | undefined
  /** Vertical speed that flies the planned descent at the current groundspeed. */
  descentRateFpm: number
}

/**
 * State behind the (read-only) Flight plan tab: the sim's flight plan as a route, the
 * planned vertical profile with TOC and TOD (fixed climb / descent assumptions), and where
 * the aircraft is along it. The route is loaded once (and on change); only the aircraft
 * position is polled, at 1 Hz.
 */
export function useFlightPlanProfile() {
  const { state, reload } = useFlightPlanRoute()
  const [view, setView] = usePersistentState<ProfileView>('inflight.plan.view.v1', 'all', {
    debounceMs: 0,
  })
  // Whether the waypoint list is unfolded. Not saved: it starts folded every time the tab
  // opens, so the overview is what you see first.
  const [waypointsOpen, setWaypointsOpen] = useState(false)
  const sim = useSimVars(FLIGHT_PLAN_SIM_VARS, 1)

  const plan = state.status === 'ready' ? planView(state.route) : undefined

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
        PROFILE_ASSUMPTIONS.descentAngleDeg,
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

/** The planned profile for a route (no live data: recomputed only when the route changes). */
function planView(route: LoadedRoute) {
  const cruiseFt = route.cruiseFt ?? PROFILE_ASSUMPTIONS.fallbackCruiseFt
  const first = route.waypoints[0]
  const last = route.waypoints[route.waypoints.length - 1]
  const profile = computeVerticalProfile({
    waypoints: route.waypoints,
    startFt: first?.elevationFt ?? 0,
    endFt: (last?.elevationFt ?? 0) + (last?.runway ? THRESHOLD_HEIGHT_FT : 0),
    cruiseFt,
    climbFtPerNm: CLIMB_FT_PER_NM,
    descentFtPerNm: DESCENT_FT_PER_NM,
  })
  return {
    route,
    waypoints: planWaypoints(route.waypoints, profile),
    profile,
    cruiseFt,
    cruiseFromPlan: route.cruiseFt !== undefined,
  }
}
