import { describe, expect, it } from 'vitest'
import type { DescentReference } from './descentReference'
import type { RoutePhase, RouteWaypoint } from './route'
import type { PlannedWaypoint, VerticalProfile } from './verticalProfile'
import { missingRouteNote, referenceNote, waypointRows, waypointSummary } from './waypointTable'

const fix = (
  ident: string,
  phase: RoutePhase,
  distanceNm: number,
  extra: Partial<RouteWaypoint> = {},
  plannedFt = 10000,
  meetsLimit = true,
): PlannedWaypoint<RouteWaypoint> => ({
  waypoint: { key: ident, ident, phase, distanceNm, lat: 0, lon: 0, legNm: 0, ...extra },
  plannedFt,
  meetsLimit,
})

const waypoints = [
  fix('RW27', 'departure', 0, { runway: '27' }, 100),
  fix('SID1', 'departure', 5),
  fix('ENR', 'enroute', 50, { via: 'UL9' }, 35000),
  fix('IAF', 'approach', 90, { altitude: { kind: 'between', lowerFt: 3000, upperFt: 5000 } }),
  fix('RW09', 'approach', 100, { runway: '09' }, 50, false),
]

const profile: VerticalProfile = {
  points: [],
  tocNm: 20,
  todNm: 70,
  topFt: 35000,
  reachesCruise: true,
  totalNm: 100,
}

const reference: DescentReference = { index: 3, source: 'default', altitudeFt: 5000 }

const fixRows = (rows: ReturnType<typeof waypointRows>) => rows.filter((r) => r.kind === 'fix')

describe('waypointRows', () => {
  it('slots TOC and TOD in between the fixes by distance', () => {
    const rows = waypointRows({ waypoints, profile, reference })
    expect(rows.map((r) => r.key)).toEqual([
      'RW27-0',
      'SID1-1',
      'TOC',
      'ENR-2',
      'TOD',
      'IAF-3',
      'RW09-4',
    ])
  })

  it('merges TOC and TOD into one T/D row when they meet', () => {
    const rows = waypointRows({ waypoints, profile: { ...profile, todNm: 20.2 }, reference })
    expect(rows.filter((r) => r.kind === 'top').map((r) => r.key)).toEqual(['T/D'])
  })

  it('labels each fix with the reference, its runway, its airway or its phase', () => {
    const subs = fixRows(waypointRows({ waypoints, profile, reference })).map((r) => r.sub)
    expect(subs).toEqual(['RWY 27', 'SID', 'UL9', 'TOD REF', 'RWY 09'])
  })

  it('formats the cells: limits floor below ceiling, missed limits flagged', () => {
    const [, , , iaf, rwy] = fixRows(waypointRows({ waypoints, profile, reference }))
    expect(iaf?.limitLines).toEqual(['5,000B', '3,000A'])
    expect(iaf?.missesLimit).toBe(false)
    expect(rwy?.missesLimit).toBe(true)
    expect(rwy?.limitLines).toEqual([])
  })

  it('only offers fixes after the SID as the reference', () => {
    const rows = fixRows(waypointRows({ waypoints, profile, reference }))
    expect(rows.map((r) => r.flag !== undefined)).toEqual([false, false, true, true, true])
  })

  it('shows distance to go, dims flown rows and highlights the next fix while flying', () => {
    const rows = waypointRows({ waypoints, profile, reference, flownNm: 30, nextIndex: 2 })
    expect(rows.map((r) => r.state)).toEqual([
      'passed',
      'passed',
      'passed',
      'next',
      'upcoming',
      'upcoming',
      'upcoming',
    ])
    expect(rows.map((r) => r.distance)).toEqual(['', '', '', '20', '40', '60', '70'])
  })

  it('names the flag for going back to the default once a fix is picked', () => {
    const picked = { ...reference, source: 'selected' } as const
    const iaf = fixRows(waypointRows({ waypoints, profile, reference: picked }))[3]
    expect(iaf?.flag?.label).toBe('Back to the default TOD reference')
    const enr = fixRows(waypointRows({ waypoints, profile, reference: picked }))[2]
    expect(enr?.flag?.label).toBe('Plan the TOD to ENR')
  })
})

describe('waypointSummary', () => {
  it('counts the fixes and warns when some are missing', () => {
    expect(waypointSummary(5, 100, false)).toBe('5 fixes  ·  100 nm')
    expect(waypointSummary(5, 100, true)).toBe('5 fixes  ·  100 nm  ·  some missing')
  })
})

describe('missingRouteNote', () => {
  it('is undefined when nothing is missing', () => {
    expect(missingRouteNote([], [])).toBeUndefined()
  })

  it('lists the missing procedures and fixes', () => {
    expect(missingRouteNote(['STAR1'], ['ABC'])).toBe(
      'Not in the database: STAR1. Fixes not found (left out): ABC.',
    )
  })
})

describe('referenceNote', () => {
  it('describes the default reference', () => {
    expect(referenceNote(reference, waypoints, 35000)).toBe(
      "TOD planned to IAF at 5,000 ft, the first approach fix with an altitude. Tap a fix's flag to plan to it instead.",
    )
  })

  it('explains a picked fix without an altitude', () => {
    expect(referenceNote({ index: 2, source: 'selected' }, waypoints, 35000)).toMatch(
      /^ENR has no altitude limit/,
    )
  })
})
