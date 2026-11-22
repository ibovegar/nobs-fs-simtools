import { useEffect, useState } from 'react'
import {
  advanceFlight,
  INITIAL_MOCK_FLIGHT,
  type MockFlightState,
  mockAircraft,
  mockRoute,
  mockRoutePath,
  pointAlong,
} from '~/dev/domain'
import { MockSimBridge } from '~/dev/MockSimBridge'

const TICK_MS = 250

/**
 * Runs the dev harness's mock flight: ticks the flight model (~/dev/domain) while
 * running and mirrors the state into a MockSimBridge that SimTools polls like the
 * real sim, including the selected mock flight plan and the aircraft's position along it.
 * Disconnecting clears every value, so the app falls back to manual input.
 */
export function useMockFlight() {
  const [bridge] = useState(() => new MockSimBridge())
  const [state, setState] = useState(INITIAL_MOCK_FLIGHT)
  const update = (patch: Partial<MockFlightState>) => setState((s) => ({ ...s, ...patch }))

  const route = mockRoute(state.routeId)
  const path = route ? mockRoutePath(route, state.missingFix) : undefined
  const routeLengthNm = path?.totalNm

  useEffect(() => {
    if (!state.running) return
    const id = setInterval(
      () => setState((s) => advanceFlight(s, TICK_MS / 1000, routeLengthNm)),
      TICK_MS,
    )
    return () => clearInterval(id)
  }, [state.running, routeLengthNm])

  useEffect(() => {
    bridge.navData.setScenario(state.connected ? state.routeId : 'none', state.missingFix)
  }, [bridge, state.connected, state.routeId, state.missingFix])

  useEffect(() => {
    const on = state.connected
    bridge.set('INDICATED ALTITUDE', on ? state.altitudeFt : undefined)
    bridge.set('GROUND VELOCITY', on ? state.groundSpeedKt : undefined)
    bridge.set('VERTICAL SPEED', on ? state.verticalSpeedFpm : undefined)
    bridge.set('GPS WP DISTANCE', on ? state.gpsDistanceNm : undefined)
    // Somewhere south of Oslo without a flight plan; on the route with one.
    const position = (path && pointAlong(path, state.routeProgressNm)) ?? {
      lat: 59.9,
      lon: 10.7,
    }
    bridge.set('PLANE LATITUDE', on ? position.lat : undefined)
    bridge.set('PLANE LONGITUDE', on ? position.lon : undefined)
    bridge.set('E:SIMULATION TIME', on ? state.simTimeSec : undefined)
    bridge.set('TOTAL WEIGHT', on ? state.totalWeightLb : undefined)
    bridge.set('CG PERCENT', on ? state.cgPercentMac : undefined)
    bridge.set('AMBIENT TEMPERATURE', on ? state.oatC : undefined)
    bridge.set('PRESSURE ALTITUDE', on ? state.pressureAltitudeFt : undefined)
    bridge.set('FLAPS HANDLE INDEX', on ? state.flapHandleIndex : undefined)
    bridge.set('PLANE HEADING DEGREES MAGNETIC', on ? state.headingMagDeg : undefined)
    const aircraft = mockAircraft(state.aircraftId)
    bridge.setText('TITLE', on ? aircraft.title : undefined)
    bridge.setText('ATC MODEL', on ? aircraft.atcModel : undefined)
  }, [bridge, state, path])

  return { bridge, state, update, path }
}
