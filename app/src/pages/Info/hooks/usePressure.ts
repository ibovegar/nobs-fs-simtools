import { pressureReadouts } from '~/pages/Info/domain'
import { useSimVars } from '~/sim'

const PRESSURE_SIM_VARS = {
  seaLevelHpa: { name: 'SEA LEVEL PRESSURE', unit: 'millibars' },
}

/**
 * The sea-level pressure (QNH) where the aircraft is, in hPa and inHg. Polled every 2 s:
 * it changes slowly.
 */
export function usePressure() {
  const sim = useSimVars(PRESSURE_SIM_VARS, 0.5)
  return pressureReadouts(sim.seaLevelHpa)
}
