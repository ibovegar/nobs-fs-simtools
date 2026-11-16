import { FEET_PER_NM } from './descentMath'

/** Which part of the route the side view shows. */
export type ProfileView = 'all' | 'departure' | 'arrival'

/**
 * What the Flight plan profile assumes when SimTools has no figures for the aircraft: a
 * typical climb and a standard 3° descent. With figures (~/aircraft), the profile uses the
 * aircraft's own climb and descent instead (see ProfileBasis).
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

/** Path angle (°) for a gradient in ft per nm. */
export function angleForGradientDeg(ftPerNm: number): number {
  return (Math.atan(ftPerNm / FEET_PER_NM) * 180) / Math.PI
}

/** What a planned profile is based on: the gradients, and the figures to explain them. */
export interface ProfileBasis {
  /** The aircraft whose climb and descent tables were used; undefined: generic figures. */
  aircraftName?: string
  climbFtPerNm: number
  descentFtPerNm: number
  climbSpeedKt: number
  /** Average climb rate (fpm), for the explanation. */
  climbRateFpm: number
  descentAngleDeg: number
}

/** The generic basis, when SimTools has no figures for the aircraft. */
export const GENERIC_PROFILE_BASIS: ProfileBasis = {
  climbFtPerNm: CLIMB_FT_PER_NM,
  descentFtPerNm: DESCENT_FT_PER_NM,
  climbSpeedKt: PROFILE_ASSUMPTIONS.climbSpeedKt,
  climbRateFpm: PROFILE_ASSUMPTIONS.climbRateFpm,
  descentAngleDeg: PROFILE_ASSUMPTIONS.descentAngleDeg,
}
