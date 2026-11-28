import type { AircraftFix } from '~/pages/Info/domain'
import { useSimVars } from '~/sim'

const FIX_SIM_VARS = {
  lat: { name: 'PLANE LATITUDE', unit: 'degrees' },
  lon: { name: 'PLANE LONGITUDE', unit: 'degrees' },
  headingDeg: { name: 'PLANE HEADING DEGREES TRUE', unit: 'degrees' },
  altitudeFt: { name: 'PLANE ALTITUDE', unit: 'feet' },
}

/**
 * Where the aircraft is (and how high) and its heading, for the wind card's ring marker,
 * the distances to its airport and an airport's heading-up runways. Once a second while `shown`: enough to follow an approach, cheap for
 * the sim; not at all otherwise.
 */
export function useAircraftFix(shown: boolean): AircraftFix {
  return useSimVars(FIX_SIM_VARS, shown ? 1 : 0)
}
