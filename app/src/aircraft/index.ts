// The aircraft SimTools recognises in the sim, shared by every page that needs it.
export { AIRCRAFT, type Aircraft, detectAircraft } from './catalogue'
export { useSimAircraft } from './hooks'
export {
  type AircraftPerformance,
  approachSpeedKias,
  type ClimbRow,
  climbGradientFtPerNm,
  climbRateFpm,
  descentGradientFtPerNm,
} from './performance'
