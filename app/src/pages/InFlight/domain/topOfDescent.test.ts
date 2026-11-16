import { describe, expect, it } from 'vitest'
import { DEFAULT_TOP_OF_DESCENT_FIELDS, editTopOfDescent, topOfDescent } from './topOfDescent'

// 30000 → 10000 ft, 320 → 250 kt, no wind, 3°
const base = DEFAULT_TOP_OF_DESCENT_FIELDS

describe('topOfDescent', () => {
  it('matches descent.vercel.app for its example values', () => {
    // 20000 ft / 6076.11549 / tan 3° = 62.8 nm, +7 for slowing 70 kt = 69.8 → 70 nm
    const r = topOfDescent(base)
    expect(r.distanceNm).toBe(70)
    expect(r.minutes).toBe(15) // 69.8 nm at 285 kt
    expect(r.errors).toEqual({})
  })

  it('adds a mile per 10 kt of tailwind', () => {
    expect(topOfDescent({ ...base, wind: 20 }).distanceNm).toBe(72)
  })

  it('flags both altitudes when the end is above the start', () => {
    const r = topOfDescent({ ...base, startAltitude: 5000 })
    expect(r.errors).toEqual({ startAltitude: true, endAltitude: true })
    expect(r.distanceNm).toBeNull()
  })

  it('flags a zero glideslope', () => {
    expect(topOfDescent({ ...base, glideSlope: 0 }).errors).toEqual({ glideSlope: true })
  })

  it('flags a headwind that cancels the speed', () => {
    expect(topOfDescent({ ...base, wind: -300 }).errors).toEqual({ wind: true })
  })
})

describe('editTopOfDescent', () => {
  it('starts with the vertical speed for the default glideslope', () => {
    // tan 3° × 285 kt / 60 × 6076.11549 = 1512.6
    expect(base.verticalSpeed).toBe(-1513)
  })

  it('derives the vertical speed from the glideslope and speeds', () => {
    expect(editTopOfDescent(base, 'glideSlope', 2.5).verticalSpeed).toBe(-1260)
    expect(editTopOfDescent(base, 'endSpeed', 320).verticalSpeed).toBe(-1698)
  })

  it('derives the glideslope from the vertical speed', () => {
    expect(editTopOfDescent(base, 'verticalSpeed', -1513).glideSlope).toBe(3)
    expect(editTopOfDescent(base, 'verticalSpeed', -2000).glideSlope).toBe(4)
  })
})
