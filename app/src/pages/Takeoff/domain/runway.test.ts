import { describe, expect, it } from 'vitest'
import {
  formatRunwayDesignator,
  reciprocalRunwayNumber,
  reciprocalSide,
  runwayMarks,
  runwayNumberFromHeading,
} from './runway'
import { flapAngleDeg } from './takeoffMath'

describe('runwayMarks', () => {
  const speeds = { v1: 120, vr: 125, v2: 135 }

  it('places V2 at the takeoff distance, VR at the end of the ground roll, V1 by speed²', () => {
    const m = runwayMarks(speeds, { requiredRunwayM: 2300 }, 3000)
    expect(m.v2M).toBeCloseTo(2000, 0)
    expect(m.vrM).toBeCloseTo(1500, 0)
    expect(m.v1M).toBeCloseTo(1500 * (120 / 125) ** 2, 3)
    expect(m).toMatchObject({ runwayM: 3000, lengthKnown: true })
  })

  it('draws a runway with room to spare when no length is set', () => {
    const m = runwayMarks(speeds, { requiredRunwayM: 2300 }, 0)
    expect(m.lengthKnown).toBe(false)
    expect(m.runwayM).toBe(3000)
    expect(m.runwayM).toBeGreaterThan(m.v2M)
  })

  it('has no V1 mark for single-engine speeds', () => {
    expect(runwayMarks({ vr: 70, v2: 83 }, { requiredRunwayM: 700 }, 0).v1M).toBeUndefined()
  })
})

describe('runway designators', () => {
  it.each([
    [268, 27],
    [4, 36],
    [355, 36],
    [94, 9],
    [-5, 36],
    [184, 18],
  ])('heading %s° → runway %s', (heading, n) => {
    expect(runwayNumberFromHeading(heading)).toBe(n)
  })

  it('finds the other end', () => {
    expect(reciprocalRunwayNumber(27)).toBe(9)
    expect(reciprocalRunwayNumber(36)).toBe(18)
    expect(reciprocalRunwayNumber(18)).toBe(36)
    expect(reciprocalRunwayNumber(1)).toBe(19)
    expect(reciprocalSide('L')).toBe('R')
    expect(reciprocalSide('C')).toBe('C')
  })

  it('formats with two digits and the side', () => {
    expect(formatRunwayDesignator(9, 'L')).toBe('09L')
    expect(formatRunwayDesignator(27)).toBe('27')
  })
})

describe('flapAngleDeg', () => {
  it('uses angleDeg, else the number in the label, else 0', () => {
    const base = { id: 'x', fieldLengthM: 0, speeds: { kind: 'weight-table', points: [] } } as const
    expect(flapAngleDeg({ ...base, label: 'Approach', angleDeg: 14 })).toBe(14)
    expect(flapAngleDeg({ ...base, label: '20°' })).toBe(20)
    expect(flapAngleDeg({ ...base, label: '5' })).toBe(5)
    expect(flapAngleDeg({ ...base, label: 'Up' })).toBe(0)
  })
})
