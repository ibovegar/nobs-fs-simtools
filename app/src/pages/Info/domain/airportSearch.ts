// The wind card's airport field: suggestions from the airports near the aircraft (by code
// or name) and from the sim's search by code. Pure.

export interface AirportCandidate {
  ident: string
  /** '' when the sim has no name. */
  name: string
  lat: number
  lon: number
  /** The flight plan's runway end here ('19R'), when it came from the flight plan. */
  runway?: string
}

export interface AirportSuggestion {
  key: string
  ident: string
  name: string
  /** '12 nm' from the aircraft; undefined without its position. */
  distanceText: string | undefined
  airport: AirportCandidate
}

/** At most this many suggestions. */
export const MAX_SUGGESTIONS = 8

const EARTH_RADIUS_NM = 3440.065

/** Great-circle distance between two positions (degrees), nautical miles. */
export function distanceNm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_NM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Upper case without accents, as typed on the keypad (A–Z, 0–9): 'Værnes' → 'VAERNES',
 * 'Sørstokken' → 'SORSTOKKEN'.
 */
export function searchText(text: string): string {
  return text
    .toUpperCase()
    .replace(/Æ/g, 'AE')
    .replace(/Ø/g, 'O')
    .replace(/Å/g, 'A')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/** What the pilot typed, tidied: upper case, letters, digits and spaces. */
export function airportQuery(text: string): string {
  return searchText(text)
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/^ +/, '')
}

/** Worth asking the sim to search by code: 2–4 letters and digits. */
export function isIdentQuery(query: string): boolean {
  return /^[A-Z0-9]{2,4}$/.test(query.trim())
}

/** 0 exact code, 1 code starts with it, 2 a word of the name starts with it; else no match. */
function matchRank(airport: AirportCandidate, query: string): number | undefined {
  if (airport.ident === query) return 0
  if (airport.ident.startsWith(query)) return 1
  const words = searchText(airport.name).split(/[^A-Z0-9]+/)
  const name = words.join(' ')
  if (words.some((w) => w.startsWith(query)) || name.startsWith(query)) return 2
  return undefined
}

/**
 * The suggestions for what is typed: with nothing typed, the airports nearest the aircraft;
 * else those whose code or a word of the name starts with it (nearby airports and the sim's
 * code search), best match first, then nearest first. The last airport picked (`last`) is
 * offered too: first while nothing is typed, so it's one tap away.
 */
export function airportSuggestions(
  query: string,
  nearby: readonly AirportCandidate[],
  identHits: readonly AirportCandidate[],
  from: { lat: number; lon: number } | undefined,
  last?: AirportCandidate,
): AirportSuggestion[] {
  const q = airportQuery(query).trim()
  const all = new Map<string, AirportCandidate>()
  const known = last ? [last, ...nearby, ...identHits] : [...nearby, ...identHits]
  for (const a of known) if (!all.has(a.ident)) all.set(a.ident, a)
  const blankRank = (a: AirportCandidate) => (a.ident === last?.ident ? -1 : 0)

  const distance = (a: AirportCandidate) => (from ? distanceNm(from, a) : 0)
  const ranked = [...all.values()]
    .map((airport) => ({ airport, rank: q === '' ? blankRank(airport) : matchRank(airport, q) }))
    .filter((r): r is { airport: AirportCandidate; rank: number } => r.rank !== undefined)
    .sort((a, b) => a.rank - b.rank || distance(a.airport) - distance(b.airport))
    .slice(0, MAX_SUGGESTIONS)

  return ranked.map(({ airport }) => ({
    key: airport.ident,
    ident: airport.ident,
    name: airport.name,
    distanceText: from ? `${Math.round(distanceNm(from, airport))} nm` : undefined,
    airport,
  }))
}

/** The airport field's text for a chosen airport: 'ENBR  Bergen Flesland'. */
export function airportLabel(airport: AirportCandidate): string {
  return airport.name ? `${airport.ident}  ${airport.name}` : airport.ident
}

/** The line under the suggestions: searching, or why there are none. */
export function suggestionsStatus(
  count: number,
  loading: boolean,
  query: string,
  hasNavData: boolean,
): string | undefined {
  if (!hasNavData) return 'No sim: airports can only be found in the sim.'
  if (loading) return 'Finding airports…'
  if (count > 0) return undefined
  return query.trim() === '' ? 'No airports near you.' : 'No airport found.'
}
