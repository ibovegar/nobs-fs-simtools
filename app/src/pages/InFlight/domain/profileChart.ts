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

/** Multiples of `step` from `from` to `to` (inclusive). */
export function ticks(from: number, to: number, step: number): number[] {
  const out: number[] = []
  if (!(step > 0)) return out
  for (let v = Math.ceil(from / step - 1e-9) * step; v <= to + 1e-9; v += step) {
    out.push(Math.round(v * 1e6) / 1e6 || 0)
  }
  return out
}

export interface LabelCandidate {
  x: number
  /** Higher wins a crowded spot (route ends, fixes with limits). */
  priority: number
}

/**
 * Which labels to draw so none sit closer than `minGapPx`: the most important first, then
 * the rest wherever they fit. Returns one flag per candidate.
 */
export function pickLabels(candidates: readonly LabelCandidate[], minGapPx: number): boolean[] {
  const order = candidates
    .map((c, i) => ({ ...c, i }))
    .sort((a, b) => b.priority - a.priority || a.i - b.i)
  const placed: number[] = []
  const shown = candidates.map(() => false)
  for (const c of order) {
    if (placed.every((x) => Math.abs(x - c.x) >= minGapPx)) {
      placed.push(c.x)
      shown[c.i] = true
    }
  }
  return shown
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
}
