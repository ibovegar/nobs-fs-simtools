import type { NavAirport, NavFacility, NavFlightPlanRoute, NavIcao } from './navTypes'

/**
 * An open connection to the sim's flight plan and navigation database. Opening one
 * registers the sim's listeners; close it when done (the last close unregisters them),
 * so nothing stays bound while the tool that needs it is not on screen.
 */
export interface NavDataSession {
  /** The EFB / World Map flight plan, or null when there is none or it can't be read. */
  getFlightPlan(): Promise<NavFlightPlanRoute | null>
  /** Called when the sim's flight plan changes (null: cleared). Returns an unsubscribe. */
  onFlightPlanChanged(callback: (route: NavFlightPlanRoute | null) => void): () => void
  /** An airport with its runways and procedures; null when it can't be found. */
  loadAirport(icao: NavIcao): Promise<NavAirport | null>
  /** Any facility's position (waypoint, VOR, NDB, airport); null when it can't be found. */
  loadFacility(icao: NavIcao): Promise<NavFacility | null>
  close(): void
}

/** Flight plan and navigation database access, when the bridge has it. */
export interface NavData {
  open(): NavDataSession
}
