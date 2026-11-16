// The dev harness's tiny flight model. Pure and unit-tested.

import type { MockRouteId } from './mockRoutes'

export interface MockFlightState {
  connected: boolean
  running: boolean
  /** Sim-time multiplier while running. */
  timeScale: number
  altitudeFt: number
  groundSpeedKt: number
  verticalSpeedFpm: number
  gpsDistanceNm: number
  /**
   * Autopilot selected altitude: climbing or descending through it levels off there
   * (vertical speed back to 0), like an ALT capture.
   */
  selectedAltitudeFt: number
  /** The mock flight plan the sim reports ('none' = no flight plan). */
  routeId: MockRouteId
  /** Distance flown along the flight plan; the sim reports the matching position. */
  routeProgressNm: number
  /** Leave one fix out of the mock navigation database, to test missing fixes. */
  missingFix: boolean
  simTimeSec: number
  /** The aircraft TITLE the sim reports ('' = none), for the Takeoff page's detection. */
  aircraftTitle: string
  totalWeightLb: number
  cgPercentMac: number
  oatC: number
  pressureAltitudeFt: number
  flapHandleIndex: number
  headingMagDeg: number
}

export const INITIAL_MOCK_FLIGHT: MockFlightState = {
  connected: true,
  running: false,
  timeScale: 1,
  altitudeFt: 35000,
  groundSpeedKt: 450,
  verticalSpeedFpm: 0,
  gpsDistanceNm: 150,
  selectedAltitudeFt: 35000,
  routeId: 'oslo-bergen',
  routeProgressNm: 0,
  missingFix: false,
  simTimeSec: 0,
  aircraftTitle: 'PMDG 737-600 House livery',
  totalWeightLb: 120_000,
  cgPercentMac: 22,
  oatC: 15,
  pressureAltitudeFt: 0,
  flapHandleIndex: 3,
  headingMagDeg: 268,
}

/**
 * Advance the flight by `realSec` of wall-clock time (scaled by `timeScale`): sim time
 * moves on, the GPS distance closes and the aircraft moves along the flight plan (up to
 * `routeLengthNm`) at groundspeed, and altitude follows the vertical speed until it reaches
 * the selected altitude. Distances and altitude never go below zero.
 */
export function advanceFlight(
  state: MockFlightState,
  realSec: number,
  routeLengthNm = Number.POSITIVE_INFINITY,
): MockFlightState {
  const dt = realSec * state.timeScale
  const flown = (state.groundSpeedKt * dt) / 3600

  let altitudeFt = state.altitudeFt + (state.verticalSpeedFpm * dt) / 60
  let verticalSpeedFpm = state.verticalSpeedFpm
  const selected = state.selectedAltitudeFt
  const crossed =
    (verticalSpeedFpm > 0 && state.altitudeFt <= selected && altitudeFt >= selected) ||
    (verticalSpeedFpm < 0 && state.altitudeFt >= selected && altitudeFt <= selected)
  if (crossed) {
    altitudeFt = selected
    verticalSpeedFpm = 0
  }

  return {
    ...state,
    simTimeSec: state.simTimeSec + dt,
    gpsDistanceNm: Math.max(0, state.gpsDistanceNm - flown),
    routeProgressNm: Math.min(routeLengthNm, state.routeProgressNm + flown),
    altitudeFt: Math.max(0, altitudeFt),
    verticalSpeedFpm,
  }
}
