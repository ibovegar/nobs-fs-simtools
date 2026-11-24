import { describe, expect, it } from 'vitest'
import { type DescentGuidanceInput, descentGuidance } from './descentGuidance'
import type { RouteWaypoint } from './route'
import type { PlannedWaypoint } from './verticalProfile'

const fix = (
  ident: string,
  distanceNm: number,
  plannedFt: number,
  extra: Partial<RouteWaypoint> = {},
): PlannedWaypoint<RouteWaypoint> => ({
  waypoint: {
    key: ident,
    ident,
    phase: 'approach',
    distanceNm,
    lat: 0,
    lon: 0,
    legNm: 0,
    ...extra,
  },
  plannedFt,
})

const waypoints = [
  fix('START', 0, 10_000, { phase: 'arrival' }),
  fix('REF', 50, 4000, { speed: { kind: 'atOrBelow', kt: 120 } }),
  fix('RWY', 70, 50, { runway: '17' }),
]

// 180 kt is 3 nm a minute: 20 nm to REF takes 6:40.
const input = (over: Partial<DescentGuidanceInput> = {}): DescentGuidanceInput => ({
  waypoints,
  referenceIndex: 1,
  flownNm: 30,
  altitudeFt: 8000,
  groundSpeedKt: 180,
  iasKt: 140,
  descentFtPerNm: 200,
  descentSpeedKias: 140,
  ...over,
})

describe('descentGuidance: vertical speed', () => {
  it('is the rate that reaches the reference altitude from here', () => {
    expect(descentGuidance(input())?.rateFpm).toBeCloseTo(600, 6)
  })

  it('follows the groundspeed, so wind is corrected', () => {
    expect(descentGuidance(input({ groundSpeedKt: 150 }))?.rateFpm).toBeCloseTo(500, 6)
  })

  it('caps a descent that is too steep, and names the fix', () => {
    const g = descentGuidance(input({ altitudeFt: 12_000 }))
    expect(g?.rateFpm).toBeCloseTo(900, 6)
    expect(g?.tooHighFor).toBe('REF')
  })

  it('asks for level flight below the path', () => {
    const g = descentGuidance(input({ altitudeFt: 3900 }))
    expect(g?.rateFpm).toBe(0)
    expect(g?.tooHighFor).toBeUndefined()
  })

  it('meets a lower limit before the reference', () => {
    const route = [
      fix('START', 0, 10_000, { phase: 'arrival' }),
      fix('LIMIT', 40, 5000, { phase: 'arrival' }),
      fix('REF', 50, 4000),
      fix('RWY', 70, 50),
    ]
    // 3,000 ft in 10 nm (3:20) to LIMIT, against 4,000 ft in 20 nm to REF.
    const g = descentGuidance(input({ waypoints: route, referenceIndex: 2 }))
    expect(g?.rateFpm).toBeCloseTo(900, 6)
  })

  it('aims at the runway once past the reference', () => {
    const g = descentGuidance(input({ flownNm: 55, altitudeFt: 3000 }))
    expect(g?.rateFpm).toBeCloseTo(590, 6)
  })

  it('has no rate right at the end of the route', () => {
    expect(descentGuidance(input({ flownNm: 69.5, altitudeFt: 200 }))?.rateFpm).toBeUndefined()
  })

  it('needs a position, altitude and groundspeed', () => {
    expect(descentGuidance(input({ flownNm: undefined }))).toBeUndefined()
    expect(descentGuidance(input({ altitudeFt: undefined }))).toBeUndefined()
    expect(descentGuidance(input({ groundSpeedKt: 10 }))).toBeUndefined()
  })
})

describe('descentGuidance: speed', () => {
  it('holds the descent speed with no cue while the limit is far off', () => {
    const g = descentGuidance(input())
    expect(g?.speedKias).toBe(140)
    expect(g?.slowdown).toBeUndefined()
  })

  it('cues the slowdown a few miles before it is due', () => {
    // 20 kt at 0.5 kt/s is 40 s (2 nm), plus 1 nm of margin, so due 3 nm out.
    const g = descentGuidance(input({ flownNm: 44 }))
    expect(g?.speedKias).toBe(140)
    expect(g?.slowdown?.kt).toBe(120)
    expect(g?.slowdown?.inNm).toBeCloseTo(3, 6)
  })

  it('says slow down now when it is due', () => {
    const g = descentGuidance(input({ flownNm: 48 }))
    expect(g?.speedKias).toBe(120)
    expect(g?.slowdown).toEqual({ kt: 120, inNm: 0 })
  })

  it('drops the cue once at the limit, and keeps the limit after the fix', () => {
    const slowed = descentGuidance(input({ flownNm: 48, iasKt: 121 }))
    expect(slowed?.speedKias).toBe(120)
    expect(slowed?.slowdown).toBeUndefined()
    expect(descentGuidance(input({ flownNm: 55, altitudeFt: 3000 }))?.speedKias).toBe(120)
  })

  it('cues the approach speed before 5 nm from the runway', () => {
    // 42 kt at 0.5 kt/s is 84 s (4.2 nm), plus 1 nm: due 5.2 nm before the 65 nm point.
    const g = descentGuidance(
      input({ flownNm: 58, altitudeFt: 2000, iasKt: 120, approachSpeedKias: 78 }),
    )
    expect(g?.speedKias).toBe(120)
    expect(g?.slowdown?.kt).toBe(78)
    expect(g?.slowdown?.inNm).toBeCloseTo(1.8, 6)
  })

  it('flies the approach speed from 5 nm out', () => {
    const g = descentGuidance(
      input({ flownNm: 66, altitudeFt: 1200, iasKt: 80, approachSpeedKias: 78 }),
    )
    expect(g?.speedKias).toBe(78)
    expect(g?.slowdown).toBeUndefined()
  })

  it('without an approach speed, keeps the last limit to the runway', () => {
    expect(descentGuidance(input({ flownNm: 66, altitudeFt: 1200 }))?.speedKias).toBe(120)
  })

  it('has no speed without a descent speed or a limit behind', () => {
    expect(descentGuidance(input({ descentSpeedKias: undefined }))?.speedKias).toBeUndefined()
  })
})
