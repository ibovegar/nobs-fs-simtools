import { describe, expect, it } from 'vitest'
import { AIRCRAFT } from './catalogue'
import {
  type AircraftPerformance,
  approachSpeedKias,
  climbGradientFtPerNm,
  climbRateFpm,
  descentGradientFtPerNm,
  trueAirspeedKt,
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

describe('aircraft with only some figures', () => {
  it('has no climb gradient without a climb table', () => {
    expect(climbGradientFtPerNm(perf('kingair-350'), 20_000)).toBeUndefined()
    expect(climbRateFpm(perf('dash8-q400'), 20_000)).toBeUndefined()
  })

  it('plans a descent from its speed and vertical speed when there is no table', () => {
    // Q400 from FL240: 1,500 fpm at the true airspeed of 250 KIAS at 12,000 ft.
    const tas = trueAirspeedKt(250, 12_000)
    expect(descentGradientFtPerNm(perf('dash8-q400'), 24_000)).toBeCloseTo(1500 / (tas / 60), 6)
    // About 3°: 300 ft per nm or so.
    expect(descentGradientFtPerNm(perf('dash8-q400'), 24_000)).toBeGreaterThan(270)
    expect(descentGradientFtPerNm(perf('dash8-q400'), 24_000)).toBeLessThan(320)
    // No vertical speed, no table: nothing to plan with.
    expect(descentGradientFtPerNm({ descent: { speedKias: 250 } }, 24_000)).toBeUndefined()
  })

  it('scales the King Air and Q400 approach speeds from their reference weights', () => {
    expect(approachSpeedKias(perf('kingair-350'), 15_000 * LB)).toBe(109)
    expect(approachSpeedKias(perf('dash8-q400'), 62_000 * LB)).toBe(121)
    expect(approachSpeedKias(perf('dash8-q400'), 0.81 * 62_000 * LB)).toBe(Math.round(121 * 0.9))
  })

  it('has no approach speed when the aircraft has none', () => {
    expect(approachSpeedKias({ cruise: { speedKtas: 200 } }, 5000)).toBeUndefined()
  })
})

describe('trueAirspeedKt', () => {
  it('equals the indicated airspeed at sea level', () => {
    expect(trueAirspeedKt(150, 0)).toBeCloseTo(150, 6)
  })

  it('grows with altitude (standard atmosphere)', () => {
    // 217 KIAS at FL240 ≈ 312 KTAS; 250 KIAS at 10,000 ft ≈ 289 KTAS.
    expect(trueAirspeedKt(217, 24_000)).toBeCloseTo(312, 0)
    expect(trueAirspeedKt(250, 10_000)).toBeCloseTo(289, 0)
  })
})
