// Flight plan (EFB route) and navigation database access: types, the session interface
// and the Coherent implementation. Reached through `SimBridge.navData`.
export { createCoherentNavData } from './coherentNavData'
export { facilityIcao, icaoKey, isEmptyRoute, parseIcaoString } from './icao'
export type { NavData, NavDataSession } from './NavData'
export type {
  NavAirport,
  NavAirportSummary,
  NavApproach,
  NavApproachIdentifier,
  NavEnrouteLeg,
  NavFacility,
  NavFlightPlanRoute,
  NavIcao,
  NavMetar,
  NavProcedure,
  NavProcedureLeg,
  NavProcedureTransition,
  NavRunway,
  NavRunwayIdentifier,
  NavRunwayTransition,
} from './navTypes'
