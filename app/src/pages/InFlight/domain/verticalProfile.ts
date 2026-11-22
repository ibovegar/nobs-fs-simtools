// The planned vertical profile along the route: a climb from the departure runway, cruise,
// and a descent to the destination runway, shaped by the procedures' altitude limits.
// Pure and unit-tested.
//
// Like a simple FMS VNAV: the climb is worked out forwards at the climb gradient (levelling
// off below SID "at or below" limits), the descent backwards from the runway at the
// descent gradient (respecting STAR / approach limits, so the latest descent that meets
// them). An optional reference fix is crossed at exactly its altitude, so the descent from
// cruise is planned to it (by default the first approach fix, see descentReference). The
// profile is the lower of the two; TOC and TOD are where it reaches and leaves its highest
// altitude.

import type { AltitudeConstraint, RoutePhase } from './route'

export interface ProfileWaypoint {
  distanceNm: number
  phase: RoutePhase
  altitude?: AltitudeConstraint
}

export interface ProfileInputs {
  waypoints: readonly ProfileWaypoint[]
  /** Altitude at the start of the route (departure runway / airport elevation). */
  startFt: number
  /** Altitude at the end (destination threshold + crossing height). */
  endFt: number
  cruiseFt: number
  /** Feet gained per nautical mile in the climb. */
  climbFtPerNm: number
  /** Feet lost per nautical mile in the descent. */
  descentFtPerNm: number
  /**
   * The fix the descent from cruise is planned to, crossed at exactly this altitude (level
   * at it before the fix when the path from the runway gets there earlier, and after it
   * when the runway path is still higher). Omitted: straight down to the runway.
   */
  reference?: DescentTarget
  /**
   * Where the climb ahead starts: the aircraft once it's flying (or where it reached
   * cruise). The flown part runs straight from the runway to it. Omitted: the climb starts
   * at the runway.
   */
  climbFrom?: ProfilePoint
}

export interface DescentTarget {
  /** Index into `waypoints`. */
  index: number
  altitudeFt: number
  /**
   * The pilot's own pick: the descent from cruise runs straight to this fix, ignoring the
   * altitude limits of the fixes before it. Otherwise they still shape the path, as on an
   * FMS.
   */
  overridesEarlierLimits?: boolean
}

export interface ProfilePoint {
  distanceNm: number
  altitudeFt: number
}

export interface VerticalProfile {
  points: ProfilePoint[]
  /** Top of climb: where the profile first reaches its highest altitude. */
  tocNm: number
  /** Top of descent: where it last leaves it. */
  todNm: number
  /** The highest altitude flown: the cruise altitude, or lower on a short route. */
  topFt: number
  reachesCruise: boolean
  totalNm: number
}

const climbPhase = (phase: RoutePhase) => phase === 'departure'
const descentPhase = (phase: RoutePhase) => phase === 'arrival' || phase === 'approach'

/** Altitude on a polyline at a distance (clamped to its ends). */
export function altitudeAt(points: readonly ProfilePoint[], distanceNm: number): number {
  const first = points[0]
  if (!first) return 0
  if (distanceNm <= first.distanceNm) return first.altitudeFt
  for (let i = 1; i < points.length; i++) {
    const b = points[i] as ProfilePoint
    if (distanceNm <= b.distanceNm) {
      const a = points[i - 1] as ProfilePoint
      const span = b.distanceNm - a.distanceNm
      if (span <= 0) return b.altitudeFt
      return a.altitudeFt + ((distanceNm - a.distanceNm) / span) * (b.altitudeFt - a.altitudeFt)
    }
  }
  return (points[points.length - 1] as ProfilePoint).altitudeFt
}

/**
 * Forwards from the runway (or from `climbFrom`): climb at the gradient, level below SID
 * "at or below" limits.
 */
function climbPass(i: ProfileInputs): ProfilePoint[] {
  const wps = i.waypoints
  const first = wps[0] as ProfileWaypoint
  const last = wps[wps.length - 1] as ProfileWaypoint
  const points: ProfilePoint[] = [{ distanceNm: first.distanceNm, altitudeFt: i.startFt }]
  let alt = i.startFt
  let d = first.distanceNm

  const from = i.climbFrom
  if (from && from.distanceNm > first.distanceNm && from.distanceNm < last.distanceNm) {
    d = from.distanceNm
    alt = Math.max(i.startFt, Math.min(from.altitudeFt, i.cruiseFt))
    points.push({ distanceNm: d, altitudeFt: alt })
  }

  for (let k = 1; k < wps.length; k++) {
    const wp = wps[k] as ProfileWaypoint
    if (wp.distanceNm <= d) continue
    const upper = climbPhase(wp.phase) ? wp.altitude?.upperFt : undefined
    const cap = upper === undefined ? i.cruiseFt : Math.min(i.cruiseFt, upper)
    const end = wp.distanceNm
    if (alt < cap && i.climbFtPerNm > 0) {
      const reach = d + (cap - alt) / i.climbFtPerNm
      if (reach < end) {
        points.push({ distanceNm: reach, altitudeFt: cap })
        alt = cap
      } else {
        alt += i.climbFtPerNm * (end - d)
      }
    }
    points.push({ distanceNm: end, altitudeFt: alt })
    d = end
  }
  return points
}

/**
 * Backwards from the runway: the latest descent at the gradient. Approaching an "at or
 * below" limit it levels at the limit (descend to it earlier); an "at or above" limit
 * raises the path at that fix (a steeper segment after it). The reference fix, if any, is
 * an "at" limit whatever its phase; a picked one also clears the limits before it.
 */
