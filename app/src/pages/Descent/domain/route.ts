// Turns the sim's flight plan (EFB route) plus the departure and destination airports'
// procedures into an ordered list of fixes with their altitude and speed limits, then into
// positioned waypoints with distances. Pure and unit-tested.
//
// The input shapes mirror the sim's (see ~/sim navdata): the route names the SID / STAR /
// approach, and their legs come from the airports. Only legs that end at a fix are used;
// heading / altitude legs (VA, CA, VI…) have no position on a map.

import { FEET_PER_METRE, greatCircleNm, type LatLon, METRES_PER_NM, offsetLatLon } from './geo'

// ---------------------------------------------------------------------------------------
// Input shapes (structurally the sim's own)

export interface RouteIcao {
  type: string
  region: string
  airport: string
  ident: string
}

export interface RouteRunwayId {
  number: string
  designator: string
}

export interface PlanEnrouteLeg {
  fixIcao: RouteIcao
  via: string
  isPpos: boolean
  hasLatLon: boolean
  lat: number
  lon: number
  hasPointBearingDistance: boolean
  referenceIcao: RouteIcao
  bearing: number
  distance: number
}

export interface PlanRoute {
  departureAirport: RouteIcao
  destinationAirport: RouteIcao
  enroute: readonly PlanEnrouteLeg[]
  departureRunway: RouteRunwayId
  departure: string
  departureTransition: string
  destinationRunway: RouteRunwayId
  arrival: string
  arrivalTransition: string
  approach: { type: string; runway: RouteRunwayId; suffix: string }
  approachTransition: string
  cruiseAltitude: { altitude: number; isFlightLevel: boolean } | null
}

export interface PlanLeg {
  type: number
  fixIcaoStruct?: RouteIcao
  fixIcao?: string
  altDesc: number
  altitude1: number
  altitude2: number
  speedRestriction: number
  speedRestrictionDesc?: number
}

interface PlanTransition {
  name: string
  legs: readonly PlanLeg[]
}

export interface PlanProcedure {
  name: string
  commonLegs: readonly PlanLeg[]
  enRouteTransitions: readonly PlanTransition[]
  runwayTransitions: readonly {
    runwayNumber: number
    runwayDesignation: number
    legs: readonly PlanLeg[]
  }[]
}

export interface PlanApproach {
  approachType: number
  approachSuffix: string
  runwayNumber: number
  runwayDesignator: number
  transitions: readonly PlanTransition[]
  finalLegs: readonly PlanLeg[]
}

export interface PlanRunway {
  latitude: number
  longitude: number
  direction: number
  designation: string
  length: number
  designatorCharPrimary: number
  designatorCharSecondary: number
  primaryElevation: number
  secondaryElevation: number
  primaryThresholdLength: number
  secondaryThresholdLength: number
}

export interface PlanAirport {
  lat: number
  lon: number
  /** Metres. */
  altitude: number
  runways: readonly PlanRunway[]
  departures: readonly PlanProcedure[]
  arrivals: readonly PlanProcedure[]
  approaches: readonly PlanApproach[]
}

// ---------------------------------------------------------------------------------------
// Output

export type RoutePhase = 'departure' | 'enroute' | 'arrival' | 'approach'

export interface AltitudeConstraint {
  kind: 'at' | 'atOrAbove' | 'atOrBelow' | 'between'
  /** Must be at or above this (at, atOrAbove, between). */
  lowerFt?: number
  /** Must be at or below this (at, atOrBelow, between). */
  upperFt?: number
}

export interface SpeedConstraint {
  kind: 'at' | 'atOrAbove' | 'atOrBelow'
  kt: number
}

export type FixLocation =
  | { kind: 'point'; lat: number; lon: number }
  | { kind: 'icao'; icao: RouteIcao }
  | { kind: 'bearingDistance'; reference: RouteIcao; bearingDeg: number; distanceNm: number }

export interface RouteFix {
  /** Identity for de-duplication: the same fix twice in a row is one waypoint. */
  key: string
  ident: string
  phase: RoutePhase
  /** Airway flown to this fix. */
  via?: string
  /** Runway this fix is the threshold of, e.g. '27L'. */
  runway?: string
  location: FixLocation
  altitude?: AltitudeConstraint
  speed?: SpeedConstraint
  /** Ground elevation, for the airport / runway ends of the route. */
  elevationFt?: number
}

