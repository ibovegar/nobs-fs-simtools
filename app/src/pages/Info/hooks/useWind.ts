import { type RingMarker, windView } from '~/pages/Info/domain'
import { useSimVars } from '~/sim'

const WIND_SIM_VARS = {
  windFromDeg: { name: 'AMBIENT WIND DIRECTION', unit: 'degrees' },
  windKt: { name: 'AMBIENT WIND VELOCITY', unit: 'knots' },
  headingDeg: { name: 'PLANE HEADING DEGREES TRUE', unit: 'degrees' },
}

/**
 * The wind where the aircraft is and the aircraft's heading, for the wind compass (with the
 * picked airport on its ring). Polled
 * at 2 Hz while shown (enough to follow a turn, cheap for the sim), not at all otherwise.
 */
export function useWind(shown: boolean, headingUp: boolean, airportMarker?: RingMarker) {
  const sim = useSimVars(WIND_SIM_VARS, shown ? 2 : 0)
  return windView(sim.windFromDeg, sim.windKt, sim.headingDeg, headingUp, airportMarker)
}
