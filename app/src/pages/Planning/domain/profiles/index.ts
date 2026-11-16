// Takeoff data for every aircraft the Planning page supports, keyed by the aircraft's id
// in ~/aircraft (which recognises it in the sim). To add one, write a profile file next to
// these and list it here: see docs/takeoff-profiles.md.
import type { AircraftProfile } from '../types'
import { boeing737_400, boeing737_600 } from './boeing737'
import { caravan208B } from './caravan208B'
import { dash8_100, dash8_200, dash8_300 } from './dash8Classic'
import { dash8Q400 } from './dash8Q400'
import { kingAir350 } from './kingAir350'
import { tbm850 } from './tbm850'

export const AIRCRAFT_PROFILES: readonly AircraftProfile[] = [
  caravan208B,
  tbm850,
  kingAir350,
  dash8_100,
  dash8_200,
  dash8_300,
  dash8Q400,
  boeing737_400,
  boeing737_600,
]

/** The takeoff data for an aircraft id, if the Planning page has any. */
export function takeoffProfile(aircraftId: string | undefined): AircraftProfile | undefined {
  return AIRCRAFT_PROFILES.find((p) => p.id === aircraftId)
}

export {
  boeing737_400,
  boeing737_600,
  caravan208B,
  dash8_100,
  dash8_200,
  dash8_300,
  dash8Q400,
  kingAir350,
  tbm850,
}