export interface RouteWaypoint extends Omit<RouteFix, 'location'> {
  lat: number
  lon: number
  /** From the previous waypoint. */
  legNm: number
  /** From the start of the route. */
  distanceNm: number
}

// ---------------------------------------------------------------------------------------
// Sim enums

/** Leg types that end at a fix: AF, CF, DF, HA, HF, HM, IF, RF, TF. */
const FIX_TERMINATED_LEGS = new Set([1, 4, 7, 12, 13, 14, 15, 17, 18])

const DESIGNATOR_LETTERS = ['', 'L', 'R', 'C', 'W', 'A', 'B']
const COMPASS_RUNWAYS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

const APPROACH_TYPES: Record<string, number> = {
  GPS: 1,
  VOR: 2,
  NDB: 3,
  ILS: 4,
  LOC: 5,
  SDF: 6,
  LDA: 7,
  VORDME: 8,
  NDBDME: 9,
  RNAV: 10,
  BLOC: 11,
}

/** Threshold crossing height assumed at the destination runway. */
export const THRESHOLD_HEIGHT_FT = 50

// ---------------------------------------------------------------------------------------
// Helpers

/** Sim runway number (1–36, 37+ compass) → '01'…'36' / 'N'… */
export function runwayNumberString(n: number): string {
  if (n >= 1 && n <= 36) return String(n).padStart(2, '0')
  return COMPASS_RUNWAYS[n - 37] ?? ''
}

function normaliseRunwayNumber(number: string): string {
  return /^\d$/.test(number) ? `0${number}` : number
}

export function icaoKey(icao: RouteIcao): string {
  return `${icao.type}|${icao.region}|${icao.airport}|${icao.ident}`
}

/** A leg's fix: the 2024 struct, or the older 12-character string. */
export function legFixIcao(leg: PlanLeg): RouteIcao | undefined {
  if (leg.fixIcaoStruct?.ident) return leg.fixIcaoStruct
  const s = leg.fixIcao
  if (!s || s.trim() === '') return undefined
  return {
    type: s.substring(0, 1).trim(),
    region: s.substring(1, 3).trim(),
    airport: s.substring(3, 7).trim(),
    ident: s.substring(7).trim(),
  }
}

const roundFt = (metres: number) => Math.round((metres * FEET_PER_METRE) / 10) * 10

export function legAltitude(leg: PlanLeg): AltitudeConstraint | undefined {
  const a1 = roundFt(leg.altitude1)
  const a2 = roundFt(leg.altitude2)
  switch (leg.altDesc) {
    case 1:
      return { kind: 'at', lowerFt: a1, upperFt: a1 }
    case 2:
      return { kind: 'atOrAbove', lowerFt: a1 }
    case 3:
      return { kind: 'atOrBelow', upperFt: a1 }
    case 4:
      return { kind: 'between', lowerFt: Math.min(a1, a2), upperFt: Math.max(a1, a2) }
    default:
      return undefined
  }
}

export function legSpeed(leg: PlanLeg): SpeedConstraint | undefined {
  if (!(leg.speedRestriction > 0)) return undefined
  const kt = Math.round(leg.speedRestriction)
  switch (leg.speedRestrictionDesc) {
    case 1:
      return { kind: 'at', kt }
    case 2:
      return { kind: 'atOrAbove', kt }
    default:
      // At or below, between (not used in the database), or older data without a type.
      return { kind: 'atOrBelow', kt }
  }
}

export interface RunwayEnd {
  lat: number
  lon: number
  elevationFt: number
  courseDeg: number
  /** e.g. '27L'. */
  ident: string
}

