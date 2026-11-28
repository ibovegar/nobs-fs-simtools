// Where the other one is, on the wind compass's ring: the picked airport seen from the
// aircraft, or the aircraft seen from the airport (on its heading); and the extended
// centreline of the runway to land on, out to the ring. Every bearing is true. Pure.

import { distanceNm } from './airportSearch'
import type { RunwayShape } from './runwayDiagram'

export interface LatLon {
  lat: number
  lon: number
}

/** The aircraft as the sim reports it; any value may be missing. */
export interface AircraftFix {
  lat: number | undefined
  lon: number | undefined
  headingDeg: number | undefined
  /** Above sea level (for the slant distance to an airport). */
  altitudeFt?: number | undefined
}

/** An airport with a position (the wind card's picked airport). */
export interface MarkedAirport extends LatLon {
  ident: string
}

export interface RingMarker {
  /** The airport (seen from the aircraft), or the aircraft (seen from the airport). */
  kind: 'airport' | 'aircraft'
  /** Where it is from the compass centre, degrees from north. */
  bearingDeg: number
  /** The aircraft's heading (the aircraft marker only, when known). */
  headingDeg: number | undefined
  /** Its label, one or two lines: ['ENBR', '23 nm'], ['23 nm']. */
  lines: readonly string[]
}

/** The extended centreline of a runway end, from past its label out to the ring. */
export interface ApproachLine {
  key: string
  x1: number
  y1: number
  x2: number
  y2: number
  /** Green for the end into the wind, yellow for the flight plan's. */
  kind: 'best' | 'planned'
}

/** Closer than this the bearing means nothing (the aircraft is at the airport): no marker. */
export const MARKER_MIN_NM = 0.5

const RAD = Math.PI / 180

const known = (v: number | undefined): v is number => v !== undefined && Number.isFinite(v)

/** The initial great-circle bearing from `from` to `to`, 0–360° true. */
export function bearingDeg(from: LatLon, to: LatLon): number {
  const lat1 = from.lat * RAD
  const lat2 = to.lat * RAD
  const dLon = (to.lon - from.lon) * RAD
  const y = Math.sin(dLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  return (((Math.atan2(y, x) / RAD) % 360) + 360) % 360
}

/** A distance as the marker shows it: '4.2 nm' under 10 nm, else '23 nm'. */
export function distanceText(nm: number): string {
  return nm < 10 ? `${nm.toFixed(1)} nm` : `${Math.round(nm)} nm`
}

function position(aircraft: AircraftFix): LatLon | undefined {
  return known(aircraft.lat) && known(aircraft.lon)
    ? { lat: aircraft.lat, lon: aircraft.lon }
    : undefined
}

/** The airport on the aircraft's compass: its direction, code and distance. */
export function airportMarker(
  aircraft: AircraftFix,
  airport: MarkedAirport | null,
): RingMarker | undefined {
  const at = position(aircraft)
  if (!at || !airport) return undefined
  const nm = distanceNm(at, airport)
  if (nm < MARKER_MIN_NM) return undefined
  return {
    kind: 'airport',
    bearingDeg: bearingDeg(at, airport),
    headingDeg: undefined,
    lines: [airport.ident, distanceText(nm)],
  }
}

/** The aircraft on the airport's compass: the side it is on, its heading and distance. */
export function aircraftMarker(
  aircraft: AircraftFix,
  airport: MarkedAirport | null,
): RingMarker | undefined {
  const at = position(aircraft)
  if (!at || !airport) return undefined
  const nm = distanceNm(airport, at)
  if (nm < MARKER_MIN_NM) return undefined
  return {
    kind: 'aircraft',
    bearingDeg: bearingDeg(airport, at),
    headingDeg: known(aircraft.headingDeg) ? aircraft.headingDeg : undefined,
    lines: [distanceText(nm)],
  }
}

/**
 * The extended centrelines of the ends to land on (into the wind; without one, the flight
 * plan's): from `gapPx` past the threshold, outward along the runway, to `ringR` from the
 * centre. None for an end whose start is already outside the ring.
 */
export function approachLines(
  runways: readonly RunwayShape[],
  gapPx: number,
  ringR: number,
): ApproachLine[] {
  // Each runway's two ends, with the far end to point away from (no flatMap in the sim).
  const ends: {
    key: string
    label: RunwayShape['labels'][number]
    x: number
    y: number
    ox: number
    oy: number
  }[] = []
  for (const rw of runways) {
    ends.push(
      { key: `${rw.key}-0`, label: rw.labels[0], x: rw.x1, y: rw.y1, ox: rw.x2, oy: rw.y2 },
      { key: `${rw.key}-1`, label: rw.labels[1], x: rw.x2, y: rw.y2, ox: rw.x1, oy: rw.y1 },
    )
  }
  const anyBest = ends.some((e) => e.label.best)
  const lines: ApproachLine[] = []
  for (const e of ends) {
    const shown = anyBest ? e.label.best : e.label.planned
    if (!shown) continue
    const kind = anyBest ? 'best' : 'planned'
    // Outward from the threshold, away from the runway's other end.
    const length = Math.hypot(e.x - e.ox, e.y - e.oy) || 1
    const ux = (e.x - e.ox) / length
    const uy = (e.y - e.oy) / length
    const sx = e.x + ux * gapPx
    const sy = e.y + uy * gapPx
    // How far along u the start is from the ring: |s + t·u| = ringR.
    const along = sx * ux + sy * uy
    const inside = ringR * ringR - (sx * sx + sy * sy)
    if (inside <= 0) continue
    const t = -along + Math.sqrt(along * along + inside)
    lines.push({ key: e.key, x1: sx, y1: sy, x2: sx + ux * t, y2: sy + uy * t, kind })
  }
  return lines
}
