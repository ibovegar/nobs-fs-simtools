// Planning's pure maths, aircraft data and formatting: no React. Unit-tested.
export { airfoil, type Point, placeOutline } from './airfoil'
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
  layoutLines,
  type PlacedLine,
  type RunwayMarks,
  type RunwaySide,
  reciprocalRunwayNumber,
  reciprocalSide,
  runwayMarks,
  runwayNumberFromHeading,
  type SpeedLine,
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
export {
  type FlapSummary,
  type SpeedSummary,
  type SummaryValue,
  type TakeoffSummaryInput,
  type TakeoffSummaryModel,
  takeoffSummary,
} from './takeoffSummary'
export type {
  AircraftProfile,
  FlapSetting,
  TakeoffConditions,
  TakeoffResult,
  TakeoffSpeeds,
  TakeoffWarning,
} from './types'
export { shownWarnings, WARNING_SEVERITY, type WarningSeverity } from './warnings'
