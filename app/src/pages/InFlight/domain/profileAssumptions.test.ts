import { describe, expect, it } from 'vitest'
import { CLIMB_FT_PER_NM, DESCENT_FT_PER_NM, gradientFtPerNm } from './profileAssumptions'

describe('profile gradients', () => {
  it('turns V/S and groundspeed into feet per nm', () => {
    expect(gradientFtPerNm(2000, 300)).toBeCloseTo(400, 6)
    expect(gradientFtPerNm(1000, 0)).toBe(0)
  })

  it('climbs 1500 fpm at 250 kt and descends at 3°', () => {
    expect(CLIMB_FT_PER_NM).toBeCloseTo(360, 6)
    expect(DESCENT_FT_PER_NM).toBeCloseTo(318.4, 1)
  })
})
