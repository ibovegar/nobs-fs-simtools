// Sample flight plans for the dev harness, in the sim's own shapes (EFB route + airports
// with runways and procedures + fix positions), so the app's real loading code runs on them.
//
// Airport and runway positions are close to the real ones; the procedures, fix names and
// limits are made up for testing (MOCK…, invented fixes). Not for navigation.

import type {
  NavAirport,
  NavEnrouteLeg,
  NavFlightPlanRoute,
  NavIcao,
  NavProcedureLeg,
  NavRunway,
} from '~/sim'

export type MockRouteId = 'none' | 'oslo-bergen' | 'oslo-bergen-low' | 'oslo-torp'

export interface MockRoute {
  route: NavFlightPlanRoute
  airports: Record<string, NavAirport>
  /** Fix positions by ident. */
  fixes: Record<string, { lat: number; lon: number; type: string }>
  /** The fix the "missing fix" switch removes from the database. */
  droppableFix: string
}

const FT = 0.3048

const icao = (type: string, ident: string, airport = '', region = 'EN'): NavIcao => ({
  type,
  region,
  airport,
  ident,
})
const apt = (ident: string) => icao('A', ident, '', '')

// ARINC leg types (SDK LegType).
const CA = 2
const DF = 7
const IF = 15
const TF = 18

interface LegOptions {
  at?: number
  atOrAbove?: number
  atOrBelow?: number
  between?: [number, number]
  /** At or below, knots. */
  speed?: number
}

function leg(type: number, fix: NavIcao, options: LegOptions = {}): NavProcedureLeg {
  let altDesc = 0
  let altitude1 = 0
  let altitude2 = 0
  if (options.at !== undefined) {
    altDesc = 1
    altitude1 = options.at * FT
  } else if (options.atOrAbove !== undefined) {
    altDesc = 2
    altitude1 = options.atOrAbove * FT
  } else if (options.atOrBelow !== undefined) {
    altDesc = 3
    altitude1 = options.atOrBelow * FT
  } else if (options.between) {
    altDesc = 4
    altitude1 = options.between[1] * FT
    altitude2 = options.between[0] * FT
  }
  return {
    type,
    fixIcaoStruct: fix,
    altDesc,
    altitude1,
    altitude2,
    speedRestriction: options.speed ?? 0,
    speedRestrictionDesc: options.speed ? 3 : 0,
  }
}

function runway(
  latitude: number,
  longitude: number,
  direction: number,
  designation: string,
  lengthM: number,
  elevationM: number,
  primary = 0,
  secondary = 0,
): NavRunway {
  return {
    latitude,
    longitude,
    direction,
    designation,
    length: lengthM,
    designatorCharPrimary: primary,
    designatorCharSecondary: secondary,
    primaryElevation: elevationM,
    secondaryElevation: elevationM,
    primaryThresholdLength: 0,
    secondaryThresholdLength: 0,
  }
}

function enroute(fix: NavIcao, via = ''): NavEnrouteLeg {
  return {
    fixIcao: fix,
    via,
    isPpos: false,
    hasLatLon: false,
    lat: 0,
    lon: 0,
    hasPointBearingDistance: false,
    referenceIcao: icao('', ''),
    bearing: 0,
    distance: 0,
  }
}

const noRunway = { number: '', designator: '' }
const noApproach = { type: '', runway: noRunway, suffix: '' }

// --- Airports -----------------------------------------------------------------------------

const ENGM: NavAirport = {
  icaoStruct: apt('ENGM'),
  lat: 60.1939,
  lon: 11.1004,
  altitude: 208,
  // 01L/19R (L = 1, R = 2) and 01R/19L.
  runways: [
    runway(60.1934, 11.0731, 14, '01-19', 3600, 208, 1, 2),
    runway(60.1993, 11.1182, 14, '01-19', 2950, 205, 2, 1),
  ],
  departures: [
    {
      name: 'MOCK1A',
      runwayTransitions: [
        {
          runwayNumber: 1,
          runwayDesignation: 1,
          legs: [
            leg(CA, icao('', ''), { atOrAbove: 1500 }),
            leg(DF, icao('W', 'GM401'), { atOrBelow: 6000, speed: 220 }),
          ],
        },
      ],
      commonLegs: [leg(TF, icao('W', 'GM402'), { atOrAbove: 8000 })],
      enRouteTransitions: [],
    },
  ],
  arrivals: [],
  approaches: [],
}

