import { describe, expect, it } from 'vitest'
import { distanceToSegment, roundPoints, simplify, strokeHit } from './ink'

describe('distanceToSegment', () => {
  it('measures perpendicular distance', () => {
    expect(distanceToSegment(0.5, 1, 0, 0, 1, 0)).toBeCloseTo(1)
  })
  it('clamps to the segment ends', () => {
    expect(distanceToSegment(2, 0, 0, 0, 1, 0)).toBeCloseTo(1)
  })
})

describe('simplify', () => {
  it('collapses collinear points to the endpoints', () => {
    expect(simplify([0, 0, 0.25, 0, 0.5, 0, 0.75, 0, 1, 0])).toEqual([0, 0, 1, 0])
  })

  it('keeps corners', () => {
    expect(simplify([0, 0, 0.5, 0, 0.5, 0.5])).toEqual([0, 0, 0.5, 0, 0.5, 0.5])
  })

  it('leaves tiny strokes alone', () => {
    expect(simplify([0.1, 0.1])).toEqual([0.1, 0.1])
  })
})

describe('roundPoints', () => {
  it('rounds to 4 decimals', () => expect(roundPoints([0.123456])).toEqual([0.1235]))
})

describe('strokeHit', () => {
  const line = { size: 'fine' as const, points: [0, 0, 1, 0] }
  it('hits near the line', () => expect(strokeHit(line, 0.5, 0.01, 0.02)).toBe(true))
  it('misses far from the line', () => expect(strokeHit(line, 0.5, 0.1, 0.02)).toBe(false))
  it('hits a single-point dot', () => {
    expect(strokeHit({ size: 'fine', points: [0.5, 0.5] }, 0.51, 0.5, 0.02)).toBe(true)
  })
})
