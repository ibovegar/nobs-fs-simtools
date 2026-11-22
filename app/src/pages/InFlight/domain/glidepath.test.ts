import { describe, expect, it } from 'vitest'
import { rateForAngle } from './descentMath'
import {
  glidepathReading,
  glidepathTable,
  pathAngleDeg,
  pathState,
  RULE_OF_THUMB_FACTOR,
  ruleOfThumbText,
} from './glidepath'

describe('pathAngleDeg', () => {
  it('is 3° when flying the 3° rate', () => {
    expect(pathAngleDeg(140, -rateForAngle(140, 3))).toBeCloseTo(3, 6)
  })

  it('is negative when climbing and 0 when level', () => {
    expect(pathAngleDeg(140, 500)).toBeLessThan(0)
    expect(pathAngleDeg(140, 0)).toBeCloseTo(0, 6)
  })

  it('is null below the minimum groundspeed', () => {
    expect(pathAngleDeg(10, -500)).toBeNull()
  })
})

describe('pathState', () => {
  it('classifies the descent against 3° ± 0.3°', () => {
    expect(pathState(3.1, -700)).toBe('on-path')
    expect(pathState(3.5, -900)).toBe('steep')
    expect(pathState(2.5, -500)).toBe('shallow')
  })

  it('treats near-zero or climbing as level', () => {
    expect(pathState(0.2, -50)).toBe('level')
    expect(pathState(-2, 600)).toBe('level')
  })
})

describe('glidepathTable', () => {
  it('gives about 5.3 × groundspeed for 3°', () => {
    expect(glidepathTable([120])).toEqual([{ groundSpeedKt: 120, rateFpm: expect.closeTo(637, 0) }])
  })

  it('stays close to the GS × 5 rule of thumb', () => {
    for (const row of glidepathTable()) {
      const ratio = row.rateFpm / (row.groundSpeedKt * RULE_OF_THUMB_FACTOR)
      expect(ratio).toBeGreaterThan(1)
      expect(ratio).toBeLessThan(1.1)
    }
  })
})

describe('glidepathReading', () => {
  it('is undefined without a usable groundspeed', () => {
    expect(glidepathReading(undefined, -700)).toBeUndefined()
    expect(glidepathReading(10, -700)).toBeUndefined()
  })

  it('gives the target rate, and your descent against it', () => {
    const r = glidepathReading(130, -690)
    expect(r?.targetRateFpm).toBeCloseTo(rateForAngle(130, 3))
    expect(r?.current?.state).toBe('on-path')
    expect(r?.current?.angleDeg).toBeCloseTo(3, 0)
  })

  it('has no current descent without a vertical speed', () => {
    expect(glidepathReading(130, undefined)?.current).toBeUndefined()
  })
})

describe('ruleOfThumbText', () => {
  it('is "× 5" for 3°, the exact factor for other angles', () => {
    expect(ruleOfThumbText(3)).toBe(`Rule of thumb: V/S ≈ groundspeed × ${RULE_OF_THUMB_FACTOR}`)
    expect(ruleOfThumbText(3.5)).toBe(`V/S ≈ groundspeed × ${rateForAngle(1, 3.5).toFixed(1)}`)
  })
})
