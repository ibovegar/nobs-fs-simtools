// The dev harness's tiny flight model. Pure and unit-tested.

export interface MockFlightState {
  connected: boolean
  running: boolean
  /** Sim-time multiplier while running. */
  timeScale: number
  altitudeFt: number
  groundSpeedKt: number
  verticalSpeedFpm: number
  gpsDistanceNm: number
  simTimeSec: number
}

export const INITIAL_MOCK_FLIGHT: MockFlightState = {
  connected: true,
  running: false,
  timeScale: 1,
  altitudeFt: 35000,
  groundSpeedKt: 450,
  verticalSpeedFpm: 0,
  gpsDistanceNm: 150,
  simTimeSec: 0,
}

/**
 * Advance the flight by `realSec` of wall-clock time (scaled by `timeScale`): sim time
 * moves on, the GPS distance closes at groundspeed and altitude follows the vertical
 * speed. Distance and altitude never go below zero.
 */
export function advanceFlight(state: MockFlightState, realSec: number): MockFlightState {
  const dt = realSec * state.timeScale
  return {
    ...state,
    simTimeSec: state.simTimeSec + dt,
    gpsDistanceNm: Math.max(0, state.gpsDistanceNm - (state.groundSpeedKt * dt) / 3600),
    altitudeFt: Math.max(0, state.altitudeFt + (state.verticalSpeedFpm * dt) / 60),
  }
}
