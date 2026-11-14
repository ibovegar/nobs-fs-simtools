// What the Takeoff page persists: the aircraft and flap choice, and the manual values
// used when the sim can't provide them.
import type { RunwaySide } from './runway'

export interface TakeoffSetup {
  /** A profile id, or 'auto' to follow the aircraft loaded in the sim. */
  aircraftId: string
  /** A flap id of the current aircraft, or 'auto' for the recommended setting. */
  flapId: string
  /** Show weights in kg or lb. 'auto' follows the aircraft's own documents. */
  weightUnit: 'auto' | 'kg' | 'lb'
  /** Takeoff runway available (m). 0 = not set. */
  runwayLengthM: number
  /** Runway number 1–36 for the picture. 0 = follow the aircraft's magnetic heading. */
  runwayNumber: number
  runwaySide: RunwaySide
  wetRunway: boolean
  manualWeightKg: number
  manualCgPercentMac: number
  manualOatC: number
  manualPressureAltitudeFt: number
}

export const DEFAULT_TAKEOFF_SETUP: TakeoffSetup = {
  aircraftId: 'auto',
  flapId: 'auto',
  weightUnit: 'auto',
  runwayLengthM: 0,
  runwayNumber: 0,
  runwaySide: '',
  wetRunway: false,
  manualWeightKg: 20_000,
  manualCgPercentMac: 20,
  manualOatC: 15,
  manualPressureAltitudeFt: 0,
}
