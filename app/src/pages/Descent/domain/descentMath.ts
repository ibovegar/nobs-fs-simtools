// Shared descent maths (path angle ↔ vertical speed, distance countdown). Pure, unit-tested.

export const FEET_PER_NM = 6076.12

/** Ignore groundspeeds below this (parked / taxiing): no meaningful descent plan. */
export const MIN_GROUNDSPEED_KT = 30

const toRadians = (deg: number) => (deg * Math.PI) / 180

/** Vertical speed (fpm) that holds a given path angle at a given groundspeed. */
export function rateForAngle(groundSpeedKt: number, degrees: number): number {
  return groundSpeedKt * (FEET_PER_NM / 60) * Math.tan(toRadians(degrees))
}

/** Ignore sim-time jumps longer than this (slew, flight reload, long pause). */
export const MAX_COUNTDOWN_STEP_SEC = 10

/**
 * Fly a manually entered distance down by groundspeed × elapsed sim time, so a
 * distance typed in once stays correct as you fly towards the target.
 */
export function advanceDistance(distanceNm: number, groundSpeedKt: number, elapsedSec: number) {
  if (elapsedSec <= 0 || elapsedSec > MAX_COUNTDOWN_STEP_SEC) return distanceNm
  if (groundSpeedKt < MIN_GROUNDSPEED_KT) return distanceNm
  return Math.max(0, distanceNm - (groundSpeedKt * elapsedSec) / 3600)
}
