import { describe, expect, it } from 'vitest'
import { cruiseRateFpm, flightProgress, positionOnRoute } from './flightProgress'
import { computeVerticalProfile } from './verticalProfile'

describe('positionOnRoute', () => {
  // Along the equator: one degree of longitude ≈ 60.04 nm.
  const route = [
    { lat: 0, lon: 0, distanceNm: 0 },
    { lat: 0, lon: 1, distanceNm: 60.04 },
    { lat: 0, lon: 2, distanceNm: 120.08 },
  ]

  it('projects onto the nearest leg', () => {
    const p = positionOnRoute(route, { lat: 0.1, lon: 0.5 })
    expect(p?.distanceNm).toBeCloseTo(30.02, 1)
    expect(p?.offRouteNm).toBeCloseTo(6, 1)
    expect(p?.nextIndex).toBe(1)
  })

  it('works on later legs', () => {
    const p = positionOnRoute(route, { lat: -0.05, lon: 1.5 })
    expect(p?.distanceNm).toBeCloseTo(90.06, 1)
    expect(p?.nextIndex).toBe(2)
  })

  it('clamps before the start', () => {
    const p = positionOnRoute(route, { lat: 0, lon: -0.5 })
    expect(p?.distanceNm).toBe(0)
    expect(p?.offRouteNm).toBeCloseTo(30, 0)
  })

  it('is undefined without a route', () => {
    expect(positionOnRoute([], { lat: 0, lon: 0 })).toBeUndefined()
  })
})

describe('flightProgress', () => {
  // TOC at 100 nm, TOD at 300 nm, 400 nm in all.
  const profile = computeVerticalProfile({
    waypoints: [
      { distanceNm: 0, phase: 'departure' },
      { distanceNm: 400, phase: 'approach' },
    ],
    startFt: 0,
    endFt: 0,
    cruiseFt: 30000,
    climbFtPerNm: 300,
    descentFtPerNm: 300,
  })
  const at = (distanceNm: number, altitudeFt: number | undefined, groundSpeedKt = 400) =>
    flightProgress({
      profile,
      position: { distanceNm, offRouteNm: 0, nextIndex: 1 },
      altitudeFt,
      groundSpeedKt,
    })

  it('is climb before TOC', () => {
    const p = at(50, 15000)
    expect(p.status).toBe('climb')
    expect(p.toTocNm).toBeCloseTo(50, 6)
    expect(p.timeToTocSec).toBeCloseTo(450, 6)
  })

  it('gives the V/S that reaches cruise at TOC', () => {
    // 15,000 ft to climb in 50 nm at 400 kt (7.5 min): 2,000 fpm.
    expect(at(50, 15000).climbRateToTocFpm).toBeCloseTo(2000, 6)
    // Behind the plan: more is needed.
    expect(at(50, 10000).climbRateToTocFpm).toBeCloseTo(2666.7, 1)
  })

  it('has no climb V/S once level or past TOC', () => {
    expect(at(80, 30000).climbRateToTocFpm).toBeUndefined()
    expect(at(150, 28000).climbRateToTocFpm).toBeUndefined()
    expect(at(50, 15000, 0).climbRateToTocFpm).toBeUndefined()
  })

  it('is cruise between TOC and TOD', () => {
    const p = at(200, 30000)
    expect(p.status).toBe('cruise')
    expect(p.toTodNm).toBeCloseTo(100, 6)
    expect(p.timeToTodSec).toBeCloseTo(900, 6)
    expect(p.remainingNm).toBeCloseTo(200, 6)
  })

  it('counts as cruise when already level before the planned TOC', () => {
    expect(at(80, 30000).status).toBe('cruise')
  })

  it('warns two minutes before TOD', () => {
    expect(at(290, 30000).status).toBe('approaching')
  })

  it('reports the path deviation in the descent', () => {
    const high = at(320, 30000)
    expect(high.status).toBe('descend')
    expect(high.pathAltitudeFt).toBeCloseTo(24000, 6)
    expect(high.deviationFt).toBeCloseTo(6000, 6)
    expect(at(320, 24100).status).toBe('on-path')
    expect(at(320, 23000).status).toBe('below-path')
  })

  it('is standby without movement or live data', () => {
    expect(at(200, 30000, 0).status).toBe('standby')
    expect(at(200, undefined).status).toBe('standby')
    const none = flightProgress({
      profile,
      position: undefined,
      altitudeFt: 30000,
      groundSpeedKt: 400,
    })
    expect(none.status).toBe('standby')
    expect(none.toTodNm).toBeCloseTo(300, 6)
  })
})

describe('cruiseRateFpm', () => {
  it('is zero at the cruise altitude', () => {
    expect(cruiseRateFpm(30000, 30000)).toBe(0)
    expect(cruiseRateFpm(29920, 30000)).toBe(0)
    expect(cruiseRateFpm(30080, 30000)).toBe(0)
  })

  it('closes the gap in a minute, capped', () => {
    expect(cruiseRateFpm(29700, 30000)).toBe(300)
    expect(cruiseRateFpm(30400, 30000)).toBe(-400)
    expect(cruiseRateFpm(25000, 30000)).toBe(1500)
    expect(cruiseRateFpm(34000, 30000)).toBe(-1500)
  })
})