const ENBR: NavAirport = {
  icaoStruct: apt('ENBR'),
  lat: 60.2934,
  lon: 5.2181,
  altitude: 52,
  runways: [runway(60.2934, 5.2181, 172, '17-35', 2990, 52)],
  departures: [],
  arrivals: [
    {
      name: 'MOCK1B',
      enRouteTransitions: [],
      commonLegs: [
        leg(IF, icao('W', 'HALIX')),
        leg(TF, icao('W', 'BERGI'), { atOrBelow: 15000, speed: 250 }),
        leg(TF, icao('W', 'FANEX'), { between: [5000, 7000] }),
      ],
      runwayTransitions: [],
    },
  ],
  approaches: [
    {
      approachType: 4, // ILS
      approachSuffix: '',
      runwayNumber: 17,
      runwayDesignator: 0,
      transitions: [{ name: 'FANEX', legs: [leg(IF, icao('W', 'FANEX'))] }],
      finalLegs: [
        leg(IF, icao('W', 'BR17I', 'ENBR'), { at: 4000, speed: 210 }),
        leg(TF, icao('W', 'BR17F', 'ENBR'), { at: 2100, speed: 180 }),
        leg(TF, icao('R', 'RW17', 'ENBR')),
      ],
    },
  ],
}

const ENTO: NavAirport = {
  icaoStruct: apt('ENTO'),
  lat: 59.1867,
  lon: 10.2586,
  altitude: 87,
  runways: [runway(59.1867, 10.2586, 182, '18-36', 2989, 87)],
  departures: [],
  arrivals: [],
  approaches: [],
}

// --- Routes -------------------------------------------------------------------------------

const OSLO_BERGEN: MockRoute = {
  route: {
    departureAirport: apt('ENGM'),
    destinationAirport: apt('ENBR'),
    departureRunway: { number: '01', designator: 'L' },
    departure: 'MOCK1A',
    departureTransition: '',
    enroute: [
      enroute(icao('W', 'GM402')),
      enroute(icao('W', 'NOLEX'), 'M601'),
      enroute(icao('W', 'VADUX'), 'M601'),
      enroute(icao('W', 'HALIX')),
    ],
    destinationRunway: { number: '17', designator: '' },
    arrival: 'MOCK1B',
    arrivalTransition: '',
    approach: { type: 'ILS', runway: { number: '17', designator: '' }, suffix: '' },
    approachTransition: 'FANEX',
    cruiseAltitude: { altitude: 25000, isFlightLevel: true },
    isVfr: false,
  },
  airports: { ENGM, ENBR },
  fixes: {
    GM401: { lat: 60.33, lon: 11.12, type: 'W' },
    GM402: { lat: 60.42, lon: 10.55, type: 'W' },
    NOLEX: { lat: 60.48, lon: 9.6, type: 'W' },
    VADUX: { lat: 60.52, lon: 8.3, type: 'W' },
    HALIX: { lat: 60.45, lon: 7.0, type: 'W' },
    BERGI: { lat: 60.42, lon: 6.2, type: 'W' },
    FANEX: { lat: 60.52, lon: 5.62, type: 'W' },
    BR17I: { lat: 60.49, lon: 5.17, type: 'W' },
    BR17F: { lat: 60.39, lon: 5.19, type: 'W' },
  },
  droppableFix: 'VADUX',
}

/**
 * The same route planned for a turboprop like the Caravan: FL120, within its ceiling
 * (23,700 ft) and the procedures' limits (8,000 ft or above at GM402, 15,000 ft or below at
 * BERGI), so the profile has a real cruise between TOC and TOD.
 */
const OSLO_BERGEN_LOW: MockRoute = {
  ...OSLO_BERGEN,
  route: { ...OSLO_BERGEN.route, cruiseAltitude: { altitude: 12_000, isFlightLevel: true } },
}

/** A short hop with no procedures: too short to reach the planned cruise level. */
const OSLO_TORP: MockRoute = {
  route: {
    departureAirport: apt('ENGM'),
    destinationAirport: apt('ENTO'),
    departureRunway: { number: '19', designator: 'R' },
    departure: '',
    departureTransition: '',
    enroute: [enroute(icao('W', 'LIDAX'))],
    destinationRunway: { number: '18', designator: '' },
    arrival: '',
    arrivalTransition: '',
    approach: noApproach,
    approachTransition: '',
    cruiseAltitude: { altitude: 24000, isFlightLevel: true },
    isVfr: false,
  },
  airports: { ENGM, ENTO },
  fixes: { LIDAX: { lat: 59.7, lon: 10.75, type: 'W' } },
  droppableFix: 'LIDAX',
}

export const MOCK_ROUTES: Record<Exclude<MockRouteId, 'none'>, MockRoute> = {
  'oslo-bergen': OSLO_BERGEN,
  'oslo-bergen-low': OSLO_BERGEN_LOW,
  'oslo-torp': OSLO_TORP,
}

export const MOCK_ROUTE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'oslo-bergen', label: 'ENGM–ENBR', hint: 'FL250' },
  { value: 'oslo-bergen-low', label: 'ENGM–ENBR', hint: 'FL120' },
  { value: 'oslo-torp', label: 'ENGM–ENTO', hint: 'short' },
] as const

export function mockRoute(id: MockRouteId): MockRoute | undefined {
  return id === 'none' ? undefined : MOCK_ROUTES[id]
}