function descentPass(i: ProfileInputs): ProfilePoint[] {
  const wps = i.waypoints
  const last = wps[wps.length - 1] as ProfileWaypoint
  let reversed: ProfilePoint[] = [{ distanceNm: last.distanceNm, altitudeFt: i.endFt }]
  let alt = i.endFt
  let d = last.distanceNm

  for (let k = wps.length - 2; k >= 0; k--) {
    const wp = wps[k] as ProfileWaypoint
    const ref = i.reference
    const target = ref?.index === k ? ref.altitudeFt : undefined
    const cleared = ref?.overridesEarlierLimits === true && k < ref.index
    const limits =
      target !== undefined
        ? { lowerFt: target, upperFt: target }
        : descentPhase(wp.phase) && !cleared
          ? wp.altitude
          : undefined
    const upper = limits?.upperFt
    const cap = upper === undefined ? i.cruiseFt : Math.min(i.cruiseFt, upper)
    const start = wp.distanceNm
    if (alt < cap && i.descentFtPerNm > 0) {
      const reach = d - (cap - alt) / i.descentFtPerNm
      if (reach > start) {
        reversed.push({ distanceNm: reach, altitudeFt: cap })
        alt = cap
      } else {
        alt += i.descentFtPerNm * (d - start)
      }
    }
    const lower = limits?.lowerFt
    if (lower !== undefined && alt < lower) alt = Math.min(lower, i.cruiseFt)
    // The reference is crossed at its altitude even when the path from the runway is still
    // higher there: hold that altitude after the fix until the runway path comes down to it.
    if (target !== undefined && alt > cap) {
      reversed = clampBelow(reversed, cap)
      alt = cap
    }
    reversed.push({ distanceNm: start, altitudeFt: alt })
    d = start
  }
  return reversed.reverse()
}

/** A backwards path (rising as it goes) held at or below an altitude, plus where it gets there. */
function clampBelow(reversed: readonly ProfilePoint[], ft: number): ProfilePoint[] {
  const out: ProfilePoint[] = []
  for (let j = 0; j < reversed.length; j++) {
    const p = reversed[j] as ProfilePoint
    const prev = reversed[j - 1]
    if (prev && prev.altitudeFt < ft && p.altitudeFt > ft) {
      const t = (ft - prev.altitudeFt) / (p.altitudeFt - prev.altitudeFt)
      out.push({
        distanceNm: prev.distanceNm + t * (p.distanceNm - prev.distanceNm),
        altitudeFt: ft,
      })
    }
    out.push({ distanceNm: p.distanceNm, altitudeFt: Math.min(p.altitudeFt, ft) })
  }
  return out
}

/** Pointwise minimum of two polylines over the same span, with their crossings. */
function lowerEnvelope(a: readonly ProfilePoint[], b: readonly ProfilePoint[]): ProfilePoint[] {
  const xs = [...new Set([...a, ...b].map((p) => p.distanceNm))].sort((x, y) => x - y)
  const out: ProfilePoint[] = []
  const add = (p: ProfilePoint) => {
    const prev = out[out.length - 1]
    if (prev && Math.abs(prev.distanceNm - p.distanceNm) < 1e-9) {
      prev.altitudeFt = Math.min(prev.altitudeFt, p.altitudeFt)
    } else {
      out.push(p)
    }
  }

  let prevX: number | undefined
  let prevDiff = 0
  let prevA = 0
  for (const x of xs) {
    const va = altitudeAt(a, x)
    const vb = altitudeAt(b, x)
    const diff = va - vb
    if (prevX !== undefined && prevDiff * diff < 0) {
      const t = prevDiff / (prevDiff - diff)
      add({ distanceNm: prevX + t * (x - prevX), altitudeFt: prevA + t * (va - prevA) })
    }
    add({ distanceNm: x, altitudeFt: Math.min(va, vb) })
    prevX = x
    prevDiff = diff
    prevA = va
  }
  return out
}

export function computeVerticalProfile(i: ProfileInputs): VerticalProfile {
  const wps = i.waypoints
  const first = wps[0]
  const last = wps[wps.length - 1]
  if (!first || !last || wps.length < 2) {
    const alt = i.startFt
    return {
      points: [{ distanceNm: 0, altitudeFt: alt }],
      tocNm: 0,
      todNm: 0,
      topFt: alt,
      reachesCruise: false,
      totalNm: 0,
    }
  }

  const points = lowerEnvelope(climbPass(i), descentPass(i))
  let topFt = Number.NEGATIVE_INFINITY
  for (const p of points) topFt = Math.max(topFt, p.altitudeFt)
  const atTop = points.filter((p) => p.altitudeFt >= topFt - 0.5)

  return {
    points,
    tocNm: atTop[0]?.distanceNm ?? 0,
    todNm: atTop[atTop.length - 1]?.distanceNm ?? 0,
    topFt,
    reachesCruise: topFt >= i.cruiseFt - 0.5,
    totalNm: last.distanceNm - first.distanceNm,
  }
}

/** A route waypoint with the altitude the profile plans there. */
export interface PlannedWaypoint<T extends ProfileWaypoint = ProfileWaypoint> {
  waypoint: T
  plannedFt: number
}

/** The planned altitude at each waypoint. */
export function planWaypoints<T extends ProfileWaypoint>(
  waypoints: readonly T[],
  profile: VerticalProfile,
): PlannedWaypoint<T>[] {
  return waypoints.map((waypoint) => ({
    waypoint,
    plannedFt: altitudeAt(profile.points, waypoint.distanceNm),
  }))
}
