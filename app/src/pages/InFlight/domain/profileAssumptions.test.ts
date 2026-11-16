import { describe, expect, it } from 'vitest'
import {
  angleForGradientDeg,
  CLIMB_FT_PER_NM,
  DESCENT_FT_PER_NM,
  GENERIC_PROFILE_BASIS,
  gradientFtPerNm,
} from './profileAssumptions'

describe('profile gradients', () => {
  it('turns V/S and groundspeed into feet per nm', () => {
    expect(gradientFtPerNm(2000, 300)).toBeCloseTo(400, 6)
    expect(gradientFtPerNm(1000, 0)).toBe(0)
  })

  it('climbs 1500 fpm at 250 kt and descends at 3°', () => {
    expect(CLIMB_FT_PER_NM).toBeCloseTo(360, 6)
    expect(DESCENT_FT_PER_NM).toBeCloseTo(318.4, 1)
  })

  it('turns a gradient back into its path angle', () => {
    expect(angleForGradientDeg(DESCENT_FT_PER_NM)).toBeCloseTo(3, 6)
    expect(angleForGradientDeg(0)).toBe(0)
  })

  it('has a generic basis for aircraft without figures', () => {
    expect(GENERIC_PROFILE_BASIS.aircraftName).toBeUndefined()
    expect(GENERIC_PROFILE_BASIS.descentAngleDeg).toBe(3)
  })
})
