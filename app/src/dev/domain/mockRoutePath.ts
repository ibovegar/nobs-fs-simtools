// The path the dev harness's mock aircraft flies: the same route the app builds from the
// mock flight plan (so the aircraft sits exactly on it), and points along it.

import {
  buildRoute,
  collectRouteFixes,
  initialBearingDeg,
  type LatLon,
  offsetLatLon,
  type RouteWaypoint,
} from '~/pages/InFlight/domain'
import type { MockRoute } from './mockRoutes'

export interface MockRoutePath {
  waypoints: RouteWaypoint[]
  totalNm: number
  /** Ground elevation at the departure end. */
  departureElevationFt: number
  cruiseFt: number
}

/** The route as the app will see it (with the droppable fix left out when it's missing). */
export function mockRoutePath(mock: MockRoute, missingFix: boolean): MockRoutePath {
  const airport = (ident: string) => mock.airports[ident] ?? null
  const { fixes } = collectRouteFixes(
    mock.route,
    airport(mock.route.departureAirport.ident),
    airport(mock.route.destinationAirport.ident),
  )
  const built = buildRoute(fixes, (icao) =>
    missingFix && icao.ident === mock.droppableFix ? undefined : mock.fixes[icao.ident],
  )
  return {
    waypoints: built.waypoints,
    totalNm: built.totalNm,
    departureElevationFt: built.waypoints[0]?.elevationFt ?? 0,
    cruiseFt: mock.route.cruiseAltitude?.altitude ?? 10000,
  }
}

/** The position `distanceNm` along the path (clamped to its ends). */
export function pointAlong(path: MockRoutePath, distanceNm: number): LatLon | undefined {
  const wps = path.waypoints
  const first = wps[0]
  if (!first) return undefined
  if (distanceNm <= first.distanceNm) return { lat: first.lat, lon: first.lon }
  for (let i = 1; i < wps.length; i++) {
    const a = wps[i - 1] as RouteWaypoint
    const b = wps[i] as RouteWaypoint
    if (distanceNm <= b.distanceNm) {
      return offsetLatLon(a, initialBearingDeg(a, b), distanceNm - a.distanceNm)
    }
  }
  const last = wps[wps.length - 1] as RouteWaypoint
  return { lat: last.lat, lon: last.lon }
}
