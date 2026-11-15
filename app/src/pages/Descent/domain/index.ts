// Descent's pure maths, formatting and setup — no React. Unit-tested.
export {
  advanceDistance,
  type DescentInputs,
  type DescentPlan,
  type DescentProfile,
  type DescentStatus,
  descentStatus,
  distanceFromEte,
  FEET_PER_NM,
  MIN_GROUNDSPEED_KT,
  planDescent,
  rateForAngle,
} from './descentMath'
export { formatAltitude, formatDistance, formatDuration, formatInteger, formatRate } from './format'
export {
  GLIDEPATH_DEG,
  GLIDEPATH_TABLE_SPEEDS,
  GLIDEPATH_TOLERANCE_DEG,
  type GlidepathRow,
  glidepathTable,
  type PathState,
  pathAngleDeg,
  pathState,
  RULE_OF_THUMB_FACTOR,
} from './glidepath'
export {
  aimPointOffsetNm,
  DOT_DEG,
  FULL_SCALE_DOTS,
  GLIDESLOPE_ANGLES,
  type GlideslopeInputs,
  type GlideslopePosition,
  glideslopeHeightFt,
  glideslopePosition,
  ON_SLOPE_DOTS,
  profileRangeNm,
  type SlopeState,
  slopeState,
  THRESHOLD_CROSSING_HEIGHT_FT,
} from './glideslope'
export { DEFAULT_GLIDESLOPE_SETUP, type GlideslopeSetup } from './glideslopeSetup'
export {
  DEFAULT_DESCENT_SETUP,
  type DescentSetup,
  type DistanceSource,
  profileFromSetup,
} from './setup'
export {
  angleForVerticalSpeed,
  DEFAULT_TOP_OF_DESCENT_FIELDS,
  editTopOfDescent,
  type TopOfDescentField,
  type TopOfDescentFields,
  type TopOfDescentResult,
  topOfDescent,
  verticalSpeedForAngle,
} from './topOfDescent'
