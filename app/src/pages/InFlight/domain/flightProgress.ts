// Where the aircraft is along the planned route and profile: distance flown, the phase of
// flight, distance and time to TOC / TOD, and how far above or below the descent path it
// is. Pure and unit-tested.

import { MIN_GROUNDSPEED_KT } from './descentMath'
import { alongTrack, greatCircleNm, type LatLon } from './geo'
import { altitudeAt, type VerticalProfile } from './verticalProfile'

export interface RoutePosition {
  /** Distance flown along the route from its start. */
  distanceNm: number
  /** How far off the route (always ≥ 0). */
  offRouteNm: number
  /** Index of the next waypoint ahead. */
  nextIndex: number
}

interface RoutePoint extends LatLon {
  distanceNm: number
}

/** Projects a position onto the nearest leg of the route. */
export function positionOnRoute(
  waypoints: readonly RoutePoint[],
  p: LatLon,
): RoutePosition | undefined {
  if (waypoints.length === 0) return undefined
  if (waypoints.length === 1) {
    return { distanceNm: 0, offRouteNm: greatCircleNm(p, waypoints[0] as RoutePoint), nextIndex: 0 }
  }

  let best: RoutePosition | undefined
  for (let i = 1; i < waypoints.length; i++) {
    const a = waypoints[i - 1] as RoutePoint
    const b = waypoints[i] as RoutePoint
    const legNm = b.distanceNm - a.distanceNm
    let along: number
    let off: number
    if (legNm <= 0) {
      along = 0
      off = greatCircleNm(p, a)
    } else {
      const t = alongTrack(p, a, b)
      if (t.alongNm < 0) {
        along = 0
        off = greatCircleNm(p, a)
      } else if (t.alongNm > legNm) {
        along = legNm
        off = greatCircleNm(p, b)
      } else {
        along = t.alongNm
        off = Math.abs(t.crossNm)
      }
    }
    // Ties (a point exactly at a fix) go to the later leg: that's where you're heading.
    if (!best || off <= best.offRouteNm + 1e-6) {
      best = {
        distanceNm: a.distanceNm + along,
        offRouteNm: off,
        nextIndex: along >= legNm ? Math.min(i + 1, waypoints.length - 1) : i,
      }
    }
  }
  return best
}

export type FlightPlanStatus =
  | 'standby' // no position / not moving: the plan is shown without live progress
  | 'climb'
  | 'cruise'
  | 'approaching' // TOD within two minutes
  | 'descend' // past TOD and above the path
  | 'on-path'
  | 'below-path'

/** Within this of the planned path counts as on it. */
export const ON_PATH_TOLERANCE_FT = 300
const TOD_WARNING_SEC = 120
/** At cruise when within this of the cruise altitude: hold it (V/S 0). */
export const CRUISE_TOLERANCE_FT = 100
/** Getting back to the cruise altitude: the gap per minute, but never more than this. */
export const CRUISE_CORRECTION_MAX_FPM = 1500

/**
 * The V/S that holds or regains the cruise altitude: 0 within the tolerance, otherwise the
 * gap closed in a minute (300 ft low → +300 fpm), capped, like an autopilot capturing it.
 */
export function cruiseRateFpm(altitudeFt: number, cruiseFt: number): number {
  const gap = cruiseFt - altitudeFt
  if (Math.abs(gap) <= CRUISE_TOLERANCE_FT) return 0
  return Math.max(-CRUISE_CORRECTION_MAX_FPM, Math.min(CRUISE_CORRECTION_MAX_FPM, gap))
}

export interface FlightProgress {
  status: FlightPlanStatus
  distanceFlownNm: number
  remainingNm: number
  /** Negative once passed. */
  toTocNm: number
  toTodNm: number
  /** Undefined without groundspeed or once passed. */
  timeToTocSec: number | undefined
  /** V/S that holds or regains the cruise altitude (see cruiseRateFpm); undefined without altitude. */
  cruiseRateFpm: number | undefined
  timeToTodSec: number | undefined
  timeRemainingSec: number | undefined
  /** The planned altitude where the aircraft is. */
  pathAltitudeFt: number
  /** Aircraft altitude minus the path; undefined without live altitude. */
  deviationFt: number | undefined
  nextIndex: number
}

export interface ProgressInputs {
  profile: VerticalProfile
  /** Distance of the route's first waypoint (normally 0). */
  startNm?: number
  position: RoutePosition | undefined
  altitudeFt: number | undefined
  groundSpeedKt: number | undefined
}

const timeFor = (nm: number, gs: number | undefined) =>
  gs !== undefined && gs >= MIN_GROUNDSPEED_KT && nm > 0 ? (nm / gs) * 3600 : undefined

export function flightProgress(i: ProgressInputs): FlightProgress {
  const { profile, position, altitudeFt, groundSpeedKt } = i
  const startNm = i.startNm ?? 0
  const flown = position?.distanceNm ?? startNm
  const endNm = startNm + profile.totalNm
  const toTocNm = profile.tocNm - flown
  const toTodNm = profile.todNm - flown
  const remainingNm = Math.max(0, endNm - flown)
  const pathAltitudeFt = altitudeAt(profile.points, flown)
  const deviationFt = altitudeFt === undefined ? undefined : altitudeFt - pathAltitudeFt
  const timeToTodSec = timeFor(toTodNm, groundSpeedKt)
  const timeToTocSec = timeFor(toTocNm, groundSpeedKt)

  const moving = groundSpeedKt !== undefined && groundSpeedKt >= MIN_GROUNDSPEED_KT
  let status: FlightPlanStatus
  if (!position || altitudeFt === undefined || !moving) status = 'standby'
  else if (toTocNm > 0 && altitudeFt < profile.topFt - ON_PATH_TOLERANCE_FT) status = 'climb'
  else if (toTodNm > 0) {
    status =
      timeToTodSec !== undefined && timeToTodSec <= TOD_WARNING_SEC ? 'approaching' : 'cruise'
  } else if (deviationFt !== undefined && deviationFt > ON_PATH_TOLERANCE_FT) status = 'descend'
  else if (deviationFt !== undefined && deviationFt < -ON_PATH_TOLERANCE_FT) status = 'below-path'
  else status = 'on-path'

  return {
    status,
    distanceFlownNm: flown - startNm,
    remainingNm,
    toTocNm,
    toTodNm,
    timeToTocSec,
    cruiseRateFpm: altitudeFt === undefined ? undefined : cruiseRateFpm(altitudeFt, profile.topFt),
    timeToTodSec,
    timeRemainingSec: timeFor(remainingNm, groundSpeedKt),
    pathAltitudeFt,
    deviationFt,
    nextIndex: position?.nextIndex ?? 0,
  }
}
