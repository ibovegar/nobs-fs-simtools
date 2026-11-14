// Takeoff's pure maths, aircraft data and formatting: no React. Unit-tested.
export {
  formatInteger,
  formatRunway,
  formatTrim,
  formatWeight,
  kgToUnit,
  unitToKg,
} from './format'
export { AIRCRAFT_PROFILES } from './profiles'
export {
  formatRunwayDesignator,
  type RunwayMarks,
  type RunwaySide,
  reciprocalRunwayNumber,
  reciprocalSide,
  runwayMarks,
  runwayNumberFromHeading,
} from './runway'
export { DEFAULT_TAKEOFF_SETUP, type TakeoffSetup } from './setup'
export {
  densityRatio,
  detectProfile,
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
