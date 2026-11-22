// Geometry helpers for the flight-plan side view: which stretch of the route each view
// shows, axis ticks, clipping the profile to the view, and which waypoint labels fit.
// Pure and unit-tested.

import type { ProfileView } from './profileAssumptions'
import {
  altitudeAt,
  type ProfilePoint,
  type ProfileWaypoint,
  type VerticalProfile,
} from './verticalProfile'

export interface ViewRange {
  fromNm: number
  toNm: number
}

/**
 * The stretch of route a view shows: everything, the departure up to a little past TOC,
 * or the arrival from a little before TOD.
 */
export function viewRange(profile: VerticalProfile, view: ProfileView, startNm = 0): ViewRange {
  const endNm = startNm + profile.totalNm
  const all = { fromNm: startNm, toNm: endNm }
  if (profile.totalNm <= 0) return all
  if (view === 'departure') {
    const climbNm = profile.tocNm - startNm
    const toNm = Math.min(endNm, profile.tocNm + Math.max(10, climbNm * 0.25))
    return toNm - startNm >= 5 ? { fromNm: startNm, toNm } : all
  }
  if (view === 'arrival') {
    const descentNm = endNm - profile.todNm
    const fromNm = Math.max(startNm, profile.todNm - Math.max(10, descentNm * 0.25))
    return endNm - fromNm >= 5 ? { fromNm, toNm: endNm } : all
  }
  return all
}

/** The profile between two distances, with interpolated end points. */
export function clipProfile(points: readonly ProfilePoint[], range: ViewRange): ProfilePoint[] {
  const inside = points.filter((p) => p.distanceNm > range.fromNm && p.distanceNm < range.toNm)
  return [
    { distanceNm: range.fromNm, altitudeFt: altitudeAt(points, range.fromNm) },
    ...inside,
    { distanceNm: range.toNm, altitudeFt: altitudeAt(points, range.toNm) },
  ]
}

/** The "nice" step (1, 2 or 5 × 10ⁿ) closest to splitting `span` into `count` parts. */
export function niceStep(span: number, count: number): number {
  if (!(span > 0) || count <= 0) return 1
  const raw = span / count
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const residual = raw / magnitude
  const nice = residual < 1.5 ? 1 : residual < 3 ? 2 : residual < 7 ? 5 : 10
  return nice * magnitude
}

/** At most this many ticks: a bad input must never loop (it would freeze the sim). */
const MAX_TICKS = 200

/** Multiples of `step` from `from` to `to` (inclusive); none for non-finite input. */
export function ticks(from: number, to: number, step: number): number[] {
  const out: number[] = []
  if (!(step > 0) || !Number.isFinite(from) || !Number.isFinite(to) || !Number.isFinite(step)) {
    return out
  }
  const first = Math.ceil(from / step - 1e-9) * step
  for (let i = 0, v = first; v <= to + 1e-9 && i < MAX_TICKS; i++, v = first + i * step) {
    out.push(Math.round(v * 1e6) / 1e6 || 0)
  }
  return out
}

export interface AltitudeScale {
  /** Top of the chart: the highest altitude shown (normally the cruise altitude). */
  maxFt: number
  /** Gridlines: round steps below the top, and the top itself. */
  ticks: number[]
}

/**
 * The side view's vertical scale: it ends at the flight's highest altitude (rounded up to
 * 100 ft), so the top gridline is the cruise level. Round steps below it are labelled too,
 * except one too close to the top to read.
 */
export function altitudeScale(highestFt: number): AltitudeScale {
  const maxFt = Math.max(1000, Math.ceil(highestFt / 100) * 100)
  const step = niceStep(maxFt, 3)
  const below = ticks(step, maxFt, step).filter((ft) => maxFt - ft >= step * 0.4)
  return { maxFt, ticks: [...below, maxFt] }
}

/** The live aircraft on the side view. */
export interface AircraftOnRoute {
  distanceNm: number
  altitudeFt: number
  /** Current flight path, feet per nm (V/S ÷ groundspeed); undefined without both. */
  trendFtPerNm?: number
  /** Groundspeed: the flight-path line is drawn proportionally long. */
  groundSpeedKt?: number
}

/** Screen length of the flight-path line: proportional to groundspeed, within limits. */
export function trendLengthPx(groundSpeedKt: number, pxPerKt = 0.25, minPx = 20, maxPx = 150) {
  return Math.max(minPx, Math.min(maxPx, groundSpeedKt * pxPerKt))
}

/**
 * Where the aircraft's current flight path, drawn ahead of it, leaves the chart: at the
 * right edge (`toNm`), or earlier where it meets the ground or the top (`maxFt`).
 */
