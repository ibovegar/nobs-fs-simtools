import { describe, expect, it } from 'vitest'
import { greatCircleNm, positionOnRoute } from '~/pages/InFlight/domain'
import { mockRoutePath, pointAlong } from './mockRoutePath'
import { MOCK_ROUTES } from './mockRoutes'

describe('mockRoutePath', () => {
  const path = mockRoutePath(MOCK_ROUTES['oslo-bergen'], false)

  it('builds the whole Oslo–Bergen route with its procedures', () => {
    expect(path.waypoints.map((w) => w.ident)).toEqual([
      'ENGM',
      'GM401',
      'GM402',
      'NOLEX',
      'VADUX',
      'HALIX',
      'BERGI',
      'FANEX',
      'BR17I',
      'BR17F',
      'ENBR',
    ])
    expect(path.totalNm).toBeGreaterThan(180)
    expect(path.totalNm).toBeLessThan(260)
    expect(path.departureElevationFt).toBeCloseTo(682, 0)
    expect(path.cruiseFt).toBe(25000)
  })

  it('leaves out the droppable fix when it is missing', () => {
    const without = mockRoutePath(MOCK_ROUTES['oslo-bergen'], true)
    expect(without.waypoints.map((w) => w.ident)).not.toContain('VADUX')
  })
})

describe('pointAlong', () => {
  const path = mockRoutePath(MOCK_ROUTES['oslo-bergen'], false)

  it('puts the aircraft on the route at the given distance', () => {
    for (const nm of [0, 12.5, 80, 150, path.totalNm]) {
      const p = pointAlong(path, nm)
      if (!p) throw new Error('no point')
      const on = positionOnRoute(path.waypoints, p)
      expect(on?.distanceNm).toBeCloseTo(nm, 1)
      expect(on?.offRouteNm).toBeLessThan(0.05)
    }
  })

  it('clamps to the ends', () => {
    const end = path.waypoints.at(-1)
    const p = pointAlong(path, path.totalNm + 50)
    if (!p || !end) throw new Error('no point')
    expect(greatCircleNm(p, end)).toBeCloseTo(0, 6)
  })
})
