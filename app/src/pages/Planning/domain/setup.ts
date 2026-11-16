// What the Planning page persists: the runway length and condition, and the manual values
// used when the sim can't provide them.
export interface TakeoffSetup {
  /** Show weights in kg or lb. 'auto' follows the aircraft's own documents. */
  weightUnit: 'auto' | 'kg' | 'lb'
  /** Takeoff runway available (m). 0 = not set. */
  runwayLengthM: number
  wetRunway: boolean
  manualWeightKg: number
  manualCgPercentMac: number
  manualOatC: number
  manualPressureAltitudeFt: number
}

export const DEFAULT_TAKEOFF_SETUP: TakeoffSetup = {
  weightUnit: 'auto',
  runwayLengthM: 0,
  wetRunway: false,
  manualWeightKg: 20_000,
  manualCgPercentMac: 20,
  manualOatC: 15,
  manualPressureAltitudeFt: 0,
}
