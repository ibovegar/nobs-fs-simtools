import { useEffect, useState } from 'react'
import { advanceFlight, INITIAL_MOCK_FLIGHT, type MockFlightState } from '~/dev/domain'
import { MockSimBridge } from '~/dev/MockSimBridge'

const TICK_MS = 250

/**
 * Runs the dev harness's mock flight: ticks the flight model (~/dev/domain) while
 * running and mirrors the state into a MockSimBridge that SimTools polls like the
 * real sim. Disconnecting clears every value, so the app falls back to manual input.
 */
export function useMockFlight() {
  const [bridge] = useState(() => new MockSimBridge())
  const [state, setState] = useState(INITIAL_MOCK_FLIGHT)
  const update = (patch: Partial<MockFlightState>) => setState((s) => ({ ...s, ...patch }))

  useEffect(() => {
    if (!state.running) return
    const id = setInterval(() => setState((s) => advanceFlight(s, TICK_MS / 1000)), TICK_MS)
    return () => clearInterval(id)
  }, [state.running])

  useEffect(() => {
    const on = state.connected
    bridge.set('INDICATED ALTITUDE', on ? state.altitudeFt : undefined)
    bridge.set('GROUND VELOCITY', on ? state.groundSpeedKt : undefined)
    bridge.set('VERTICAL SPEED', on ? state.verticalSpeedFpm : undefined)
    bridge.set('GPS WP DISTANCE', on ? state.gpsDistanceNm : undefined)
    bridge.set('E:SIMULATION TIME', on ? state.simTimeSec : undefined)
    bridge.set('TOTAL WEIGHT', on ? state.totalWeightLb : undefined)
    bridge.set('CG PERCENT', on ? state.cgPercentMac : undefined)
    bridge.set('AMBIENT TEMPERATURE', on ? state.oatC : undefined)
    bridge.set('PRESSURE ALTITUDE', on ? state.pressureAltitudeFt : undefined)
    bridge.set('FLAPS HANDLE INDEX', on ? state.flapHandleIndex : undefined)
    bridge.set('PLANE HEADING DEGREES MAGNETIC', on ? state.headingMagDeg : undefined)
    bridge.setText('TITLE', on ? state.aircraftTitle : undefined)
  }, [bridge, state])

  return { bridge, state, update }
}
