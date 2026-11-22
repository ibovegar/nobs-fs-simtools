import { describe, expect, it } from 'vitest'
import {
  angleForVerticalSpeed,
  DEFAULT_TOP_OF_DESCENT_FIELDS,
  liveVerticalSpeedFpm,
  topOfDescent,
} from './topOfDescent'

// 30000 → 10000 ft at 3°
const base = DEFAULT_TOP_OF_DESCENT_FIELDS

describe('topOfDescent', () => {
  it('reaches the end altitude at the target', () => {
    // 20000 ft / 6076.12 / tan 3° = 62.8 nm
    const r = topOfDescent(base, 250)
    expect(r.distanceNm).toBe(63)
    expect(r.minutes).toBe(15)
    expect(r.errors).toEqual({})
  })

  it('has the same distance at any speed', () => {
    expect(topOfDescent(base, 140).distanceNm).toBe(topOfDescent(base, 320).distanceNm)
  })

  it('rounds to the nearest mile, not up', () => {
    const caravan = { ...base, startAltitude: 12_000, endAltitude: 4000 }
    expect(topOfDescent(caravan, 160).distanceNm).toBe(25)
  })

  it('adds the level-off distance the pilot keeps', () => {
    expect(topOfDescent({ ...base, levelOffNm: 7 }, 250).distanceNm).toBe(70)
  })

  it('plans the V/S that holds the glideslope at the speed', () => {
    expect(topOfDescent(base, 285).plannedVerticalSpeedFpm).toBe(-1513)
  })

  it('flags both altitudes when the end is above the start', () => {
    const r = topOfDescent({ ...base, startAltitude: 5000 }, 250)
    expect(r.errors).toEqual({ startAltitude: true, endAltitude: true })
    expect(r.distanceNm).toBeNull()
  })

  it('flags a zero glideslope and a zero speed', () => {
    expect(topOfDescent({ ...base, glideSlope: 0 }, 250).errors).toEqual({ glideSlope: true })
    expect(topOfDescent(base, 0).errors).toEqual({ descentSpeed: true })
  })
})

describe('liveVerticalSpeedFpm', () => {
  it('holds the glideslope at the live groundspeed, to the nearest 50', () => {
    expect(liveVerticalSpeedFpm(3, 200, -500)).toBe(-1050)
    expect(liveVerticalSpeedFpm(3, 147, -500)).toBe(-800)
  })

  it('uses the planned V/S without a moving aircraft', () => {
    expect(liveVerticalSpeedFpm(3, undefined, -730)).toBe(-750)
    expect(liveVerticalSpeedFpm(3, 10, -730)).toBe(-750)
  })
})

describe('angleForVerticalSpeed', () => {
  it('is the inverse of the planned V/S', () => {
    expect(angleForVerticalSpeed(285, 1513)).toBeCloseTo(3, 2)
    expect(angleForVerticalSpeed(285, 2000)).toBeCloseTo(3.96, 2)
  })

  it('stays within the glideslope range', () => {
    expect(angleForVerticalSpeed(285, 20_000)).toBe(10)
    expect(angleForVerticalSpeed(285, 1)).toBe(0.5)
    expect(angleForVerticalSpeed(0, 1000)).toBe(0.5)
  })
})
