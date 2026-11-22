import { describe, expect, it } from 'vitest'
import type { RoutePhase } from './route'
import {
  altitudeAt,
  computeVerticalProfile,
  meetsConstraint,
  type ProfileInputs,
  type ProfileWaypoint,
  planWaypoints,
} from './verticalProfile'

const at = (distanceNm: number, phase: RoutePhase = 'enroute', extra = {}): ProfileWaypoint => ({
  distanceNm,
  phase,
  ...extra,
})

const base: ProfileInputs = {
  waypoints: [at(0, 'departure'), at(200), at(400, 'approach')],
  startFt: 0,
  endFt: 0,
  cruiseFt: 30000,
  climbFtPerNm: 300,
  descentFtPerNm: 300,
}

describe('computeVerticalProfile', () => {
  it('climbs to cruise, cruises, and descends to the runway', () => {
    const p = computeVerticalProfile(base)
    expect(p.tocNm).toBeCloseTo(100, 6)
    expect(p.todNm).toBeCloseTo(300, 6)
    expect(p.topFt).toBe(30000)
    expect(p.reachesCruise).toBe(true)
    expect(p.totalNm).toBe(400)
    expect(altitudeAt(p.points, 50)).toBeCloseTo(15000, 6)
    expect(altitudeAt(p.points, 350)).toBeCloseTo(15000, 6)
    expect(altitudeAt(p.points, 400)).toBe(0)
  })

  it('peaks where climb and descent meet on a short route', () => {
    const p = computeVerticalProfile({
      ...base,
      waypoints: [at(0, 'departure'), at(100, 'approach')],
    })
    expect(p.reachesCruise).toBe(false)
    expect(p.tocNm).toBeCloseTo(50, 6)
    expect(p.todNm).toBeCloseTo(50, 6)
    expect(p.topFt).toBeCloseTo(15000, 6)
  })

  it('starts and ends at the runway elevations', () => {
    const p = computeVerticalProfile({ ...base, startFt: 700, endFt: 100 })
    expect(altitudeAt(p.points, 0)).toBe(700)
    expect(altitudeAt(p.points, 400)).toBe(100)
    expect(p.tocNm).toBeCloseTo((30000 - 700) / 300, 6)
    expect(p.todNm).toBeCloseTo(400 - (30000 - 100) / 300, 6)
  })

  it('levels off below a SID "at or below" limit until the fix', () => {
    const p = computeVerticalProfile({
      ...base,
      waypoints: [
        at(0, 'departure'),
        at(10, 'departure', { altitude: { kind: 'atOrBelow', upperFt: 2000 } }),
        at(400, 'approach'),
      ],
    })
    expect(altitudeAt(p.points, 8)).toBeCloseTo(2000, 6)
    expect(altitudeAt(p.points, 10)).toBeCloseTo(2000, 6)
    expect(altitudeAt(p.points, 20)).toBeCloseTo(5000, 6)
    expect(p.tocNm).toBeCloseTo(10 + 28000 / 300, 6)
  })

  it('descends earlier to make a STAR "at" limit', () => {
    const p = computeVerticalProfile({
      ...base,
      waypoints: [
        at(0, 'departure'),
        at(350, 'arrival', { altitude: { kind: 'at', lowerFt: 10000, upperFt: 10000 } }),
        at(400, 'approach'),
      ],
    })
    expect(altitudeAt(p.points, 350)).toBeCloseTo(10000, 6)
    expect(altitudeAt(p.points, 360)).toBeCloseTo(10000, 6)
    expect(p.todNm).toBeCloseTo(350 - 20000 / 300, 6)
  })

  it('stays up for an approach "at or above" limit', () => {
    const p = computeVerticalProfile({
      ...base,
      waypoints: [
        at(0, 'departure'),
        at(390, 'approach', { altitude: { kind: 'atOrAbove', lowerFt: 5000 } }),
        at(400, 'approach'),
      ],
    })
    expect(altitudeAt(p.points, 390)).toBeCloseTo(5000, 6)
    expect(p.todNm).toBeCloseTo(390 - 25000 / 300, 6)
  })

  it('ignores descent limits in the climb and climb limits in the descent', () => {
    const p = computeVerticalProfile({
      ...base,
      waypoints: [
        at(0, 'departure'),
        at(20, 'enroute', { altitude: { kind: 'atOrBelow', upperFt: 2000 } }),
        at(400, 'approach'),
      ],
    })
    expect(altitudeAt(p.points, 20)).toBeCloseTo(6000, 6)
  })

  it('copes with a single waypoint', () => {
    const p = computeVerticalProfile({ ...base, waypoints: [at(0)] })
    expect(p.totalNm).toBe(0)
    expect(p.points).toHaveLength(1)
  })
})

