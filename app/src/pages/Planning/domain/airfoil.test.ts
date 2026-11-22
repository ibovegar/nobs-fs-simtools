import { describe, expect, it } from 'vitest'
import { airfoil, placeOutline } from './airfoil'

describe('airfoil', () => {
  it('runs along the upper surface and back along the lower one', () => {
    const outline = airfoil(0, 1, 0.12, 4)
    expect(outline).toHaveLength(10)
    expect(outline[0]).toEqual([0, -0])
    expect(outline[4]?.[0]).toBe(1)
    expect(outline[9]).toEqual([0, 0])
  })

  it('is about as thick as asked, near 30 % chord', () => {
    const outline = airfoil(0.3, 0.3, 0.12, 1)
    const [upper, lower] = [outline[0]?.[1] ?? 0, outline[3]?.[1] ?? 0]
    expect(lower - upper).toBeCloseTo(0.12, 2)
  })
})

describe('placeOutline', () => {
  it('scales and moves', () => {
    expect(
      placeOutline(
        [
          [0, 0],
          [1, 0],
        ],
        100,
        [0, 0],
        0,
        10,
        20,
      ),
    ).toBe('10.0,20.0 110.0,20.0')
  })

  it('rotates clockwise around the pivot', () => {
    expect(placeOutline([[1, 0]], 10, [0, 0], 90, 0, 0)).toBe('0.0,10.0')
  })
})
