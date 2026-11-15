import { describe, expect, it } from 'vitest'
import {
  advanceDistance,
  type DescentInputs,
  descentStatus,
  distanceFromEte,
  planDescent,
  rateForAngle,
} from './descentMath'

const base: DescentInputs = {
  currentAltitudeFt: 35000,
  targetAltitudeFt: 3000,
  groundSpeedKt: 450,
  distanceToTargetNm: 150,
  profile: { kind: 'angle', degrees: 3 },
  bufferNm: 0,
}

describe('rateForAngle', () => {
  it('matches the "5 × groundspeed" rule of thumb for a 3° path', () => {
    // exact: 101.27 ft/min per kt × tan(3°) ≈ 5.31 × GS
    expect(rateForAngle(100, 3)).toBeCloseTo(530.7, 0)
    expect(rateForAngle(450, 3)).toBeCloseTo(2388, 0)
  })
})

describe('planDescent', () => {
  it('needs ~318 ft per nm on a 3° path (close to the 3:1 rule)', () => {
    const plan = planDescent(base)
    expect(plan.altitudeToLoseFt).toBe(32000)
    expect(plan.descentDistanceNm).toBeCloseTo(32000 / 318.4, 1) // ≈ 100.5 nm
    expect(plan.distanceToTodNm).toBeCloseTo(150 - 100.5, 0)
  })

  it('adds the buffer to the TOD distance', () => {
    const plan = planDescent({ ...base, bufferNm: 10 })
    expect(plan.todFromTargetNm).toBeCloseTo(plan.descentDistanceNm + 10, 6)
  })

  it('computes time to TOD from groundspeed', () => {
    const plan = planDescent(base)
    expect(plan.timeToTodSec).toBeCloseTo((plan.distanceToTodNm / 450) * 3600, 6)
  })

  it('plans a fixed-rate descent from the time it takes', () => {
    const plan = planDescent({ ...base, profile: { kind: 'rate', fpm: 2000 } })
    // 32 000 ft at 2 000 fpm = 16 min; at 450 kt that is 120 nm
    expect(plan.descentDistanceNm).toBeCloseTo(120, 6)
    expect(plan.descentRateFpm).toBe(2000)
  })

  it('reports the rate needed to make the target from here', () => {
    const plan = planDescent({ ...base, distanceToTargetNm: 60 })
    // 60 nm at 450 kt = 8 min → 32 000 / 8 = 4 000 fpm
    expect(plan.requiredRateNowFpm).toBeCloseTo(4000, 6)
  })

  it('has no required rate when the target is already behind the buffer', () => {
    const plan = planDescent({ ...base, distanceToTargetNm: 5, bufferNm: 10 })
    expect(plan.requiredRateNowFpm).toBeNull()
  })

  it('never reports negative altitude to lose', () => {
    const plan = planDescent({ ...base, currentAltitudeFt: 2000 })
    expect(plan.altitudeToLoseFt).toBe(0)
    expect(plan.descentDistanceNm).toBe(0)
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

describe('descentStatus', () => {
  const status = (overrides: Partial<DescentInputs>) => {
    const inputs = { ...base, ...overrides }
    return descentStatus(planDescent(inputs), inputs.groundSpeedKt)
  }

  it('is no-data when slow / on the ground', () => {
    expect(status({ groundSpeedKt: 10 })).toBe('no-data')
  })

  it('is at-target when already low enough', () => {
    expect(status({ currentAltitudeFt: 3000 })).toBe('at-target')
  })

  it('is cruise when TOD is far ahead', () => {
    expect(status({})).toBe('cruise')
  })

  it('is approaching within two minutes of TOD', () => {
    // descent ≈ 100.5 nm; 450 kt covers 7.5 nm/min
    expect(status({ distanceToTargetNm: 110 })).toBe('approaching')
  })

  it('is descend at or past TOD', () => {
    expect(status({ distanceToTargetNm: 90 })).toBe('descend')
  })
})

describe('distanceFromEte', () => {
  it('converts flight-plan time left to distance', () => {
    expect(distanceFromEte(1800, 400)).toBeCloseTo(200, 6)
  })
  it('is zero when not moving', () => {
    expect(distanceFromEte(1800, 0)).toBe(0)
  })
})
