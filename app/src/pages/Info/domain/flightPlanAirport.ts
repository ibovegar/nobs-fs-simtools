// Which airport the wind card follows from the flight plan: the departure (with its planned
// runway) until the aircraft has left it, then the destination (with its planned runway).
// Pure.

import { distanceNm } from './airportSearch'

/** This far from the departure airport, the aircraft has left it. */
export const LEFT_DEPARTURE_NM = 10

/** A runway as the flight plan names it: number '1' or '01', designator 'L' / 'R' / 'C' / ''. */
export interface PlanRunway {
  number: string
  designator: string
}

/** '01L' for { number: '1', designator: 'L' }; undefined when the plan names none. */
export function planRunwayName(runway: PlanRunway | undefined | null): string | undefined {
  const number = runway?.number?.trim() ?? ''
  if (!/^\d{1,2}$/.test(number) || Number(number) < 1 || Number(number) > 36) return undefined
  const designator = /^[LRCWAB]$/.test(runway?.designator ?? '') ? runway?.designator : ''
  return `${number.padStart(2, '0')}${designator}`
}

/** An airport of the flight plan, with its runway when the plan names one. */
export interface PlanAirport {
  ident: string
  runway: string | undefined
}

/**
 * The airport to follow: the departure while the aircraft is within 10 nm of it (or its
 * position isn't known), the destination after (the departure if the plan has none).
 */
export function flightPlanAirportNow(
  departure: (PlanAirport & { lat: number; lon: number }) | undefined,
  destination: PlanAirport | undefined,
  aircraft: { lat: number; lon: number } | undefined,
): PlanAirport | undefined {
  if (!departure) return destination
  const left = aircraft !== undefined && distanceNm(departure, aircraft) > LEFT_DEPARTURE_NM
  return left && destination ? destination : departure
}

/** Identifies a flight-plan airport + runway, to tell when it changes. */
export function planAirportKey(airport: PlanAirport): string {
  return `${airport.ident}|${airport.runway ?? ''}`
}
