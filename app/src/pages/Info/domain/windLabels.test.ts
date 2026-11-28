import { describe, expect, it } from 'vitest'
import { angleApart, arrowLabelSpots, ringLabelLines, textWidthPx } from './windLabels'

const SIZE = { w: 40, h: 14 }

describe('arrowLabelSpots', () => {
  it('a wind from the west: the direction above the arrow, the speed below', () => {
    const [dir, speed] = arrowLabelSpots(270, 100, SIZE, SIZE, 4)
    expect(dir.x).toBeCloseTo(-100)
    expect(speed.x).toBeCloseTo(-100)
    // Half the text's height plus the gap, each side.
    expect(dir.y).toBeCloseTo(-11)
    expect(speed.y).toBeCloseTo(11)
  })

  it('an upright arrow (from the north): the direction on its left, the speed on its right', () => {
    const [dir, speed] = arrowLabelSpots(0, 100, SIZE, SIZE, 4)
    expect(dir.y).toBeCloseTo(-100)
    // Half the text's width plus the gap, each side.
    expect(dir.x).toBeCloseTo(-24)
    expect(speed.x).toBeCloseTo(24)
  })

  it('a slanted arrow: the direction on the upper side', () => {
    const [dir, speed] = arrowLabelSpots(45, 100, SIZE, SIZE, 4)
    expect(dir.y).toBeLessThan(speed.y)
  })
})

describe('helpers', () => {
  it('measures the angle between bearings across north', () => {
    expect(angleApart(350, 10)).toBe(20)
    expect(angleApart(90, 270)).toBe(180)
  })

  it('estimates a text width', () => {
    expect(textWidthPx('250°', 10)).toBeCloseTo(24.8)
  })
})

describe('ringLabelLines', () => {
  it('stacks the lines just outside the ring, clear of it', () => {
    const [first, second] = ringLabelLines(0, 100, ['ENBR', '20 nm'], 10, 12)
    expect(first?.x).toBeCloseTo(0)
    expect(second?.x).toBeCloseTo(0)
    // At the top: the two lines (24 px) sit above r = 100.
    expect(second?.y).toBeCloseTo(-106)
    expect(first?.y).toBeCloseTo(-118)
  })

  it('pushes wide text out at the sides', () => {
    const [line] = ringLabelLines(90, 100, ['20 nm'], 10, 12)
    expect(line?.x).toBeCloseTo(100 + (5 * 10 * 0.62) / 2)
    expect(line?.y).toBeCloseTo(0)
  })
})
