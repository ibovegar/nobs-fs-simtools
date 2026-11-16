import { describe, expect, it } from 'vitest'
import { rateForAngle } from './descentMath'
import { glidepathTable, pathAngleDeg, pathState, RULE_OF_THUMB_FACTOR } from './glidepath'

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
