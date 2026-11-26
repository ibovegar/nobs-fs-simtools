// Airports the dev harness's mock navigation database knows for search, nearest airports
// and METARs: southern Norway, around the sample routes. Positions are close to the real
// ones; the METARs are made up (each airport gets its own steady wind). Not for navigation.

import type { NavAirport, NavMetar, NavRunway } from '~/sim'

/**
 * A runway: designation, true heading of its primary end, length (m), and optionally its
 * centre's offset from the airport (degrees) and designator letters (1 L, 2 R).
 */
type MockRunway = readonly [string, number, number, number?, number?, number?, number?]

export interface MockAirport {
  ident: string
  name: string
  lat: number
  lon: number
  runways: readonly MockRunway[]
}

export const MOCK_AIRPORTS: readonly MockAirport[] = [
  {
    ident: 'ENGM',
    name: 'Oslo Gardermoen',
    lat: 60.194,
    lon: 11.1,
    runways: [
      ['01-19', 14, 3600, -0.003, -0.022, 1, 2],
      ['01-19', 14, 2950, 0.003, 0.022, 2, 1],
    ],
  },
  {
    ident: 'ENBR',
    name: 'Bergen Flesland',
    lat: 60.294,
    lon: 5.218,
    runways: [['17-35', 172, 2990]],
  },
  {
    ident: 'ENZV',
    name: 'Stavanger Sola',
    lat: 58.877,
    lon: 5.638,
    runways: [
      ['18-36', 184, 2556],
      ['11-29', 107, 2449, 0.004, -0.006],
    ],
  },
  {
    ident: 'ENVA',
    name: 'Trondheim Værnes',
    lat: 63.458,
    lon: 10.924,
    runways: [['09-27', 89, 2999]],
  },
  {
    ident: 'ENTO',
    name: 'Sandefjord Torp',
    lat: 59.187,
    lon: 10.259,
    runways: [['18-36', 182, 2989]],
  },
  { ident: 'ENRY', name: 'Moss Rygge', lat: 59.379, lon: 10.786, runways: [['12-30', 124, 2443]] },
  { ident: 'ENKJ', name: 'Kjeller', lat: 59.97, lon: 11.036, runways: [['12-30', 126, 1080]] },
  {
    ident: 'ENCN',
    name: 'Kristiansand Kjevik',
    lat: 58.204,
    lon: 8.085,
    runways: [['04-22', 37, 2035]],
  },
  {
    ident: 'ENHD',
    name: 'Haugesund Karmøy',
    lat: 59.345,
    lon: 5.208,
    runways: [['13-31', 130, 2120]],
  },
  {
    ident: 'ENSO',
    name: 'Stord Sørstokken',
    lat: 59.792,
    lon: 5.341,
    runways: [['14-32', 137, 1460]],
  },
  { ident: 'ENFL', name: 'Florø', lat: 61.584, lon: 5.025, runways: [['07-25', 70, 1199]] },
  {
    ident: 'ENSG',
    name: 'Sogndal Haukåsen',
    lat: 61.156,
    lon: 7.138,
    runways: [['06-24', 56, 1060]],
  },
  {
    ident: 'ENFG',
    name: 'Fagernes Leirin',
    lat: 61.016,
    lon: 9.288,
    runways: [['16-34', 160, 2049]],
  },
  { ident: 'ENDI', name: 'Dagali', lat: 60.417, lon: 8.513, runways: [['16-34', 154, 1640]] },
  {
    ident: 'ENGK',
    name: 'Arendal Gullknapp',
    lat: 58.517,
    lon: 8.7,
    runways: [['03-21', 28, 1199]],
  },
  { ident: 'ENNO', name: 'Notodden', lat: 59.566, lon: 9.212, runways: [['12-30', 117, 1000]] },
  {
    ident: 'ENBN',
    name: 'Brønnøysund Brønnøy',
    lat: 65.461,
    lon: 12.218,
    runways: [['04-22', 40, 1199]],
  },
  { ident: 'ENBO', name: 'Bodø', lat: 67.269, lon: 14.365, runways: [['07-25', 73, 2794]] },
]

export function mockAirport(ident: string): MockAirport | undefined {
  return MOCK_AIRPORTS.find((a) => a.ident === ident)
}

/** A made-up METAR for a mock airport: a steady wind of its own (from the ident's letters). */
export function mockMetar(airport: MockAirport): NavMetar {
  const seed = airport.ident.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)
  const windDir = ((seed * 37) % 36) * 10 || 360
  const windSpeed = 4 + (seed % 17)
  const gust = windSpeed >= 15 ? windSpeed + 9 : undefined
  const dir = String(windDir).padStart(3, '0')
  const gustText = gust === undefined ? '' : `G${gust}`
  return {
    icao: airport.ident,
    day: 26,
    hour: 14,
    min: 50,
    windDir,
    windSpeed,
    gust,
    windSpeedUnits: 0,
    vrb: false,
    metarString: `${airport.ident} 261450Z ${dir}${String(windSpeed).padStart(2, '0')}${gustText}KT 9999 FEW030 08/03 Q1008`,
  }
}

/** A mock airport as the sim's facility: its position and runways (no procedures). */
export function mockAirportFacility(airport: MockAirport): NavAirport {
  const runways = airport.runways.map(
    ([
      designation,
      direction,
      length,
      dLat = 0,
      dLon = 0,
      primary = 0,
      secondary = 0,
    ]): NavRunway => ({
      latitude: airport.lat + dLat,
      longitude: airport.lon + dLon,
      direction,
      designation,
      length,
      designatorCharPrimary: primary,
      designatorCharSecondary: secondary,
      primaryElevation: 0,
      secondaryElevation: 0,
      primaryThresholdLength: 0,
      secondaryThresholdLength: 0,
    }),
  )
  return {
    icaoStruct: { type: 'A', region: '', airport: '', ident: airport.ident },
    lat: airport.lat,
    lon: airport.lon,
    altitude: 0,
    runways,
    departures: [],
    arrivals: [],
    approaches: [],
  }
}
