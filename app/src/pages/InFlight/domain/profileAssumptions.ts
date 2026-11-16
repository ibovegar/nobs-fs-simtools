import { FEET_PER_NM } from './descentMath'

/** Which part of the route the side view shows. */
export type ProfileView = 'all' | 'departure' | 'arrival'

/**
 * What the Flight plan profile assumes about the aircraft. The tab is read-only, so these
 * are fixed: a typical climb and a standard 3° descent.
 */
export const PROFILE_ASSUMPTIONS = {
  climbRateFpm: 1500,
  /** Average groundspeed in the climb: with the rate, it sets the climb gradient. */
  climbSpeedKt: 250,
  descentAngleDeg: 3,
  /** Cruise altitude when the flight plan has none. */
  fallbackCruiseFt: 10000,
} as const

/** Feet per nautical mile for a vertical speed at a groundspeed. */
export function gradientFtPerNm(rateFpm: number, groundSpeedKt: number): number {
  return groundSpeedKt > 0 ? rateFpm / (groundSpeedKt / 60) : 0
}

export const CLIMB_FT_PER_NM = gradientFtPerNm(
  PROFILE_ASSUMPTIONS.climbRateFpm,
  PROFILE_ASSUMPTIONS.climbSpeedKt,
)

export const DESCENT_FT_PER_NM =
  Math.tan((PROFILE_ASSUMPTIONS.descentAngleDeg * Math.PI) / 180) * FEET_PER_NM
