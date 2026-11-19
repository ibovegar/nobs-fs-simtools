import { describe, expect, it } from 'vitest'
import { conditionValues, DEFAULT_TAKEOFF_SETUP, roundConditionFill, withCondition } from './setup'
import { LB_PER_KG } from './takeoffMath'

describe('roundConditionFill', () => {
  it('rounds the weight to 10 in the unit shown', () => {
    expect(roundConditionFill('weightKg', 8304 / LB_PER_KG, 'lb') * LB_PER_KG).toBeCloseTo(8300, 6)
    expect(roundConditionFill('weightKg', 3766.4, 'kg')).toBe(3770)
  })

  it('rounds CG, temperature and pressure altitude', () => {
    expect(roundConditionFill('cgPercentMac', 22.348, 'kg')).toBe(22.3)
    expect(roundConditionFill('oatC', 14.6, 'kg')).toBe(15)
    expect(roundConditionFill('pressureAltitudeFt', 683, 'kg')).toBe(680)
  })
})

describe('conditions per aircraft', () => {
  it('keeps weight and CG per aircraft, and shares temperature and pressure altitude', () => {
    let setup = withCondition(DEFAULT_TAKEOFF_SETUP, 'c208b', 'weightKg', 3765)
    setup = withCondition(setup, 'c208b', 'oatC', 25)
    setup = withCondition(setup, 'b737-600', 'cgPercentMac', 24)

    expect(conditionValues(setup, 'c208b')).toEqual({
      weightKg: 3765,
      cgPercentMac: 20,
      oatC: 25,
      pressureAltitudeFt: 0,
    })
    // The 737 has its own (unset) weight, but the shared temperature.
    expect(conditionValues(setup, 'b737-600')).toEqual({
      weightKg: 0,
      cgPercentMac: 24,
      oatC: 25,
      pressureAltitudeFt: 0,
    })
  })
})