/** The threshold of one runway direction, e.g. number '27', designator 'L'. */
export function findRunwayEnd(
  airport: PlanAirport,
  number: string,
  designator: string,
): RunwayEnd | undefined {
  const wanted = normaliseRunwayNumber(number)
  if (!wanted) return undefined
  for (const runway of airport.runways) {
    const parts = runway.designation.split('-')
    for (let i = 0; i < 2; i++) {
      const n = Number.parseInt(parts[i] ?? '', 10)
      if (Number.isNaN(n)) continue
      const letter =
        DESIGNATOR_LETTERS[
          i === 0 ? runway.designatorCharPrimary : runway.designatorCharSecondary
        ] ?? ''
      if (runwayNumberString(n) !== wanted || letter !== designator) continue

      const courseDeg = i === 0 ? runway.direction : (runway.direction + 180) % 360
      const thresholdM = i === 0 ? runway.primaryThresholdLength : runway.secondaryThresholdLength
      const fromCentreNm = (runway.length / 2 - thresholdM) / METRES_PER_NM
      const p = offsetLatLon(
        { lat: runway.latitude, lon: runway.longitude },
        courseDeg + 180,
        fromCentreNm,
      )
      const elevationM = i === 0 ? runway.primaryElevation : runway.secondaryElevation
      return {
        ...p,
        elevationFt: elevationM * FEET_PER_METRE,
        courseDeg,
        ident: `${wanted}${designator}`,
      }
    }
  }
  return undefined
}

/** 'RW27L' → { number: '27', designator: 'L' } */
function runwayFromIdent(ident: string): RouteRunwayId {
  const m = /^RW(\d{1,2}|[NSEW]{1,2})([LRCWAB]?)$/.exec(ident.trim())
  return m ? { number: m[1] ?? '', designator: m[2] ?? '' } : { number: '', designator: '' }
}

const runwayKey = (airportIdent: string, runwayIdent: string) =>
  `RWY|${airportIdent}|${runwayIdent}`

const matchesRunway = (number: number, designation: number, runway: RouteRunwayId) =>
  runway.number !== '' &&
  runwayNumberString(number) === normaliseRunwayNumber(runway.number) &&
  (DESIGNATOR_LETTERS[designation] ?? '') === runway.designator

// ---------------------------------------------------------------------------------------
// Fix list

export interface CollectedRoute {
  fixes: RouteFix[]
  /** Procedures named in the plan that the navigation database doesn't have. */
  missingProcedures: string[]
}

/**
 * The plan's fixes in flying order: departure runway (or airport), SID, enroute fixes,
 * STAR, approach, destination runway (or airport). Airports may be null when they could not
 * be loaded; their procedures are then skipped.
 */
