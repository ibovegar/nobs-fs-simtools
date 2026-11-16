import { describe, expect, it } from 'vitest'
import { calculatorProfile } from './calculatorProfile'
import { DEFAULT_TOP_OF_DESCENT_FIELDS, topOfDescent } from './topOfDescent'
import { altitudeAt } from './verticalProfile'

describe('calculatorProfile', () => {
  // FL300 → 10,000 ft at 3°, 320 → 250 kt, no wind: 70 nm (62.8 descent + 7 slowing down).
  const fields = DEFAULT_TOP_OF_DESCENT_FIELDS
  const distance = topOfDescent(fields).distanceNm ?? 0
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

  it('flies the slow-down level at the end altitude', () => {
    const slow = waypoints.find((w) => w.waypoint.ident === 'SLOW')
    expect(profile.totalNm - (slow?.waypoint.distanceNm ?? 0)).toBe(7)
    expect(slow?.plannedFt).toBe(10000)
  })

  it('has no slow-down point without slowing down', () => {
    const level = calculatorProfile({ ...fields, endSpeed: 320 }, 63)
    expect(level.waypoints.map((w) => w.waypoint.ident)).toEqual(['', 'TARGET'])
  })
})
