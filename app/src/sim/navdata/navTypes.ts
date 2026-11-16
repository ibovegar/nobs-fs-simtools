// The shapes the sim hands back for the flight plan and its navigation database: the subset
// SimTools reads, as documented in the MSFS 2024 SDK (JS_LISTENER_PLANNEDROUTE,
// JS_LISTENER_FACILITY) and Microsoft's msfs-avionics-mirror. Raw: units are the sim's own
// (metres for facility altitudes and lengths, feet for the route's cruise altitude).

/** A facility identifier ('JS_ICAO'). `type`: A airport, V VOR, N NDB, W waypoint, R runway. */
export interface NavIcao {
  type: string
  region: string
  /** The associated airport's ident (terminal fixes, runways), else ''. */
  airport: string
  ident: string
}

/** A runway as the route names it, e.g. `{ number: '27', designator: 'L' }`. */
export interface NavRunwayIdentifier {
  number: string
  designator: string
}

export interface NavApproachIdentifier {
  /** 'ILS', 'RNAV', 'VORDME', … ('' = none). */
  type: string
  runway: NavRunwayIdentifier
  suffix: string
}

/** One enroute leg of the EFB route ('JS_EnrouteLeg'). */
export interface NavEnrouteLeg {
  fixIcao: NavIcao
  /** Airway to the fix, '' for a direct leg. */
  via: string
  isPpos: boolean
  hasLatLon: boolean
  lat: number
  lon: number
  hasPointBearingDistance: boolean
  referenceIcao: NavIcao
  /** Degrees true from the reference facility. */
  bearing: number
  /** Nautical miles from the reference facility. */
  distance: number
}

/** The EFB / World Map flight plan ('JS_FlightPlanRoute', GET_EFB_ROUTE). */
export interface NavFlightPlanRoute {
  departureAirport: NavIcao
  destinationAirport: NavIcao
  enroute: readonly NavEnrouteLeg[]
  departureRunway: NavRunwayIdentifier
  departure: string
  departureTransition: string
  destinationRunway: NavRunwayIdentifier
  arrival: string
  arrivalTransition: string
  approach: NavApproachIdentifier
  approachTransition: string
  cruiseAltitude: { altitude: number; isFlightLevel: boolean } | null
  isVfr: boolean
}

/** A procedure leg (SID, STAR, approach). Altitudes in metres, speeds in knots IAS. */
export interface NavProcedureLeg {
  /** ARINC 424 leg type (SDK `LegType`: 15 IF, 18 TF, 4 CF, 7 DF, …). */
  type: number
  /** 2024 struct form of the fix; older data only has the `fixIcao` string. */
  fixIcaoStruct?: NavIcao
  fixIcao?: string
  /** SDK `AltitudeRestrictionType`: 0 none, 1 at, 2 at or above, 3 at or below, 4 between. */
  altDesc: number
  altitude1: number
  altitude2: number
  speedRestriction: number
  /** SDK `SpeedRestrictionType` (same values as altDesc); missing in older data. */
  speedRestrictionDesc?: number
}

export interface NavProcedureTransition {
  name: string
  legs: readonly NavProcedureLeg[]
}

export interface NavRunwayTransition {
  runwayNumber: number
  /** SDK `RunwayDesignator`: 0 none, 1 L, 2 R, 3 C, 4 W, 5 A, 6 B. */
  runwayDesignation: number
  legs: readonly NavProcedureLeg[]
}

/** A SID or STAR. */
export interface NavProcedure {
  name: string
  commonLegs: readonly NavProcedureLeg[]
  enRouteTransitions: readonly NavProcedureTransition[]
  runwayTransitions: readonly NavRunwayTransition[]
}

export interface NavApproach {
  /** SDK `ApproachType`: 1 GPS, 2 VOR, 3 NDB, 4 ILS, 5 LOC, … 10 RNAV. */
  approachType: number
  approachSuffix: string
  runwayNumber: number
  runwayDesignator: number
  transitions: readonly NavProcedureTransition[]
  finalLegs: readonly NavProcedureLeg[]
}

/** Both directions of one physical runway. Lengths and elevations in metres. */
export interface NavRunway {
  latitude: number
  longitude: number
  /** True heading of the primary direction. */
  direction: number
  /** e.g. '01-19'. */
  designation: string
  length: number
  designatorCharPrimary: number
  designatorCharSecondary: number
  primaryElevation: number
  secondaryElevation: number
  primaryThresholdLength: number
  secondaryThresholdLength: number
}

/** Any facility: a position. */
export interface NavFacility {
  icaoStruct?: NavIcao
  icao?: string
  lat: number
  lon: number
}

export interface NavAirport extends NavFacility {
  /** Airport elevation, metres. */
  altitude: number
  runways: readonly NavRunway[]
  departures: readonly NavProcedure[]
  arrivals: readonly NavProcedure[]
  approaches: readonly NavApproach[]
}
