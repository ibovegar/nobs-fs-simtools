// The shape of an aircraft takeoff profile. A profile is plain data (plus, for trim, one
// small function), so adding an aircraft means adding one file under profiles/.
// How-to: docs/takeoff-profiles.md.

/** Speeds at one weight, at the table's reference conditions. KIAS. */
export interface SpeedPoint {
  weightKg: number
  /** Decision speed. Omit for single-engine aircraft (no V1). */
  v1?: number
  vr: number
  /** Takeoff safety speed (multi-engine), or the speed at 50 ft (single-engine). */
  v2: number
}

/**
 * Additive corrections by outside air temperature and pressure altitude, as in Boeing's
 * "V1, VR, V2 Adjustments" table. Rows follow `tempsC` (ascending), columns follow
 * `altitudesFt` (ascending). Interpolated between cells, clamped at the edges.
 */
export interface SpeedAdjustments {
  tempsC: readonly number[]
  altitudesFt: readonly number[]
  v1: readonly (readonly number[])[]
  vr: readonly (readonly number[])[]
  v2: readonly (readonly number[])[]
}

/**
 * Speeds by weight at reference conditions. Interpolated linearly between points;
 * outside the table, scaled from the nearest point by √(weight ratio), as stall speed
 * scales.
 */
export interface WeightTableModel {
  kind: 'weight-table'
  points: readonly SpeedPoint[]
  adjustments?: SpeedAdjustments
}

/** One temperature band of a grid model: [VR, V2] per weight row and altitude column. */
export interface GridBand {
  /** The band applies at or below this OAT (°C). The last band applies above. */
  maxOatC: number
  rows: readonly (readonly (readonly [number, number])[])[]
}

/**
 * VR/V2 by weight × pressure altitude, in temperature bands (as on the Q400 speed card).
 * V1 = VR. Bilinear interpolation, √(weight) scaling outside the weight range.
 */
export interface GridModel {
  kind: 'grid'
  weightsKg: readonly number[]
  altitudesFt: readonly number[]
  bands: readonly GridBand[]
}

export type SpeedModel = WeightTableModel | GridModel

export interface FlapSetting {
  /** Stable id, persisted as the user's choice ('5', '15', 'approach'). */
  id: string
  /** Label on the button and in the summary ('5', 'Approach', '20°'). */
  label: string
  /**
   * Trailing-edge flap deflection (°) for the side view. Defaults to the number in the
   * label ('5' → 5°, '20°' → 20°), or 0.
   */
  angleDeg?: number
  speeds: SpeedModel
  /**
   * Takeoff field length (m) at max takeoff weight, sea level, ISA, dry, no wind. Used
   * only to recommend a flap setting for the runway, so an estimate is fine.
   */
  fieldLengthM: number
  /** The sim's FLAPS HANDLE INDEX for this detent, to show if the lever matches. */
  handleIndex?: number
  /** Minimum speeds (VMCG / VMCA limits). Applied after interpolation. */
  minV1?: number
  minVr?: number
  minV2?: number
}

export type TakeoffTrim =
  /** Stabiliser / elevator trim computed from CG (% MAC), in the aircraft's own units. */
  | {
      kind: 'computed'
      unit: string
      /** Step to round to (e.g. 0.25 units). */
      step: number
      compute: (cgPercentMac: number, weightKg: number, flapId: string) => number
      /** The trim indicator's full scale, e.g. [0, 17] units on a 737. */
      scale: readonly [number, number]
      /** The green takeoff band on that scale. */
      band: readonly [number, number]
      note?: string
    }
  /** No public table: tell the pilot how to set it (the picture shows a generic band). */
  | { kind: 'advice'; text: string }

export interface AircraftProfile {
  /** Stable id, persisted as the user's choice. */
  id: string
  /** Full name ('Boeing 737-600'). */
  name: string
  /** Short name for buttons and badges ('737-600'). */
  shortName: string
  /** Matched against the sim's TITLE and ATC MODEL to pick this profile automatically. */
  match: RegExp
  /** Single-engine aircraft have no V1/V2: the speeds are VR and the speed at 50 ft. */
  engines: 'single' | 'multi'
  maxTakeoffWeightKg: number
  /** Weight unit the aircraft's own documents use. */
  weightUnit: 'kg' | 'lb'
  /** Flap settings approved for takeoff, from least to most flap. */
  flaps: readonly FlapSetting[]
  /** The usual setting; the recommendation only moves to more flap when the runway is short. */
  defaultFlapId: string
  trim: TakeoffTrim
  /** Wet runway: V1 reduction (kt). Omit when there is no data; the option is then hidden. */
  wetV1ReductionKt?: number
  /** Short notes shown under the speeds (procedures, where the numbers come from). */
  notes: readonly string[]
  /** Where the data comes from, for the docs and the About text. */
  sources: readonly string[]
}

/** Everything the calculation needs, whether from the sim or entered by hand. */
export interface TakeoffConditions {
  weightKg: number
  cgPercentMac: number
  oatC: number
  pressureAltitudeFt: number
  /** Takeoff runway available (m). 0 = not set: recommend the profile's usual flap. */
  runwayLengthM: number
  wetRunway: boolean
}

export interface TakeoffSpeeds {
  v1?: number
  vr: number
  v2: number
}

export type TakeoffWarning =
  /** Far outside the aircraft's weights (wrong aircraft or weight): no speeds shown. */
  'weight-implausible' | 'over-mtow' | 'outside-table' | 'runway-short' | 'flaps-below-recommended'

export interface TakeoffResult {
  speeds: TakeoffSpeeds
  flap: FlapSetting
  recommendedFlap: FlapSetting
  /** Estimated runway needed with the chosen flap (m). */
  requiredRunwayM: number
  /** Trim value in the profile's unit, or undefined when the profile gives advice. */
  trim?: number
  warnings: readonly TakeoffWarning[]
}
