import { describe, expect, it } from 'vitest'
import { advanceDistance, rateForAngle } from './descentMath'

describe('rateForAngle', () => {
  it('matches the "5 × groundspeed" rule of thumb for a 3° path', () => {
    // exact: 101.27 ft/min per kt × tan(3°) ≈ 5.31 × GS
    expect(rateForAngle(100, 3)).toBeCloseTo(530.7, 0)
    expect(rateForAngle(450, 3)).toBeCloseTo(2388, 0)
  })
})

describe('advanceDistance', () => {
  it('counts down by groundspeed × time', () => {
    // 360 kt = 0.1 nm per second
    expect(advanceDistance(50, 360, 10)).toBeCloseTo(49, 6)
  })

  it('ignores time jumps (slew / reload) and paused sim', () => {
    expect(advanceDistance(50, 360, 60)).toBe(50)
    expect(advanceDistance(50, 360, 0)).toBe(50)
  })

  it('does not count down on the ground', () => {
    expect(advanceDistance(50, 10, 1)).toBe(50)
  })

  it('stops at zero', () => {
    expect(advanceDistance(0.01, 360, 1)).toBe(0)
  })
})