export function collectRouteFixes(
  plan: PlanRoute,
  departure: PlanAirport | null,
  destination: PlanAirport | null,
): CollectedRoute {
  const fixes: RouteFix[] = []
  const missingProcedures: string[] = []
  const depIdent = plan.departureAirport.ident
  const destIdent = plan.destinationAirport.ident

  const push = (fix: RouteFix) => {
    const last = fixes[fixes.length - 1]
    if (last && last.key === fix.key) {
      fixes[fixes.length - 1] = {
        ...last,
        phase: fix.phase === 'enroute' ? last.phase : fix.phase,
        via: last.via ?? fix.via,
        altitude: fix.altitude ?? last.altitude,
        speed: fix.speed ?? last.speed,
        elevationFt: last.elevationFt ?? fix.elevationFt,
        runway: last.runway ?? fix.runway,
      }
      return
    }
    fixes.push(fix)
  }

  const runwayFix = (
    airport: PlanAirport | null,
    airportIdent: string,
    runway: RouteRunwayId,
    phase: RoutePhase,
  ): RouteFix | undefined => {
    if (!airport) return undefined
    const end = findRunwayEnd(airport, runway.number, runway.designator)
    if (!end) return undefined
    return {
      key: runwayKey(airportIdent, `RW${end.ident}`),
      ident: airportIdent,
      runway: end.ident,
      phase,
      location: { kind: 'point', lat: end.lat, lon: end.lon },
      elevationFt: end.elevationFt,
    }
  }

  const airportFix = (
    airport: PlanAirport | null,
    icao: RouteIcao,
    phase: RoutePhase,
  ): RouteFix | undefined => {
    if (!icao.ident) return undefined
    return {
      key: `APT|${icao.ident}`,
      ident: icao.ident,
      phase,
      location: airport
        ? { kind: 'point', lat: airport.lat, lon: airport.lon }
        : { kind: 'icao', icao: { ...icao, type: 'A' } },
      elevationFt: airport ? airport.altitude * FEET_PER_METRE : undefined,
    }
  }

  const addLegs = (legs: readonly PlanLeg[], phase: RoutePhase) => {
    for (const leg of legs) {
      if (!FIX_TERMINATED_LEGS.has(leg.type)) continue
      const icao = legFixIcao(leg)
      if (!icao) continue
      const altitude = legAltitude(leg)
      const speed = legSpeed(leg)
      if (icao.type === 'R') {
        const isDeparture = icao.airport === depIdent && phase === 'departure'
        const fix = runwayFix(
          isDeparture ? departure : destination,
          isDeparture ? depIdent : destIdent,
          runwayFromIdent(icao.ident),
          phase,
        )
        if (fix) push({ ...fix, altitude, speed })
        continue
      }
      push({
        key: icaoKey(icao),
        ident: icao.ident,
        phase,
        location: { kind: 'icao', icao },
        altitude,
        speed,
      })
    }
  }

  // Departure end.
  const start =
    runwayFix(departure, depIdent, plan.departureRunway, 'departure') ??
    airportFix(departure, plan.departureAirport, 'departure')
  if (start) push(start)

  // SID: runway transition, common legs, enroute transition.
  if (plan.departure) {
    const sid = departure?.departures.find((p) => p.name === plan.departure)
    if (sid) {
      const rwy = sid.runwayTransitions.find((t) =>
        matchesRunway(t.runwayNumber, t.runwayDesignation, plan.departureRunway),
      )
      addLegs(rwy?.legs ?? [], 'departure')
      addLegs(sid.commonLegs, 'departure')
      const trans = sid.enRouteTransitions.find((t) => t.name === plan.departureTransition)
      addLegs(trans?.legs ?? [], 'departure')
    } else if (departure) {
      missingProcedures.push(plan.departure)
    }
  }

  // Enroute.
  for (const leg of plan.enroute) {
    if (leg.isPpos) continue
    const via = leg.via || undefined
    if (leg.hasLatLon) {
      push({
        key: `LL|${leg.lat.toFixed(4)}|${leg.lon.toFixed(4)}`,
        ident: leg.fixIcao.ident || 'USER',
        phase: 'enroute',
        via,
        location: { kind: 'point', lat: leg.lat, lon: leg.lon },
      })
    } else if (leg.hasPointBearingDistance) {
      push({
        key: `PBD|${icaoKey(leg.referenceIcao)}|${leg.bearing}|${leg.distance}`,
        ident: leg.fixIcao.ident || `${leg.referenceIcao.ident}${Math.round(leg.bearing)}`,
        phase: 'enroute',
        via,
        location: {
          kind: 'bearingDistance',
          reference: leg.referenceIcao,
          bearingDeg: leg.bearing,
          distanceNm: leg.distance,
        },
      })
    } else if (leg.fixIcao.ident) {
      push({
        key: icaoKey(leg.fixIcao),
        ident: leg.fixIcao.ident,
        phase: 'enroute',
        via,
        location: { kind: 'icao', icao: leg.fixIcao },
      })
    }
  }

  // STAR: enroute transition, common legs, runway transition.
  if (plan.arrival) {
    const star = destination?.arrivals.find((p) => p.name === plan.arrival)
    if (star) {
      const trans = star.enRouteTransitions.find((t) => t.name === plan.arrivalTransition)
      addLegs(trans?.legs ?? [], 'arrival')
      addLegs(star.commonLegs, 'arrival')
      const rwy = star.runwayTransitions.find((t) =>
        matchesRunway(t.runwayNumber, t.runwayDesignation, plan.destinationRunway),
      )
      addLegs(rwy?.legs ?? [], 'arrival')
    } else if (destination) {
      missingProcedures.push(plan.arrival)
    }
  }

  // Approach: transition, final legs (not the missed approach).
  const approachType = APPROACH_TYPES[plan.approach.type]
  if (approachType !== undefined) {
    const id = plan.approach
    const approach = destination?.approaches.find(
      (a) =>
        a.approachType === approachType &&
        a.approachSuffix === id.suffix &&
        matchesRunway(a.runwayNumber, a.runwayDesignator, id.runway),
    )
    if (approach) {
      const trans = approach.transitions.find((t) => t.name === plan.approachTransition)
      addLegs(trans?.legs ?? [], 'approach')
      addLegs(approach.finalLegs, 'approach')
    } else if (destination) {
      const rwy = `${id.runway.number}${id.runway.designator}`
      missingProcedures.push(`${id.type} ${rwy}${id.suffix ? `-${id.suffix}` : ''}`)
    }
  }

  // Destination end: the landing runway's threshold, else the airport.
  const landingRunway =
    plan.destinationRunway.number !== '' ? plan.destinationRunway : plan.approach.runway
  const end =
    runwayFix(destination, destIdent, landingRunway, 'approach') ??
    airportFix(destination, plan.destinationAirport, 'approach')
  // If the approach ends at a missed-approach point before the runway, still finish there.
  if (end) push(end)

  return { fixes, missingProcedures }
}

