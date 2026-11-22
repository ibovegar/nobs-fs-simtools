// Info's pure rules: no React. Unit-tested.

export type { AircraftSpeeds, ClimbPowerInfo } from './aircraftSpeeds'
export {
  applyCallsignKey,
  CALLSIGN_KEYS,
  CALLSIGN_MAX_LENGTH,
  isCallsignFull,
  normaliseCallsign,
} from './callsign'
export {
  type HelpTable,
  type SpeedHelp,
  type SpeedReadout,
  speedReadoutRows,
} from './speedReadouts'
