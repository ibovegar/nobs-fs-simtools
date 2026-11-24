// What to fly in the descent: one constant speed, the V/S that reaches the next planned
// altitude from where the aircraft is (so wind, speed changes and being high or low correct
// themselves), and a cue when a speed limit ahead, or the approach speed 5 nm from the
// runway, needs slowing down. Pure and unit-tested.
import { MIN_GROUNDSPEED_KT } from './descentMath'
import { chartLabel } from './profileChart'
import type { RouteWaypoint } from './route'
import type { PlannedWaypoint } from './verticalProfile'

/** Fixes closer than this are not aimed at: a small error would ask for a huge V/S. */
const MIN_TARGET_NM = 1
/** The steepest descent asked for, as a share of the planned gradient. */
export const MAX_DESCENT_STEEPNESS = 1.5
/** A gentle slowdown in the descent. */
const DECEL_KT_PER_SEC = 0.5
/** Be at the speed this long before the fix. */
const SLOWDOWN_MARGIN_NM = 1
/** The cue appears this long before slowing is due. */
const SLOWDOWN_CUE_NM = 5
/** Within this of a limit counts as having slowed to it. */
const AT_SPEED_MARGIN_KT = 2
/** At the approach speed this far from the runway (about the final approach fix). */
export const APPROACH_SPEED_FROM_NM = 5

type GuidanceWaypoint = Pick<RouteWaypoint, 'ident' | 'runway' | 'distanceNm' | 'phase' | 'speed'>

export interface DescentGuidanceInput {
  waypoints: readonly PlannedWaypoint<GuidanceWaypoint>[]
  /** The fix the TOD is planned to. */
  referenceIndex: number
  /** Distance along the route, as the waypoints' `distanceNm`. */
  flownNm: number | undefined
  altitudeFt: number | undefined
  groundSpeedKt: number | undefined
  iasKt: number | undefined
  /** The planned gradient, which sets the steepest V/S asked for. */
  descentFtPerNm: number
  /** The aircraft's published descent speed, when it has one. */
  descentSpeedKias?: number
  /** The aircraft's final approach speed at its weight: flown from 5 nm out. */
  approachSpeedKias?: number
}

export interface DescentGuidance {
  /** The speed to hold now; undefined without a descent speed or a limit. */
  speedKias: number | undefined
  /** Descent rate (positive, fpm); undefined close to the end of the route. */
  rateFpm: number | undefined
  /** The fix that can't be made at a flyable descent rate. */
  tooHighFor?: string
  /** A speed limit ahead: slow to `kt` in `inNm` (0: now). */
  slowdown?: { kt: number; inNm: number }
}

/** The fixes the descent aims at: up to the reference, or to the runway once past it. */
function targets(i: DescentGuidanceInput, flownNm: number) {
  const ahead = i.waypoints
    .map((planned, index) => ({ planned, index }))
    .filter(({ planned }) => planned.waypoint.distanceNm > flownNm + MIN_TARGET_NM)
  const toReference = ahead.filter(({ index }) => index <= i.referenceIndex)
  return (toReference.length > 0 ? toReference : ahead).map(({ planned }) => planned)
}

/** The V/S that meets every planned altitude up to the target, within a flyable limit. */
function requiredRate(i: DescentGuidanceInput, flownNm: number, altitudeFt: number, gs: number) {
  let required: number | undefined
  let critical: GuidanceWaypoint | undefined
  for (const { waypoint, plannedFt } of targets(i, flownNm)) {
    const minutes = ((waypoint.distanceNm - flownNm) / gs) * 60
    const rate = (altitudeFt - plannedFt) / minutes
    if (required === undefined || rate > required) {
      required = rate
      critical = waypoint
    }
  }
  if (required === undefined) return { rateFpm: undefined }
  const maxRate = (i.descentFtPerNm * gs * MAX_DESCENT_STEEPNESS) / 60
  if (required > maxRate && critical) {
    return { rateFpm: maxRate, tooHighFor: chartLabel(critical) }
  }
  return { rateFpm: Math.max(0, required) }
}

/** The speed to hold, and the cue for the next speed limit below it. */
function speedPlan(i: DescentGuidanceInput, flownNm: number, gs: number) {
  const limits = i.waypoints
    .map((p) => p.waypoint)
    .filter(
      (wp) =>
        (wp.phase === 'arrival' || wp.phase === 'approach') &&
        (wp.speed?.kind === 'at' || wp.speed?.kind === 'atOrBelow'),
    )
    .map((wp) => ({ distanceNm: wp.distanceNm, kt: wp.speed?.kt as number }))
  // The approach speed as one more limit, near the end of the route.
  const endNm = i.waypoints[i.waypoints.length - 1]?.waypoint.distanceNm
  if (i.approachSpeedKias !== undefined && endNm !== undefined) {
    limits.push({ distanceNm: endNm - APPROACH_SPEED_FROM_NM, kt: i.approachSpeedKias })
    limits.sort((a, b) => a.distanceNm - b.distanceNm)
  }
  const passed = limits.filter((l) => l.distanceNm <= flownNm).map((l) => l.kt)
  const speeds = i.descentSpeedKias === undefined ? passed : [i.descentSpeedKias, ...passed]
  const base = speeds.length > 0 ? Math.min(...speeds) : undefined

  const current = i.iasKt ?? base
  const reference = base ?? i.iasKt
  const next =
    reference === undefined
      ? undefined
      : limits.find((l) => l.distanceNm > flownNm && l.kt < reference)
  if (!next || current === undefined) return { speedKias: base }

  const { kt } = next
  if (current <= kt + AT_SPEED_MARGIN_KT) return { speedKias: kt }
  const slowingNm = ((current - kt) / DECEL_KT_PER_SEC) * (gs / 3600) + SLOWDOWN_MARGIN_NM
  const inNm = next.distanceNm - flownNm - slowingNm
  if (inNm <= 0) return { speedKias: kt, slowdown: { kt, inNm: 0 } }
  if (inNm <= SLOWDOWN_CUE_NM) return { speedKias: base, slowdown: { kt, inNm } }
  return { speedKias: base }
}

/** What to fly now in the descent; undefined without a live position, altitude and speed. */
export function descentGuidance(i: DescentGuidanceInput): DescentGuidance | undefined {
  const { flownNm, altitudeFt, groundSpeedKt: gs } = i
  if (flownNm === undefined || altitudeFt === undefined || gs === undefined) return undefined
  if (gs < MIN_GROUNDSPEED_KT) return undefined
  return { ...speedPlan(i, flownNm, gs), ...requiredRate(i, flownNm, altitudeFt, gs) }
}
