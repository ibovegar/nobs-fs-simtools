// Every aircraft the Planning page knows, in the order the picker shows them. To add one,
// write a profile file next to these and list it here: see docs/takeoff-profiles.md.
//
// Detection tries the profiles in this order against the sim's TITLE and ATC MODEL, so
// put more specific patterns first.
import type { AircraftProfile } from '../types'
import { boeing737_400, boeing737_600 } from './boeing737'
import { caravan208B } from './caravan208B'
import { dash8_100, dash8_200, dash8_300 } from './dash8Classic'
import { dash8Q400 } from './dash8Q400'
import { kingAir350 } from './kingAir350'

export const AIRCRAFT_PROFILES: readonly AircraftProfile[] = [
  caravan208B,
  kingAir350,
  dash8_100,
  dash8_200,
  dash8_300,
  dash8Q400,
  boeing737_400,
  boeing737_600,
]

export {
  boeing737_400,
  boeing737_600,
  caravan208B,
  dash8_100,
  dash8_200,
  dash8_300,
  dash8Q400,
  kingAir350,
}