/** The facilities whose positions must be looked up, without duplicates. */
export function fixesToLoad(fixes: readonly RouteFix[]): RouteIcao[] {
  const out = new Map<string, RouteIcao>()
  for (const fix of fixes) {
    const icao =
      fix.location.kind === 'icao'
        ? fix.location.icao
        : fix.location.kind === 'bearingDistance'
          ? fix.location.reference
          : undefined
    if (icao) out.set(icaoKey(icao), icao)
  }
  return [...out.values()]
}

export interface BuiltRoute {
  waypoints: RouteWaypoint[]
  /** Idents that could not be positioned (not in the database); left out of the route. */
  missingFixes: string[]
  totalNm: number
}

/** Positions the fixes (via `lookup` for database facilities) and measures the legs. */
export function buildRoute(
  fixes: readonly RouteFix[],
  lookup: (icao: RouteIcao) => LatLon | undefined,
): BuiltRoute {
  const waypoints: RouteWaypoint[] = []
  const missingFixes: string[] = []
  let distanceNm = 0

  for (const fix of fixes) {
    let position: LatLon | undefined
    if (fix.location.kind === 'point') position = fix.location
    else if (fix.location.kind === 'icao') position = lookup(fix.location.icao)
    else {
      const ref = lookup(fix.location.reference)
      if (ref) position = offsetLatLon(ref, fix.location.bearingDeg, fix.location.distanceNm)
    }
    if (!position) {
      missingFixes.push(fix.ident)
      continue
    }

    const prev = waypoints[waypoints.length - 1]
    const legNm = prev ? greatCircleNm(prev, position) : 0
    distanceNm += legNm
    const { location: _location, ...rest } = fix
    waypoints.push({ ...rest, lat: position.lat, lon: position.lon, legNm, distanceNm })
  }

  return { waypoints, missingFixes, totalNm: distanceNm }
}

/**
 * Whether two reads of the sim's flight plan describe the same route (airports, runways,
 * procedures, enroute fixes, cruise altitude), so a loaded route can be reused.
 */
export function isSamePlan(a: PlanRoute, b: PlanRoute): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** The plan's cruise altitude in feet, or undefined when it has none. */
export function planCruiseFt(plan: PlanRoute): number | undefined {
  const alt = plan.cruiseAltitude
  if (!alt || !(alt.altitude > 0)) return undefined
  // Flight levels may come as the level (350) or in feet (35000).
  return alt.isFlightLevel && alt.altitude < 1000 ? alt.altitude * 100 : alt.altitude
}

const runwayLabel = (r: RouteRunwayId) =>
  r.number ? `${normaliseRunwayNumber(r.number)}${r.designator}` : ''

/** 'ENGM 01L → ENBR 17' and 'ALPHA1A · DELTA1B · ILS 17', for headings. */
export function describeRoute(plan: PlanRoute): { title: string; procedures: string } {
  const end = (icao: RouteIcao, runway: RouteRunwayId) =>
    [icao.ident, runwayLabel(runway)].filter(Boolean).join(' ') || '—'
  const a = plan.approach
  const approachName = a.type === 'GENVIS' ? 'Visual' : a.type
  const approach = a.type
    ? `${approachName} ${runwayLabel(a.runway)}${a.suffix ? `-${a.suffix}` : ''}`.trim()
    : ''
  return {
    title: `${end(plan.departureAirport, plan.departureRunway)} → ${end(plan.destinationAirport, plan.destinationRunway)}`,
    procedures: [plan.departure, plan.arrival, approach].filter(Boolean).join(' · '),
  }
}
