import type {
  NavAirport,
  NavAirportSummary,
  NavFacility,
  NavFlightPlanRoute,
  NavIcao,
  NavMetar,
} from './navTypes'

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
  /** An airport's name and position only (no runways or procedures); null when not found. */
  loadAirportSummary(icao: NavIcao): Promise<NavAirportSummary | null>
  /** Airports whose ident starts with `prefix`, at most `max`; [] when the sim can't search. */
  searchAirports(prefix: string, max: number): Promise<NavIcao[]>
  /** Airports within `radiusNm` of a position, at most `max`, in no particular order. */
  nearestAirports(lat: number, lon: number, radiusNm: number, max: number): Promise<NavIcao[]>
  /** The airport's latest METAR; null when the sim has none. */
  getMetar(ident: string): Promise<NavMetar | null>
  close(): void
}

/** Flight plan and navigation database access, when the bridge has it. */
export interface NavData {
  open(): NavDataSession
}
