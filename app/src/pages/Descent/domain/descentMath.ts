// Pure top-of-descent maths. No React, no sim — everything here is unit-tested.

export const FEET_PER_NM = 6076.12

/** Ignore groundspeeds below this (parked / taxiing): no meaningful descent plan. */
export const MIN_GROUNDSPEED_KT = 30

export type DescentProfile = { kind: 'angle'; degrees: number } | { kind: 'rate'; fpm: number }

export interface DescentInputs {
  currentAltitudeFt: number
  targetAltitudeFt: number
  groundSpeedKt: number
  distanceToTargetNm: number
  profile: DescentProfile
  /** Extra distance to be level at the target early, e.g. to slow down. */
  bufferNm: number
}

export interface DescentPlan {
  altitudeToLoseFt: number
  /** Horizontal distance the descent itself takes. */
  descentDistanceNm: number
  /** Where the descent starts, measured back from the target (descent + buffer). */
  todFromTargetNm: number
  /** Distance still to fly before starting down. Negative = past TOD. */
  distanceToTodNm: number
  /** Time until TOD at the current groundspeed; 0 when past it. */
  timeToTodSec: number
  /** Vertical speed the chosen profile needs at the current groundspeed. */
  descentRateFpm: number
  /** Vertical speed needed if you start down right now; null when it can't be met. */
  requiredRateNowFpm: number | null
}

const toRadians = (deg: number) => (deg * Math.PI) / 180

/** Vertical speed (fpm) that holds a given path angle at a given groundspeed. */
export function rateForAngle(groundSpeedKt: number, degrees: number): number {
  return groundSpeedKt * (FEET_PER_NM / 60) * Math.tan(toRadians(degrees))
}

export function planDescent(i: DescentInputs): DescentPlan {
  const altitudeToLoseFt = Math.max(0, i.currentAltitudeFt - i.targetAltitudeFt)
  const gs = Math.max(0, i.groundSpeedKt)

  const descentRateFpm =
    i.profile.kind === 'angle' ? rateForAngle(gs, i.profile.degrees) : i.profile.fpm

  const descentDistanceNm =
    i.profile.kind === 'angle'
      ? altitudeToLoseFt / (Math.tan(toRadians(i.profile.degrees)) * FEET_PER_NM)
      : (altitudeToLoseFt / i.profile.fpm) * (gs / 60)

  const todFromTargetNm = descentDistanceNm + i.bufferNm
  const distanceToTodNm = i.distanceToTargetNm - todFromTargetNm
  const timeToTodSec = distanceToTodNm > 0 && gs > 0 ? (distanceToTodNm / gs) * 3600 : 0

  // Starting now, the descent must be done by (target − buffer).
  const usableNm = i.distanceToTargetNm - i.bufferNm
  const requiredRateNowFpm =
    usableNm > 0 && gs > 0 ? altitudeToLoseFt / ((usableNm / gs) * 60) : null

  return {
    altitudeToLoseFt,
    descentDistanceNm,
    todFromTargetNm,
    distanceToTodNm,
    timeToTodSec,
    descentRateFpm,
    requiredRateNowFpm,
  }
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

export type DescentStatus =
  | 'no-data' // not moving fast enough to plan
  | 'at-target' // already at or below the target altitude
  | 'cruise' // TOD is comfortably ahead
  | 'approaching' // TOD within the warning window
  | 'descend' // at or past TOD

export function descentStatus(
  plan: DescentPlan,
  groundSpeedKt: number,
  warningSec = 120,
): DescentStatus {
  if (groundSpeedKt < MIN_GROUNDSPEED_KT) return 'no-data'
  if (plan.altitudeToLoseFt <= 0) return 'at-target'
  if (plan.distanceToTodNm <= 0) return 'descend'
  if (plan.timeToTodSec <= warningSec) return 'approaching'
  return 'cruise'
}
