import { describe, expect, it } from 'vitest'
import { greatCircleNm } from './geo'
import {
  buildRoute,
  collectRouteFixes,
  describeRoute,
  findRunwayEnd,
  fixesToLoad,
  isSamePlan,
  legFixIcao,
  type PlanAirport,
  type PlanLeg,
  type PlanRoute,
  planCruiseFt,
  type RouteIcao,
} from './route'

const FT = 0.3048
const wp = (ident: string, airport = ''): RouteIcao => ({ type: 'W', region: 'EN', airport, ident })
const leg = (type: number, fix: RouteIcao, extra: Partial<PlanLeg> = {}): PlanLeg => ({
  type,
  fixIcaoStruct: fix,
  altDesc: 0,
  altitude1: 0,
  altitude2: 0,
  speedRestriction: 0,
  ...extra,
})
const IF = 15
const TF = 18
const DF = 7
const CA = 2

const runway = {
  latitude: 60,
  longitude: 11,
  direction: 0,
  designation: '01-19',
  length: 3000,
  designatorCharPrimary: 1, // L
  designatorCharSecondary: 2, // R
  primaryElevation: 200,
  secondaryElevation: 210,
  primaryThresholdLength: 0,
  secondaryThresholdLength: 0,
}

const departure: PlanAirport = {
  lat: 60,
  lon: 11,
  altitude: 205,
  runways: [runway],
  departures: [
    {
      name: 'ALPHA1A',
      runwayTransitions: [
        {
          runwayNumber: 1,
          runwayDesignation: 1,
          legs: [
            leg(CA, wp('')),
            leg(DF, wp('ALPHA'), {
              altDesc: 3,
              altitude1: 5000 * FT,
              speedRestriction: 210,
              speedRestrictionDesc: 3,
            }),
          ],
        },
      ],
      commonLegs: [leg(TF, wp('BRAVO'), { altDesc: 2, altitude1: 7000 * FT })],
      enRouteTransitions: [],
    },
  ],
  arrivals: [],
  approaches: [],
}

