// Info's pure rules: no React. Unit-tested.

export type { AircraftSpeeds, ClimbPowerInfo } from './aircraftSpeeds'
export {
  type AirportCandidate,
  type AirportSuggestion,
  airportLabel,
  airportQuery,
  airportSuggestions,
  distanceNm,
  isIdentQuery,
  MAX_SUGGESTIONS,
  searchText,
  suggestionsStatus,
} from './airportSearch'
export {
  applyCallsignKey,
  CALLSIGN_KEYS,
  CALLSIGN_MAX_LENGTH,
  isCallsignFull,
  normaliseCallsign,
} from './callsign'
export {
  flightPlanAirportNow,
  LEFT_DEPARTURE_NM,
  type PlanAirport,
  type PlanRunway,
  planAirportKey,
  planRunwayName,
} from './flightPlanAirport'
export { INHG_PER_HPA, type PressureReadouts, pressureReadouts } from './pressure'
export {
  type RunwayEndLabel,
  type RunwayInput,
  type RunwayShape,
  runwayDiagram,
} from './runwayDiagram'
export {
  type HelpTable,
  type SpeedHelp,
  type SpeedReadout,
  speedReadoutRows,
} from './speedReadouts'
export {
  airportWindView,
  bearingText,
  CALM_KT,
  compassLabel,
  compassPoint,
  type MetarState,
  type MetarWind,
  metarKnots,
  RUNWAY_DIAGRAM_R,
  type WindText,
  type WindView,
  windStrength,
  windView,
} from './wind'
export {
  angleApart,
  arrowLabelSpots,
  type LabelSize,
  type LabelSpot,
  textWidthPx,
} from './windLabels'
