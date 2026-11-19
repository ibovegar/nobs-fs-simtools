// The speeds to fly, by phase, as the Info tab shows them. Every part is optional: an
// aircraft shows only the figures SimTools has a source for.

/** Climb power as shown: torque by altitude, prop RPM and the ITT limit. */
export interface ClimbPowerInfo {
  torqueUnit: 'ft-lb' | '%'
  torque: readonly { altitudeFt: number; torque: number }[]
  propRpm: number
  ittLimitC?: number
}

export interface AircraftSpeeds {
  climb?: {
    kias: number
    /** When the speed changes on the way up: each speed applies up to `upToFt`. */
    schedule?: readonly { upToFt: number; speedKias: number }[]
    power?: ClimbPowerInfo
  }
  cruiseKtas?: number
  descent?: { kias: number; fpm?: number }
  approach?: {
    kias: number
    /** The weight the speed is for (lb); undefined: at the reference (max landing) weight. */
    weightLb?: number
    /** The landing flaps, when the speed isn't simply for full flaps. */
    flaps?: string
  }
}
