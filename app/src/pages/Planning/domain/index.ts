// Planning's pure maths, aircraft data and formatting: no React. Unit-tested.
export {
  formatInteger,
  formatRunway,
  formatTrim,
  formatWeight,
  kgToUnit,
  unitToKg,
} from './format'
export { AIRCRAFT_PROFILES, takeoffProfile } from './profiles'
export {
  formatRunwayDesignator,
  type RunwayMarks,
  type RunwaySide,
  reciprocalRunwayNumber,
  reciprocalSide,
  runwayMarks,
  runwayNumberFromHeading,
} from './runway'
export {
  type AircraftLoad,
  type ConditionField,
  conditionValues,
  DEFAULT_AIRCRAFT_LOAD,
  DEFAULT_TAKEOFF_SETUP,
  roundConditionFill,
  type TakeoffSetup,
  withCondition,
} from './setup'
export {
  densityRatio,
  FT_PER_M,
  flapAngleDeg,
  LB_PER_KG,
  planTakeoff,
  recommendFlap,
  requiredRunwayM,
  takeoffSpeeds,
  takeoffTrim,
} from './takeoffMath'
export type {
  AircraftProfile,
  FlapSetting,
  TakeoffConditions,
  TakeoffResult,
  TakeoffSpeeds,
  TakeoffWarning,
} from './types'
export { shownWarnings, WARNING_SEVERITY, type WarningSeverity } from './warnings'
