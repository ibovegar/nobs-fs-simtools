// The TOD calculator's maths: a port of the rules-of-thumb calculator at descent.vercel.app
// (github.com/epranka/descent-app). Kept identical on purpose, including the rounding and the
// "+1 nm per 10 kt slowed down" allowance. Pure, no React.
//
// One difference: both speeds are groundspeeds (what the fill button reads), so there is no
// wind field: the wind is already in the speeds. The web app's "+1 nm per 10 kt of tailwind"
// allowance goes with it.
//
// The web app works on typed text; here every value is a number set with steppers (VR), so
// the inputs are always complete and only the rule checks below can fail.

const FEET_PER_NM_EXACT = 6076.11549
const DEG_TO_RAD = 0.0174532925

/** The calculator's six inputs. */
export interface TopOfDescentFields {
  startAltitude: number
  endAltitude: number
  /** Groundspeed, kt. */
  startSpeed: number
  /** Groundspeed, kt. */
  endSpeed: number
  glideSlope: number
  /** Negative: a descent rate, e.g. -1500 fpm, as on the VSI. */
  verticalSpeed: number
}

export type TopOfDescentField = keyof TopOfDescentFields

export interface TopOfDescentResult {
  /** Distance before the target to start down, whole nm. Null when the inputs are invalid. */
  distanceNm: number | null
  /** Estimated time of the descent, whole minutes. */
  minutes: number | null
  /** Fields to mark as invalid. */
  errors: Partial<Record<TopOfDescentField, true>>
}

interface SpeedInputs {
  startSpeed: number
  endSpeed: number
}

const averageSpeed = (i: SpeedInputs) => (i.startSpeed + i.endSpeed) / 2

/** Descent rate (whole fpm, positive) that holds `glideSlope` degrees at the average speed. */
export function verticalSpeedForAngle(i: SpeedInputs & { glideSlope: number }): number {
  return Math.round(
    ((Math.tan(i.glideSlope * DEG_TO_RAD) * averageSpeed(i)) / 60) * FEET_PER_NM_EXACT,
  )
}

/** Glideslope (one decimal) that a descent rate (positive fpm) gives at the average speed. */
export function angleForVerticalSpeed(i: SpeedInputs & { verticalSpeed: number }): number {
  const average = averageSpeed(i)
  if (average <= 0) return 0
  const slope = ((i.verticalSpeed / FEET_PER_NM_EXACT) * 60) / average
  return Math.round(Math.atan(slope) * (1 / DEG_TO_RAD) * 10) / 10
}

const BASE_FIELDS = {
  startAltitude: 30000,
  endAltitude: 10000,
  startSpeed: 320,
  endSpeed: 250,
  glideSlope: 3,
}

/** The web app's example values (its placeholders), with the matching vertical speed. */
export const DEFAULT_TOP_OF_DESCENT_FIELDS: TopOfDescentFields = {
  ...BASE_FIELDS,
  verticalSpeed: -verticalSpeedForAngle(BASE_FIELDS),
}

/** Distance and time for the fields as they stand. */
export function topOfDescent(fields: TopOfDescentFields): TopOfDescentResult {
  const { startAltitude, endAltitude, startSpeed, endSpeed, glideSlope } = fields

  const errors: TopOfDescentResult['errors'] = {}
  const altitudeToLose = startAltitude - endAltitude
  if (altitudeToLose < 0) {
    errors.startAltitude = true
    errors.endAltitude = true
  }
  if (!glideSlope) errors.glideSlope = true
  const average = averageSpeed(fields)
  if (average <= 0) {
    errors.startSpeed = true
    errors.endSpeed = true
  }
  if (Object.keys(errors).length > 0) return { distanceNm: null, minutes: null, errors }

  let distance = altitudeToLose / FEET_PER_NM_EXACT / Math.tan(glideSlope * DEG_TO_RAD)
  distance += Math.ceil((startSpeed - endSpeed) / 10) // slowing down takes room
  return {
    distanceNm: Math.ceil(distance),
    minutes: Math.round((distance / average) * 60),
    errors,
  }
}

/**
 * The fields after the pilot changes one. Changing the glideslope recomputes the vertical
 * speed and the other way round; every other field recomputes the vertical speed from the
 * glideslope.
 */
export function editTopOfDescent(
  fields: TopOfDescentFields,
  field: TopOfDescentField,
  value: number,
): TopOfDescentFields {
  const next = { ...fields, [field]: value }
  if (field === 'verticalSpeed') {
    return { ...next, glideSlope: angleForVerticalSpeed({ ...next, verticalSpeed: -value }) }
  }
  return { ...next, verticalSpeed: -verticalSpeedForAngle(next) }
}