export function trendEnd(
  aircraft: { distanceNm: number; altitudeFt: number },
  ftPerNm: number,
  toNm: number,
  maxFt: number,
): ProfilePoint {
  const altitudeFt = aircraft.altitudeFt + ftPerNm * (toNm - aircraft.distanceNm)
  if (ftPerNm < 0 && altitudeFt < 0) {
    return { distanceNm: aircraft.distanceNm - aircraft.altitudeFt / ftPerNm, altitudeFt: 0 }
  }
  if (ftPerNm > 0 && altitudeFt > maxFt && aircraft.altitudeFt <= maxFt) {
    return {
      distanceNm: aircraft.distanceNm + (maxFt - aircraft.altitudeFt) / ftPerNm,
      altitudeFt: maxFt,
    }
  }
  return { distanceNm: toNm, altitudeFt }
}

/**
 * Whether a distance along the route lies inside the climb view's window (departure to a
 * little past TOC). Undefined without a position.
 */
export function inClimbWindow(
  profile: VerticalProfile,
  distanceNm: number | undefined,
  startNm = 0,
): boolean | undefined {
  if (distanceNm === undefined) return undefined
  return distanceNm <= viewRange(profile, 'departure', startNm).toNm
}

/** What the side view needs of a waypoint: a route fix, or a calculator point. */
export interface ChartWaypoint extends ProfileWaypoint {
  key: string
  ident: string
  /** The runway this fix is the threshold of, e.g. '27L': drawn as a runway on the ground. */
  runway?: string
}

/** About how long a label is in the chart's monospaced font (px), to see where it fits. */
export function labelWidthPx(text: string, fontPx: number): number {
  return text.length * fontPx * 0.62
}

/** A name to place beside a point (a fix's dot). */
export interface NameRequest {
  pointX: number
  pointY: number
  widthPx: number
  /** The side it reads best on (inside the profile's area): right, or left. */
  preferRight: boolean
  /**
   * On a level stretch (cruise): a line below the point, so it doesn't sit on the line, and
   * only further down (inside the profile's area) when that's taken.
   */
  below?: boolean
  /** From the point to the name, instead of the options' `sidePx` (a runway has no carets). */
  sidePx?: number
}

export interface PlacedName {
  left: number
  baseline: number
}

export interface NamePlacementOptions {
  fontPx: number
  /** The chart's edges: names stay between them, and above the ground. */
  minX: number
  maxX: number
  groundY: number
  /** From the point's drop line to the name, clear of the limit carets on it. */
  sidePx: number
  /** Space kept between two names. */
  gapPx: number
  /** Areas no name may cover (the aircraft, the runways). */
  obstacles?: readonly LabelBox[]
}

export interface LabelBox {
  left: number
  top: number
  right: number
  bottom: number
}

/**
 * Where to draw each name so none overlap: level with its point on the side it prefers,
 * else on the other side, else one or two lines above or below on either side. Placed in
 * order, so earlier names win a crowded spot; undefined for a name with no free spot.
 */
export function placeNames(
  requests: readonly NameRequest[],
  options: NamePlacementOptions,
): (PlacedName | undefined)[] {
  const { fontPx, minX, maxX, groundY, sidePx, gapPx, obstacles = [] } = options
  /** Letters stand about this high above the baseline (capitals and digits). */
  const capPx = fontPx * 0.75
  const kept: LabelBox[] = [...obstacles]
  const clear = (b: LabelBox) =>
    kept.every(
      (k) =>
        b.left >= k.right + gapPx ||
        b.right + gapPx <= k.left ||
        b.top >= k.bottom + gapPx ||
        b.bottom + gapPx <= k.top,
    )

  return requests.map((r) => {
    // Level with the point (the letters a touch below its centre line), or a line below it.
    const level = r.pointY + fontPx * 0.3 + (r.below ? fontPx : 0)
    const sides = r.preferRight ? [true, false] : [false, true]
    const side = r.sidePx ?? sidePx
    const steps = r.below ? [0, fontPx, 2 * fontPx] : [0, -fontPx, fontPx, -2 * fontPx, 2 * fontPx]
    for (const dy of steps) {
      for (const right of sides) {
        const left = right ? r.pointX + side : r.pointX - side - r.widthPx
        const baseline = level + dy
        const box = { left, top: baseline - capPx, right: left + r.widthPx, bottom: baseline }
        const inside =
          box.left >= minX && box.right <= maxX && box.top >= 0 && baseline <= groundY - 2
        if (inside && clear(box)) {
          kept.push(box)
          return { left, baseline }
        }
      }
    }
    return undefined
  })
}

/** The fix's label under the side view: a runway as the FMS names it ('RW27L'). */
export function chartLabel(waypoint: Pick<ChartWaypoint, 'ident' | 'runway'>): string {
  return waypoint.runway ? `RW${waypoint.runway}` : waypoint.ident
}
