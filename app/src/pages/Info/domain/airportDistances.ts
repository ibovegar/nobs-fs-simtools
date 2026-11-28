// The distance to the wind card's airport, two ways: over the ground (as a GPS shows it)
// and the slant distance through the air (as a DME measures it). Pure.

import { distanceNm } from './airportSearch'
import type { AircraftFix, MarkedAirport } from './ringMarkers'

const FT_PER_NM = 6076.12
const FT_PER_M = 3.28084

/** The readouts under the wind graph: values ('23.4', '—') and their help texts. */
export interface AirportDistances {
  gps: string
  dme: string
  gpsHelp: string
  dmeHelp: string
}

const known = (v: number | undefined): v is number => v !== undefined && Number.isFinite(v)

/**
 * The slant distance: the straight line through the air to a point `heightFt` below, as a
 * DME measures it. Never less than the ground distance.
 */
export function slantRangeNm(groundNm: number, heightFt: number): number {
  return Math.hypot(groundNm, Math.max(0, heightFt) / FT_PER_NM)
}

/**
 * The distances to the airport, one decimal like a DME: GPS over the ground, DME through
 * the air (from the aircraft's altitude above the airport). '—' for what isn't known yet.
 * None without an airport.
 */
export function airportDistances(
  aircraft: AircraftFix,
  airport: MarkedAirport | null,
  /** The airport's elevation, metres. */
  elevationM: number | undefined,
): AirportDistances | undefined {
  if (!airport) return undefined
  const { ident } = airport
  const help = {
    gpsHelp: `The distance to ${ident} over the ground, as a GPS shows it.`,
    dmeHelp: `The slant distance to ${ident}: the straight line through the air, from your altitude down to the airport, as a DME (and ATC's radar) measures it. A little more than the GPS distance when you're high and close: overhead at 6000 ft above it, the DME still reads about 1 nm.`,
  }
  if (!known(aircraft.lat) || !known(aircraft.lon)) return { gps: '—', dme: '—', ...help }
  const groundNm = distanceNm({ lat: aircraft.lat, lon: aircraft.lon }, airport)
  const height =
    known(aircraft.altitudeFt) && known(elevationM)
      ? aircraft.altitudeFt - elevationM * FT_PER_M
      : undefined
  return {
    gps: groundNm.toFixed(1),
    dme: height === undefined ? '—' : slantRangeNm(groundNm, height).toFixed(1),
    ...help,
  }
}
