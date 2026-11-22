// The TOD calculator's maths. Pure, no React.
//
// At a fixed path angle the distance depends only on the altitude to lose, so one descent
// speed is enough: it only sets the vertical speed. The descent reaches the end altitude at
// the target, or `levelOffNm` before it when the pilot keeps some level flight to slow down.

import { FEET_PER_NM, MIN_GROUNDSPEED_KT, rateForAngle } from './descentMath'

const DEG_TO_RAD = Math.PI / 180
const MIN_GLIDESLOPE_DEG = 0.5
const MAX_GLIDESLOPE_DEG = 10

/** The descent speed for an aircraft SimTools has no figure for. */
export const DEFAULT_DESCENT_SPEED_KIAS = 250

/** The calculator's inputs. */
export interface TopOfDescentFields {
  startAltitude: number
  endAltitude: number
  /** KIAS held in the descent; null: the aircraft's own. */
  descentSpeed: number | null
  glideSlope: number
  /** Level flight kept at the end altitude before the target, nm. */
  levelOffNm: number
}

export type TopOfDescentField = keyof TopOfDescentFields

export interface TopOfDescentResult {
  /** Distance before the target to start down, nearest nm. Null when the inputs are invalid. */
  distanceNm: number | null
  /** Estimated time from TOD to the target, whole minutes. */
  minutes: number | null
  /** The V/S (negative, whole fpm) that holds the glideslope at the planned speed. */
  plannedVerticalSpeedFpm: number
  /** Fields to mark as invalid. */
  errors: Partial<Record<TopOfDescentField, true>>
}

export const DEFAULT_TOP_OF_DESCENT_FIELDS: TopOfDescentFields = {
  startAltitude: 30000,
  endAltitude: 10000,
  descentSpeed: null,
  glideSlope: 3,
  levelOffNm: 0,
}

/** The glideslope a descent rate (positive fpm) gives at a speed, within the stepper's range. */
export function angleForVerticalSpeed(speedKt: number, verticalSpeedFpm: number): number {
  if (speedKt <= 0) return MIN_GLIDESLOPE_DEG
  const angle = Math.atan(verticalSpeedFpm / ((speedKt / 60) * FEET_PER_NM)) / DEG_TO_RAD
  return Math.max(MIN_GLIDESLOPE_DEG, Math.min(MAX_GLIDESLOPE_DEG, angle))
}

/**
 * The V/S to fly (negative, to the nearest 50 fpm): the glideslope at the live groundspeed, so
 * wind and a falling groundspeed are corrected. Without one, the planned V/S.
 */
export function liveVerticalSpeedFpm(
  glideSlope: number,
  groundSpeedKt: number | undefined,
  plannedFpm: number,
): number {
  const moving = groundSpeedKt !== undefined && groundSpeedKt >= MIN_GROUNDSPEED_KT
  const rate = moving ? -rateForAngle(groundSpeedKt, glideSlope) : plannedFpm
  return Math.round(rate / 50) * 50
}

/** Distance, time and V/S for the fields, at the planned speed over the ground (kt). */
export function topOfDescent(fields: TopOfDescentFields, speedKt: number): TopOfDescentResult {
  const { startAltitude, endAltitude, glideSlope, levelOffNm } = fields
  const plannedVerticalSpeedFpm = -Math.round(rateForAngle(speedKt, glideSlope))

  const errors: TopOfDescentResult['errors'] = {}
  const altitudeToLose = startAltitude - endAltitude
  if (altitudeToLose < 0) {
    errors.startAltitude = true
    errors.endAltitude = true
  }
  if (!glideSlope) errors.glideSlope = true
  if (speedKt <= 0) errors.descentSpeed = true
  if (Object.keys(errors).length > 0) {
    return { distanceNm: null, minutes: null, plannedVerticalSpeedFpm, errors }
  }

  const distance = altitudeToLose / FEET_PER_NM / Math.tan(glideSlope * DEG_TO_RAD) + levelOffNm
  return {
    distanceNm: Math.round(distance),
    minutes: Math.round((distance / speedKt) * 60),
    plannedVerticalSpeedFpm,
    errors,
  }
}
