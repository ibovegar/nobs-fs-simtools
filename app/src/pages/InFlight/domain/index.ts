// In flight's pure maths, formatting and setup — no React. Unit-tested.
export { type CalculatorProfile, calculatorProfile } from './calculatorProfile'
export { advanceDistance, FEET_PER_NM, MIN_GROUNDSPEED_KT, rateForAngle } from './descentMath'
export {
  CRUISE_TOLERANCE_FT,
  cruiseRateFpm,
  type FlightPlanStatus,
  type FlightProgress,
  flightProgress,
  ON_PATH_TOLERANCE_FT,
  positionOnRoute,
  type RoutePosition,
} from './flightProgress'
export {
  formatAltitude,
  formatAltitudeLimit,
  formatDistance,
  formatDuration,
  formatInteger,
  formatRate,
  formatSpeedLimit,
} from './format'
export { greatCircleNm, initialBearingDeg, type LatLon, offsetLatLon } from './geo'
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
export {
  DEFAULT_GLIDESLOPE_SETUP,
  type DistanceSource,
  type GlideslopeSetup,
} from './glideslopeSetup'
export {
  angleForGradientDeg,
  CLIMB_FT_PER_NM,
  DESCENT_FT_PER_NM,
  GENERIC_PROFILE_BASIS,
  gradientFtPerNm,
  PROFILE_ASSUMPTIONS,
  type ProfileBasis,
  type ProfileView,
} from './profileAssumptions'
export {
  type AircraftOnRoute,
  type AltitudeScale,
  altitudeScale,
  type ChartWaypoint,
  clipProfile,
  inClimbWindow,
  type LabelCandidate,
  niceStep,
  pickLabels,
  ticks,
  trendEnd,
  trendLengthPx,
  type ViewRange,
  viewRange,
} from './profileChart'
export {
  type AltitudeConstraint,
  type BuiltRoute,
  buildRoute,
  type CollectedRoute,
  collectRouteFixes,
  describeRoute,
  fixesToLoad,
  icaoKey,
  isSamePlan,
  type PlanAirport,
  type PlanRoute,
  planCruiseFt,
  type RouteFix,
  type RouteIcao,
  type RoutePhase,
  type RouteWaypoint,
  type SpeedConstraint,
  THRESHOLD_HEIGHT_FT,
} from './route'
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
export {
  altitudeAt,
  computeVerticalProfile,
  meetsConstraint,
  type PlannedWaypoint,
  type ProfilePoint,
  planWaypoints,
  type VerticalProfile,
} from './verticalProfile'