const destination: PlanAirport = {
  lat: 60.3,
  lon: 5.2,
  altitude: 50,
  runways: [
    {
      ...runway,
      latitude: 60.3,
      longitude: 5.2,
      direction: 170,
      designation: '17-35',
      designatorCharPrimary: 0,
      designatorCharSecondary: 0,
      primaryElevation: 50,
    },
  ],
  departures: [],
  arrivals: [
    {
      name: 'DELTA1B',
      enRouteTransitions: [],
      commonLegs: [
        leg(IF, wp('DELTA')),
        leg(TF, wp('ECHO'), { altDesc: 1, altitude1: 10000 * FT, speedRestriction: 250 }),
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
      transitions: [{ name: 'ECHO', legs: [leg(IF, wp('ECHO'))] }],
      finalLegs: [
        leg(IF, wp('FOXTR', 'ENBR'), { altDesc: 1, altitude1: 3000 * FT }),
        leg(TF, { type: 'R', region: 'EN', airport: 'ENBR', ident: 'RW17' }),
      ],
    },
  ],
}

const enroute = (ident: string, via = '') => ({
  fixIcao: wp(ident),
  via,
  isPpos: false,
  hasLatLon: false,
  lat: 0,
  lon: 0,
  hasPointBearingDistance: false,
  referenceIcao: wp(''),
  bearing: 0,
  distance: 0,
})

const plan: PlanRoute = {
  departureAirport: { type: 'A', region: '', airport: '', ident: 'ENGM' },
  destinationAirport: { type: 'A', region: '', airport: '', ident: 'ENBR' },
  departureRunway: { number: '01', designator: 'L' },
  departure: 'ALPHA1A',
  departureTransition: '',
  enroute: [enroute('BRAVO'), enroute('CHARLIE', 'UL1'), enroute('DELTA')],
  destinationRunway: { number: '17', designator: '' },
  arrival: 'DELTA1B',
  arrivalTransition: '',
  approach: { type: 'ILS', runway: { number: '17', designator: '' }, suffix: '' },
  approachTransition: 'ECHO',
  cruiseAltitude: { altitude: 35000, isFlightLevel: true },
}

describe('findRunwayEnd', () => {
  it('places each threshold half a runway from the centre, with its elevation', () => {
    const r01 = findRunwayEnd(departure, '01', 'L')
    const r19 = findRunwayEnd(departure, '19', 'R')
    expect(r01?.lat).toBeCloseTo(60 - 1500 / 111_195, 4)
    expect(r19?.lat).toBeCloseTo(60 + 1500 / 111_195, 4)
    expect(r01?.courseDeg).toBe(0)
    expect(r19?.courseDeg).toBe(180)
    expect(r01?.elevationFt).toBeCloseTo(656.2, 0)
    expect(r19?.ident).toBe('19R')
  })

  it('accepts unpadded numbers and rejects wrong designators', () => {
    expect(findRunwayEnd(departure, '1', 'L')).toBeDefined()
    expect(findRunwayEnd(departure, '01', 'R')).toBeUndefined()
  })
})

describe('legFixIcao', () => {
  it('reads the pre-2024 string form', () => {
    expect(
      legFixIcao({ ...leg(TF, wp('')), fixIcaoStruct: undefined, fixIcao: 'WEN    BOLLY' }),
    ).toEqual({ type: 'W', region: 'EN', airport: '', ident: 'BOLLY' })
  })
})

describe('collectRouteFixes', () => {
  const { fixes, missingProcedures } = collectRouteFixes(plan, departure, destination)

  it('flies runway → SID → enroute → STAR → approach → runway, without repeats', () => {
    expect(fixes.map((f) => f.ident)).toEqual([
      'ENGM',
      'ALPHA',
      'BRAVO',
      'CHARLIE',
      'DELTA',
      'ECHO',
      'FOXTR',
      'ENBR',
    ])
    expect(missingProcedures).toEqual([])
  })

  it('keeps the runways and their elevation at the ends', () => {
    expect(fixes[0]?.runway).toBe('01L')
    expect(fixes[0]?.elevationFt).toBeCloseTo(656.2, 0)
    expect(fixes.slice(-1)[0]?.runway).toBe('17')
    expect(fixes.slice(-1)[0]?.phase).toBe('approach')
  })

  it('converts altitude and speed limits', () => {
    const byIdent = Object.fromEntries(fixes.map((f) => [f.ident, f]))
    expect(byIdent.ALPHA?.altitude).toEqual({ kind: 'atOrBelow', upperFt: 5000 })
    expect(byIdent.ALPHA?.speed).toEqual({ kind: 'atOrBelow', kt: 210 })
    expect(byIdent.BRAVO?.altitude).toEqual({ kind: 'atOrAbove', lowerFt: 7000 })
    expect(byIdent.ECHO?.altitude).toEqual({ kind: 'at', lowerFt: 10000, upperFt: 10000 })
    expect(byIdent.FOXTR?.altitude).toEqual({ kind: 'at', lowerFt: 3000, upperFt: 3000 })
  })

  it('reads the altitude set on an enroute leg, in feet or as a flight level', () => {
    const altitudes = [
      { altitude: 9500, isFlightLevel: false },
      { altitude: 240, isFlightLevel: true },
      null,
    ]
    const withAltitudes = {
      ...plan,
      enroute: plan.enroute.map((l, i) => ({ ...l, altitude: altitudes[i] })),
    }
    const read = collectRouteFixes(withAltitudes, departure, destination).fixes
    const at = (ident: string) => read.find((f) => f.ident === ident)
    expect(at('BRAVO')?.planAltitudeFt).toBe(9500)
    expect(at('CHARLIE')?.planAltitudeFt).toBe(24_000)
    expect(at('DELTA')?.planAltitudeFt).toBeUndefined()
    // It's shown, but stays out of the limits the profile is planned with.
    expect(at('CHARLIE')?.altitude).toBeUndefined()
  })

  it('tags each fix with its phase; a shared fix takes the procedure', () => {
    expect(fixes.map((f) => f.phase)).toEqual([
      'departure',
      'departure',
      'departure', // BRAVO: SID exit, also the first enroute fix
      'enroute',
      'arrival', // DELTA: last enroute fix, also the STAR's first
      'approach', // ECHO: STAR fix and approach transition
      'approach',
      'approach',
    ])
    expect(fixes[3]?.via).toBe('UL1')
  })

  it('reports procedures the database lacks and carries on without them', () => {
    const r = collectRouteFixes({ ...plan, departure: 'NOPE1A' }, departure, destination)
    expect(r.missingProcedures).toEqual(['NOPE1A'])
    expect(r.fixes.map((f) => f.ident).slice(0, 3)).toEqual(['ENGM', 'BRAVO', 'CHARLIE'])
  })

  it('falls back to the airports without runways or airport data', () => {
    const r = collectRouteFixes(
      { ...plan, departureRunway: { number: '', designator: '' } },
      departure,
      null,
    )
    expect(r.fixes[0]?.runway).toBeUndefined()
    expect(r.fixes[0]?.location).toEqual({ kind: 'point', lat: 60, lon: 11 })
    expect(r.fixes.slice(-1)[0]?.location.kind).toBe('icao')
  })
})

describe('fixesToLoad / buildRoute', () => {
  const { fixes } = collectRouteFixes(plan, departure, destination)
  const positions: Record<string, { lat: number; lon: number }> = {
    ALPHA: { lat: 60.2, lon: 11 },
    BRAVO: { lat: 60.3, lon: 10 },
    CHARLIE: { lat: 60.3, lon: 8 },
    DELTA: { lat: 60.3, lon: 6.5 },
    ECHO: { lat: 60.6, lon: 5.4 },
    // FOXTR deliberately missing
  }

  it('lists each database fix once', () => {
    expect(fixesToLoad(fixes).map((i) => i.ident)).toEqual([
      'ALPHA',
      'BRAVO',
      'CHARLIE',
      'DELTA',
      'ECHO',
      'FOXTR',
    ])
  })

  it('positions the fixes, drops unknown ones and adds up the legs', () => {
    const built = buildRoute(fixes, (icao) => positions[icao.ident])
    expect(built.missingFixes).toEqual(['FOXTR'])
    expect(built.waypoints.map((w) => w.ident)).toEqual([
      'ENGM',
      'ALPHA',
      'BRAVO',
      'CHARLIE',
      'DELTA',
      'ECHO',
      'ENBR',
    ])
    const [a, b] = built.waypoints
    expect(b?.legNm).toBeCloseTo(greatCircleNm(a as never, b as never), 6)
    const sum = built.waypoints.reduce((s, w) => s + w.legNm, 0)
    expect(built.totalNm).toBeCloseTo(sum, 6)
    expect(built.waypoints.slice(-1)[0]?.distanceNm).toBeCloseTo(sum, 6)
  })
})

describe('planCruiseFt', () => {
  it('reads feet or flight levels', () => {
    expect(planCruiseFt(plan)).toBe(35000)
    expect(planCruiseFt({ ...plan, cruiseAltitude: { altitude: 350, isFlightLevel: true } })).toBe(
      35000,
    )
    expect(
      planCruiseFt({ ...plan, cruiseAltitude: { altitude: 8500, isFlightLevel: false } }),
    ).toBe(8500)
    expect(planCruiseFt({ ...plan, cruiseAltitude: null })).toBeUndefined()
  })
})

describe('describeRoute', () => {
  it('names the airports, runways and procedures', () => {
    expect(describeRoute(plan)).toEqual({
      title: 'ENGM 01L → ENBR 17',
      procedures: 'ALPHA1A · DELTA1B · ILS 17',
    })
  })

  it('copes with a bare airport-to-airport plan', () => {
    const bare = {
      ...plan,
      departureRunway: { number: '', designator: '' },
      destinationRunway: { number: '', designator: '' },
      departure: '',
      arrival: '',
      approach: { type: '', runway: { number: '', designator: '' }, suffix: '' },
    }
    expect(describeRoute(bare)).toEqual({ title: 'ENGM → ENBR', procedures: '' })
  })
})

describe('isSamePlan', () => {
  it('is true for an identical read of the plan', () => {
    expect(isSamePlan(plan, structuredClone(plan))).toBe(true)
  })

  it('is false when the route or cruise altitude changes', () => {
    expect(isSamePlan(plan, { ...plan, enroute: plan.enroute.slice(1) })).toBe(false)
    expect(
      isSamePlan(plan, { ...plan, cruiseAltitude: { altitude: 330, isFlightLevel: true } }),
    ).toBe(false)
  })
})
