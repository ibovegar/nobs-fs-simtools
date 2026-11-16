// The speeds to fly, by phase, as the Info tab shows them.

export interface AircraftSpeeds {
  climbKias: number
  cruiseKtas: number
  descentKias: number
  descentFpm: number
  approachKias: number
  /** The weight the approach speed is for (lb); undefined: at the max landing weight. */
  approachWeightLb: number | undefined
}
