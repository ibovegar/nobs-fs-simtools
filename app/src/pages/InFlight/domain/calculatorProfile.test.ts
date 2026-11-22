import { describe, expect, it } from 'vitest'
import { calculatorProfile } from './calculatorProfile'
import { DEFAULT_TOP_OF_DESCENT_FIELDS, topOfDescent } from './topOfDescent'
import { altitudeAt } from './verticalProfile'

describe('calculatorProfile', () => {
  // FL300 → 10,000 ft at 3° with 7 nm kept level: 70 nm (62.8 descent + 7).
  const fields = { ...DEFAULT_TOP_OF_DESCENT_FIELDS, levelOffNm: 7 }
  const distance = topOfDescent(fields, 285).distanceNm ?? 0
  const { profile, waypoints } = calculatorProfile(fields, distance)

  it('puts TOD the calculator distance before the target', () => {
    expect(distance).toBe(70)
    expect(profile.totalNm - profile.todNm).toBe(70)
    expect(altitudeAt(profile.points, profile.todNm)).toBe(30000)
    expect(altitudeAt(profile.points, profile.totalNm)).toBe(10000)
  })

  it('shows some level flight before TOD', () => {
    expect(profile.todNm).toBeCloseTo(17.5, 6)
  })

  it('flies the level-off at the end altitude', () => {
    const level = waypoints.find((w) => w.waypoint.ident === 'LEVEL')
    expect(profile.totalNm - (level?.waypoint.distanceNm ?? 0)).toBe(7)
    expect(level?.plannedFt).toBe(10000)
  })

  it('has no level-off point without one', () => {
    const direct = calculatorProfile({ ...fields, levelOffNm: 0 }, 63)
    expect(direct.waypoints.map((w) => w.waypoint.ident)).toEqual(['', 'TARGET'])
  })
})
