import type { DescentProfile } from './descentMath'

export type DistanceSource = 'manual' | 'gps'

/** What the pilot sets up in the descent calculator — persisted between flights. */
export interface DescentSetup {
  targetAltitudeFt: number
  bufferNm: number
  profileKind: DescentProfile['kind']
  angleDeg: number
  rateFpm: number
  /** Fallbacks used when the sim can't provide a value. */
  manualAltitudeFt: number
  manualGroundSpeedKt: number
}

export const DEFAULT_DESCENT_SETUP: DescentSetup = {
  targetAltitudeFt: 3000,
  bufferNm: 0,
  profileKind: 'angle',
  angleDeg: 3,
  rateFpm: 1500,
  manualAltitudeFt: 10000,
  manualGroundSpeedKt: 250,
}

/** The descent profile a setup describes. */
export function profileFromSetup(setup: DescentSetup): DescentProfile {
  return setup.profileKind === 'angle'
    ? { kind: 'angle', degrees: setup.angleDeg }
    : { kind: 'rate', fpm: setup.rateFpm }
}