describe('computeVerticalProfile with a reference fix', () => {
  it('plans the descent from cruise to the fix, level from there until the runway path', () => {
    const waypoints = [at(0, 'departure'), at(200), at(350, 'approach'), at(400, 'approach')]
    const p = computeVerticalProfile({
      ...base,
      waypoints,
      reference: { index: 2, altitudeFt: 3000 },
    })
    expect(p.todNm).toBeCloseTo(350 - 27000 / 300, 6)
    expect(altitudeAt(p.points, 350)).toBeCloseTo(3000, 6)
    expect(altitudeAt(p.points, 370)).toBeCloseTo(3000, 6)
    expect(altitudeAt(p.points, 390)).toBeCloseTo(3000, 6)
    expect(altitudeAt(p.points, 400)).toBe(0)
    // Without it, the descent runs straight to the runway.
    expect(computeVerticalProfile({ ...base, waypoints }).todNm).toBeCloseTo(300, 6)
  })

  it('runs straight to a picked fix, past the limits before it', () => {
    const waypoints = [
      at(0, 'departure'),
      at(200),
      at(350, 'approach', { altitude: { kind: 'atOrBelow', upperFt: 7000 } }),
      at(380, 'approach'),
      at(400, 'approach'),
    ]
    const honoured = computeVerticalProfile({
      ...base,
      waypoints,
      reference: { index: 3, altitudeFt: 4000 },
    })
    expect(honoured.todNm).toBeCloseTo(350 - 23000 / 300, 6)
    expect(altitudeAt(honoured.points, 350)).toBeCloseTo(7000, 6)

    const picked = computeVerticalProfile({
      ...base,
      waypoints,
      reference: { index: 3, altitudeFt: 4000, overridesEarlierLimits: true },
    })
    expect(picked.todNm).toBeCloseTo(380 - 26000 / 300, 6)
    expect(altitudeAt(picked.points, 350)).toBeCloseTo(13000, 6)
    expect(altitudeAt(picked.points, 380)).toBeCloseTo(4000, 6)
  })

  it('applies in any phase', () => {
    const p = computeVerticalProfile({
      ...base,
      waypoints: [at(0, 'departure'), at(200), at(300), at(400, 'approach')],
      reference: { index: 2, altitudeFt: 10000 },
    })
    expect(altitudeAt(p.points, 300)).toBeCloseTo(10000, 6)
    expect(p.todNm).toBeCloseTo(300 - 20000 / 300, 6)
  })

  it('crosses the fix at its altitude even below the path from the runway', () => {
    const p = computeVerticalProfile({
      ...base,
      waypoints: [
        at(0, 'departure'),
        at(200),
        at(300),
        at(350, 'approach', { altitude: { kind: 'atOrAbove', lowerFt: 20000 } }),
        at(400, 'approach'),
      ],
      reference: { index: 2, altitudeFt: 5000 },
    })
    expect(altitudeAt(p.points, 300)).toBeCloseTo(5000, 6)
    expect(altitudeAt(p.points, 350)).toBeCloseTo(5000, 6)
    expect(altitudeAt(p.points, 387.5)).toBeCloseTo(5000, 6)
    expect(altitudeAt(p.points, 400)).toBe(0)
    expect(p.todNm).toBeCloseTo(300 - 25000 / 300, 6)
  })
})

describe('meetsConstraint', () => {
  it('checks lower and upper limits with a tolerance', () => {
    expect(meetsConstraint({ kind: 'atOrAbove', lowerFt: 5000 }, 4950)).toBe(true)
    expect(meetsConstraint({ kind: 'atOrAbove', lowerFt: 5000 }, 4800)).toBe(false)
    expect(meetsConstraint({ kind: 'atOrBelow', upperFt: 5000 }, 5300)).toBe(false)
    expect(meetsConstraint({ kind: 'between', lowerFt: 5000, upperFt: 7000 }, 6000)).toBe(true)
  })
})

describe('planWaypoints', () => {
  it('gives each waypoint its planned altitude and flags missed limits', () => {
    const waypoints = [
      at(0, 'departure'),
      at(10, 'departure', { altitude: { kind: 'atOrAbove', lowerFt: 5000 } }),
      at(400, 'approach'),
    ]
    const planned = planWaypoints(waypoints, computeVerticalProfile({ ...base, waypoints }))
    expect(planned.map((p) => p.plannedFt)).toEqual([0, 3000, 0])
    // 300 ft/nm can't make 5000 ft by 10 nm.
    expect(planned.map((p) => p.meetsLimit)).toEqual([true, false, true])
    expect(planned[1]?.waypoint).toBe(waypoints[1])
  })
})
