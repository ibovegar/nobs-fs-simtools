// Takeoff speeds, flap recommendation and trim from an aircraft profile. Pure and
// unit-tested. The numbers come from the profile's tables; this file only interpolates,
// corrects and picks.
import type {
  AircraftProfile,
  FlapSetting,
  GridModel,
  SpeedAdjustments,
  SpeedPoint,
  TakeoffConditions,
  TakeoffResult,
  TakeoffSpeeds,
  TakeoffWarning,
} from './types'

export const LB_PER_KG = 2.204_622_6
export const FT_PER_M = 3.280_84

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Where `x` falls in an ascending list: the index of the lower neighbour and the fraction
 * towards the next one. Clamped to the ends.
 */
function locate(xs: readonly number[], x: number): { i: number; t: number } {
  const last = xs.length - 1
  if (last <= 0 || x <= (xs[0] ?? 0)) return { i: 0, t: 0 }
  if (x >= (xs[last] ?? 0)) return { i: Math.max(0, last - 1), t: last === 0 ? 0 : 1 }
  let i = 0
  while (i < last - 1 && x > (xs[i + 1] ?? 0)) i++
  const lo = xs[i] ?? 0
  const hi = xs[i + 1] ?? lo
  return { i, t: hi === lo ? 0 : (x - lo) / (hi - lo) }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Bilinear lookup in a [row][col] table, clamped to its edges. */
export function lookup2d(
  table: readonly (readonly number[])[],
  rowsAt: readonly number[],
  colsAt: readonly number[],
  row: number,
  col: number,
): number {
  const r = locate(rowsAt, row)
  const c = locate(colsAt, col)
  const cell = (ri: number, ci: number) => {
    const line = table[Math.min(ri, table.length - 1)] ?? []
    return line[Math.min(ci, line.length - 1)] ?? 0
  }
  const top = lerp(cell(r.i, c.i), cell(r.i, c.i + 1), c.t)
  const bottom = lerp(cell(r.i + 1, c.i), cell(r.i + 1, c.i + 1), c.t)
  return lerp(top, bottom, r.t)
}

/**
 * Air density relative to sea-level ISA, from pressure altitude and OAT (ISA pressure
 * law, ideal gas). Below 1 means thinner air: longer takeoff runs.
 */
export function densityRatio(pressureAltitudeFt: number, oatC: number): number {
  const pressureRatio = (1 - 6.875_6e-6 * pressureAltitudeFt) ** 5.2559
  return pressureRatio / ((oatC + 273.15) / 288.15)
}

/** Speeds at `weightKg` from a weight table, before adjustments. */
function fromWeightTable(points: readonly SpeedPoint[], weightKg: number): TakeoffSpeeds {
  const sorted = [...points].sort((a, b) => a.weightKg - b.weightKg)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  if (!first || !last) return { vr: 0, v2: 0 }

  // Outside the table: scale the nearest point like a stall speed, √(W / W0).
  const edge = weightKg < first.weightKg ? first : weightKg > last.weightKg ? last : undefined
  if (edge) {
    const k = Math.sqrt(weightKg / edge.weightKg)
    return {
      v1: edge.v1 === undefined ? undefined : edge.v1 * k,
      vr: edge.vr * k,
      v2: edge.v2 * k,
    }
  }
  const { i, t } = locate(
    sorted.map((p) => p.weightKg),
    weightKg,
  )
  const a = sorted[i] ?? first
  const b = sorted[i + 1] ?? a
  return {
    v1: a.v1 === undefined || b.v1 === undefined ? undefined : lerp(a.v1, b.v1, t),
    vr: lerp(a.vr, b.vr, t),
    v2: lerp(a.v2, b.v2, t),
  }
}

function applyAdjustments(
  speeds: TakeoffSpeeds,
  adj: SpeedAdjustments,
  oatC: number,
  altitudeFt: number,
): TakeoffSpeeds {
  const at = (table: SpeedAdjustments['v1']) =>
    lookup2d(table, adj.tempsC, adj.altitudesFt, oatC, altitudeFt)
  return {
    v1: speeds.v1 === undefined ? undefined : speeds.v1 + at(adj.v1),
    vr: speeds.vr + at(adj.vr),
    v2: speeds.v2 + at(adj.v2),
  }
}

function fromGrid(model: GridModel, c: TakeoffConditions): TakeoffSpeeds {
  const band = model.bands.find((b) => c.oatC <= b.maxOatC) ?? model.bands[model.bands.length - 1]
  if (!band) return { vr: 0, v2: 0 }
  const minW = model.weightsKg[0] ?? 0
  const maxW = model.weightsKg[model.weightsKg.length - 1] ?? 0
  const w = clamp(c.weightKg, minW, maxW)
  const k = Math.sqrt(c.weightKg / w)
  const pick = (j: 0 | 1) =>
    lookup2d(
      band.rows.map((row) => row.map((pair) => pair[j])),
      model.weightsKg,
      model.altitudesFt,
      w,
      c.pressureAltitudeFt,
    )
  const vr = pick(0) * k
  return { v1: vr, vr, v2: pick(1) * k }
}

/**
 * V1 / VR / V2 for a flap setting, rounded to whole knots. Applies, in order: the table,
 * OAT / pressure-altitude adjustments, minimum speeds, the wet-runway V1 reduction, then
 * V1 ≤ VR ≤ V2.
 */
export function takeoffSpeeds(
  profile: AircraftProfile,
  flap: FlapSetting,
  c: TakeoffConditions,
): TakeoffSpeeds {
  const model = flap.speeds
  let s = model.kind === 'grid' ? fromGrid(model, c) : fromWeightTable(model.points, c.weightKg)
  if (model.kind === 'weight-table' && model.adjustments) {
    s = applyAdjustments(s, model.adjustments, c.oatC, c.pressureAltitudeFt)
  }

  let vr = Math.max(s.vr, flap.minVr ?? 0)
  let v1 = s.v1 === undefined ? undefined : Math.max(s.v1, flap.minV1 ?? 0)
  if (v1 !== undefined && c.wetRunway && profile.wetV1ReductionKt) {
    v1 = Math.max(v1 - profile.wetV1ReductionKt, flap.minV1 ?? 0)
  }
  vr = Math.round(vr)
  const v2 = Math.max(Math.round(Math.max(s.v2, flap.minV2 ?? 0)), vr)
  return { v1: v1 === undefined ? undefined : Math.min(Math.round(v1), vr), vr, v2 }
}

/**
 * Estimated takeoff runway needed (m): the flap's field length at MTOW / sea level / ISA,
 * scaled by (W / MTOW)² and by 1 / σ^1.5 for density altitude. A planning estimate for
 * choosing flaps, not a performance calculation.
 */
export function requiredRunwayM(
  profile: AircraftProfile,
  flap: FlapSetting,
  c: TakeoffConditions,
): number {
  const weightFactor = (c.weightKg / profile.maxTakeoffWeightKg) ** 2
  const sigma = clamp(densityRatio(c.pressureAltitudeFt, c.oatC), 0.4, 1.3)
  return flap.fieldLengthM * weightFactor * sigma ** -1.5
}

/**
 * The flap setting to use: the profile's usual one, or the next setting with more flap
 * when the runway is too short for it. With no runway length set, the usual one.
 */
export function recommendFlap(
  profile: AircraftProfile,
  c: TakeoffConditions,
): { flap: FlapSetting; fits: boolean } {
  const start = Math.max(
    0,
    profile.flaps.findIndex((f) => f.id === profile.defaultFlapId),
  )
  const fallback = profile.flaps[start] ?? (profile.flaps[0] as FlapSetting)
  if (c.runwayLengthM <= 0) return { flap: fallback, fits: true }
  for (const flap of profile.flaps.slice(start)) {
    if (requiredRunwayM(profile, flap, c) <= c.runwayLengthM) return { flap, fits: true }
  }
  return { flap: profile.flaps[profile.flaps.length - 1] ?? fallback, fits: false }
}

/** Takeoff trim in the profile's unit, rounded to its step; undefined for advice-only. */
export function takeoffTrim(
  profile: AircraftProfile,
  flap: FlapSetting,
  c: TakeoffConditions,
): number | undefined {
  const { trim } = profile
  if (trim.kind !== 'computed') return undefined
  const raw = trim.compute(c.cgPercentMac, c.weightKg, flap.id)
  return Math.round(raw / trim.step) * trim.step
}

/** Weights outside this share of MTOW can't be this aircraft: no speeds are given. */
export const PLAUSIBLE_WEIGHT_SHARE = [0.4, 1.2] as const

/** False for a weight far outside the aircraft's range (wrong aircraft or wrong weight). */
export function isPlausibleWeight(profile: AircraftProfile, weightKg: number): boolean {
  const share = weightKg / profile.maxTakeoffWeightKg
  return share >= PLAUSIBLE_WEIGHT_SHARE[0] && share <= PLAUSIBLE_WEIGHT_SHARE[1]
}

/**
 * The full answer, always for the recommended flap setting: SimTools recommends, the pilot
 * sets (the flap lever badge shows whether the lever matches).
 */
export function planTakeoff(profile: AircraftProfile, c: TakeoffConditions): TakeoffResult {
  const chosen = recommendFlap(profile, c).flap
  const required = requiredRunwayM(profile, chosen, c)

  const warnings: TakeoffWarning[] = []
  if (!isPlausibleWeight(profile, c.weightKg)) warnings.push('weight-implausible')
  if (c.weightKg > profile.maxTakeoffWeightKg + 1) warnings.push('over-mtow')
  if (c.runwayLengthM > 0 && required > c.runwayLengthM) warnings.push('runway-short')

  return {
    speeds: takeoffSpeeds(profile, chosen, c),
    flap: chosen,
    requiredRunwayM: required,
    trim: takeoffTrim(profile, chosen, c),
    warnings,
  }
}

/** Flap deflection (°) for the side view: `angleDeg`, else the number in the label. */
export function flapAngleDeg(flap: FlapSetting): number {
  if (flap.angleDeg !== undefined) return flap.angleDeg
  const n = Number.parseFloat(flap.label)
  return Number.isFinite(n) ? n : 0
}

/** Speed points from a table written in pounds (as in US handbooks). */
export function pointsFromPounds(
  rows: readonly { weightLb: number; v1?: number; vr: number; v2: number }[],
): SpeedPoint[] {
  return rows.map(({ weightLb, ...speeds }) => ({ weightKg: weightLb / LB_PER_KG, ...speeds }))
}
