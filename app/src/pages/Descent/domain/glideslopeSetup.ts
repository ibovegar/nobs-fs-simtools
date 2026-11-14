import type { DistanceSource } from './setup'

/** What the pilot sets up on the GS tab — persisted between flights. */
export interface GlideslopeSetup {
  /** The selected glideslope angle. */
  angleDeg: number
  runwayElevationFt: number
  distanceSource: DistanceSource
  /** Distance to the threshold when entered by hand; counts down as you fly. */
  manualDistanceNm: number
}

export const DEFAULT_GLIDESLOPE_SETUP: GlideslopeSetup = {
  angleDeg: 3,
  runwayElevationFt: 0,
  distanceSource: 'gps',
  manualDistanceNm: 10,
}
