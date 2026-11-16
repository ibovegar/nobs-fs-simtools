import { describe, expect, it } from 'vitest'
import { AIRCRAFT } from './catalogue'
import {
  type AircraftPerformance,
  approachSpeedKias,
  climbGradientFtPerNm,
  climbRateFpm,
  descentGradientFtPerNm,
} from './performance'

const perf = (id: string) => AIRCRAFT.find((a) => a.id === id)?.performance as AircraftPerformance
const LB = 1 / 2.204_622_6

describe('climb and descent from the tables', () => {
  it('reads a table row exactly', () => {
    // Caravan: 12,000 ft in 15 min over 32 nm.
    expect(climbGradientFtPerNm(perf('c208b'), 12_000)).toBeCloseTo(12_000 / 32, 6)
    expect(climbRateFpm(perf('c208b'), 12_000)).toBeCloseTo(800, 6)
    // TBM: down from 25,000 ft over 58 nm.
    expect(descentGradientFtPerNm(perf('tbm-850'), 25_000)).toBeCloseTo(25_000 / 58, 6)
  })

  it('interpolates between rows', () => {
    // Caravan 10,000 ft: halfway between 18 and 32 nm.
    expect(climbGradientFtPerNm(perf('c208b'), 10_000)).toBeCloseTo(10_000 / 25, 6)
  })

  it('keeps the end gradient outside the table, and has none at or below sea level', () => {
    expect(climbGradientFtPerNm(perf('c208b'), 2000)).toBeCloseTo(4000 / 9, 6)
    expect(climbGradientFtPerNm(perf('c208b'), 30_000)).toBeCloseTo(24_000 / 107, 6)
    expect(climbGradientFtPerNm(perf('c208b'), 0)).toBeUndefined()
  })

  it('climbs steeper and descends steeper in the TBM than in the Caravan', () => {
    expect(climbGradientFtPerNm(perf('tbm-850'), 20_000)).toBeGreaterThan(
      climbGradientFtPerNm(perf('c208b'), 20_000) as number,
    )
    expect(descentGradientFtPerNm(perf('tbm-850'), 20_000)).toBeGreaterThan(
      descentGradientFtPerNm(perf('c208b'), 20_000) as number,
    )
  })
})

describe('approachSpeedKias', () => {
  it('is the reference speed at the max landing weight', () => {
    expect(approachSpeedKias(perf('c208b'), 8500 * LB)).toBe(78)
    expect(approachSpeedKias(perf('tbm-850'), 7024 * LB)).toBe(85)
  })

  it('scales with √weight', () => {
    // 81 % of the weight → 90 % of the speed.
    expect(approachSpeedKias(perf('tbm-850'), 0.81 * 7024 * LB)).toBe(Math.round(85 * 0.9))
  })

  it('falls back to the reference speed without a plausible weight', () => {
    expect(approachSpeedKias(perf('c208b'), undefined)).toBe(78)
    expect(approachSpeedKias(perf('c208b'), 120_000 * LB)).toBe(78)
    expect(approachSpeedKias(perf('c208b'), 0)).toBe(78)
  })
})
