import type { NavFlightPlanRoute, NavIcao } from './navTypes'

/** A stable map key for a facility identifier. */
export function icaoKey(icao: NavIcao): string {
  return `${icao.type}|${icao.region}|${icao.airport}|${icao.ident}`
}

/**
 * The pre-2024 12-character ICAO string: type (1), region (2), airport (4), ident (5),
 * space padded. e.g. 'WLF    BOLLY' → { type: 'W', region: 'LF', airport: '', ident: 'BOLLY' }.
 */
export function parseIcaoString(icao: string): NavIcao {
  return {
    type: icao.substring(0, 1).trim(),
    region: icao.substring(1, 3).trim(),
    airport: icao.substring(3, 7).trim(),
    ident: icao.substring(7).trim(),
  }
}

/** A facility's identifier, from the 2024 struct or the older string. */
export function facilityIcao(facility: {
  icaoStruct?: NavIcao
  icao?: string
}): NavIcao | undefined {
  if (facility.icaoStruct) return facility.icaoStruct
  return typeof facility.icao === 'string' ? parseIcaoString(facility.icao) : undefined
}

/** The sim returns an empty route (no airports, no legs) when no flight plan is set. */
export function isEmptyRoute(route: NavFlightPlanRoute | null | undefined): boolean {
  if (!route) return true
  return (
    !route.departureAirport?.ident &&
    !route.destinationAirport?.ident &&
    (route.enroute?.length ?? 0) === 0
  )
}

/** The route has a cruise altitude (the avionics' copy may come without one). */
export function hasCruiseAltitude(route: NavFlightPlanRoute | null | undefined): boolean {
  return (route?.cruiseAltitude?.altitude ?? 0) > 0
}

/** The same plan: same departure and destination airports. */
export function sameRouteAirports(a: NavFlightPlanRoute, b: NavFlightPlanRoute): boolean {
  return (
    (a.departureAirport?.ident ?? '') === (b.departureAirport?.ident ?? '') &&
    (a.destinationAirport?.ident ?? '') === (b.destinationAirport?.ident ?? '')
  )
}
