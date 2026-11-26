// Climb, cruise, descent and approach figures for an aircraft, and the few sums the pages
// need from them. Pure and unit-tested. The figures come from the aircraft's own manual
// (Standard Day, ISA) or other cited sources: see the comments in catalogue.ts. Every part
// is optional: an aircraft gets only what has a source, and pages show what's there.

/** One row of a climb or descent table: from / to sea level, at the table's speed. */
export interface ClimbRow {
  altitudeFt: number
  timeMin: number
  distanceNm: number
}

/** Climb power: torque by altitude, at a set prop RPM, within an ITT limit. */
export interface ClimbPower {
  /** How the torque gauge reads: foot-pounds (Caravan) or percent (TBM). */
  torqueUnit: 'ft-lb' | '%'
  /** Torque to set at each altitude (ascending): it falls as the ITT limit is reached. */
  torque: readonly { altitudeFt: number; torque: number }[]
  propRpm: number
  /** Maximum ITT (°C) in the climb; omitted when the engine control (FADEC) manages it. */
  ittLimitC?: number
}

/** A climb or descent speed that changes with altitude: each applies up to `upToFt`. */
export interface SpeedStep {
  upToFt: number
  speedKias: number
}

export interface AircraftPerformance {
  climb?: {
    /** Climb speed (KIAS) low down; the one the table is flown at. */
    speedKias: number
    /** When the speed changes on the way up (ascending). */
    schedule?: readonly SpeedStep[]
    power?: ClimbPower
    /** Time and distance to climb from sea level, ascending by altitude. */
    table?: readonly ClimbRow[]
  }
  cruise?: {
    /** Typical true airspeed at normal cruise power (KTAS). */
    speedKtas: number
  }
  descent?: {
    /** Descent speed (KIAS); the one shown when there is a schedule. */
    speedKias: number
    /** When the speed changes with altitude (ascending). */
    schedule?: readonly SpeedStep[]
    rateFpm?: number
    /** Time and distance to descend to sea level, ascending by altitude. */
    table?: readonly ClimbRow[]
    /**
     * The speed to be at by the start of the approach (its first fix), when the aircraft's
     * descent speed is too fast for it (e.g. above its gear / approach-flap limit).
     */
    approachStartKias?: number
  }
  approach?: {
    /** Final approach speed (KIAS), landing flaps, at `atWeightKg`. */
    speedKias: number
    /** The weight the speed is for (usually the maximum landing weight). */
    atWeightKg: number
    /** The landing flap setting the speed is for, when it isn't simply full flaps. */
    flaps?: string
  }
}

/** The table's distance (and time) at an altitude: interpolated, scaled beyond its ends. */
function rowAt(table: readonly ClimbRow[] | undefined, altitudeFt: number): ClimbRow | undefined {
  if (!table) return undefined
  const first = table[0]
  const last = table[table.length - 1]
  if (!first || !last || altitudeFt <= 0) return undefined
  // Outside the table: same gradient (and rate) as the nearest end.
  const edge = altitudeFt <= first.altitudeFt ? first : altitudeFt >= last.altitudeFt ? last : null
  if (edge) {
    const k = altitudeFt / edge.altitudeFt
    return { altitudeFt, timeMin: edge.timeMin * k, distanceNm: edge.distanceNm * k }
  }
  const i = table.findIndex((r) => r.altitudeFt >= altitudeFt)
  const a = table[i - 1] as ClimbRow
  const b = table[i] as ClimbRow
  const t = (altitudeFt - a.altitudeFt) / (b.altitudeFt - a.altitudeFt)
  return {
    altitudeFt,
    timeMin: a.timeMin + t * (b.timeMin - a.timeMin),
    distanceNm: a.distanceNm + t * (b.distanceNm - a.distanceNm),
  }
}

/** Average climb gradient (ft per nm, still air) from sea level up to `altitudeFt`. */
export function climbGradientFtPerNm(perf: AircraftPerformance, altitudeFt: number) {
  const row = rowAt(perf.climb?.table, altitudeFt)
  return row && row.distanceNm > 0 ? altitudeFt / row.distanceNm : undefined
}

/** Average climb rate (fpm) from sea level up to `altitudeFt`. */
export function climbRateFpm(perf: AircraftPerformance, altitudeFt: number) {
  const row = rowAt(perf.climb?.table, altitudeFt)
  return row && row.timeMin > 0 ? altitudeFt / row.timeMin : undefined
}

/** The recommended climb speed (KIAS) at an altitude; undefined without a climb speed. */
export function climbSpeedKias(perf: AircraftPerformance, altitudeFt: number) {
  return perf.climb && speedAt(perf.climb, altitudeFt)
}

/** The recommended descent speed (KIAS) at an altitude; undefined without a descent speed. */
export function descentSpeedKias(perf: AircraftPerformance, altitudeFt: number) {
  return perf.descent && speedAt(perf.descent, altitudeFt)
}

/** A phase's speed at an altitude: its schedule's step, or its one speed. */
function speedAt(
  phase: { speedKias: number; schedule?: readonly SpeedStep[] },
  altitudeFt: number,
) {
  const schedule = phase.schedule ?? []
  const step = schedule.find((s) => altitudeFt <= s.upToFt) ?? schedule[schedule.length - 1]
  return step?.speedKias ?? phase.speedKias
}

/**
 * True airspeed (kt) for an indicated (calibrated) airspeed at a pressure altitude, in the
 * standard atmosphere, compressibility included.
 */
export function trueAirspeedKt(casKt: number, altitudeFt: number): number {
  const SEA_LEVEL_SOUND_KT = 661.47
  const theta = 1 - 6.875_59e-6 * altitudeFt // T / T0 (troposphere)
  const delta = theta ** 5.255_88 // p / p0
  const impact = (1 + 0.2 * (casKt / SEA_LEVEL_SOUND_KT) ** 2) ** 3.5 - 1 // qc / p0
  const mach = Math.sqrt(5 * ((impact / delta + 1) ** (2 / 7) - 1))
  return mach * SEA_LEVEL_SOUND_KT * Math.sqrt(theta)
}

/**
 * Average descent gradient (ft per nm, still air) from `altitudeFt` down to `toAltitudeFt`
 * (default sea level): from the descent table, or else from the descent speed and vertical
 * speed (at the true airspeed halfway down). Undefined without either.
 */
export function descentGradientFtPerNm(
  perf: AircraftPerformance,
  altitudeFt: number,
  toAltitudeFt = 0,
) {
  const toFt = toAltitudeFt > 0 && toAltitudeFt < altitudeFt ? toAltitudeFt : 0
  const row = rowAt(perf.descent?.table, altitudeFt)
  if (row) {
    const distanceNm = row.distanceNm - (rowAt(perf.descent?.table, toFt)?.distanceNm ?? 0)
    return distanceNm > 0 ? (altitudeFt - toFt) / distanceNm : undefined
  }
  const descent = perf.descent
  if (!descent?.rateFpm || altitudeFt <= 0) return undefined
  const midFt = (altitudeFt + toFt) / 2
  const tasKt = trueAirspeedKt(speedAt(descent, midFt), midFt)
  return descent.rateFpm / (tasKt / 60)
}

/** Weights outside this share of the reference weight can't be right: no scaling then. */
const PLAUSIBLE_SHARE = [0.4, 1.2] as const

/**
 * Final approach speed at a weight: the speed scales with √(weight), as stall speed does.
 * Without a plausible weight, the reference speed (at max landing weight: the safe side).
 * Undefined when the aircraft has no approach speed.
 */
export function approachSpeedKias(perf: AircraftPerformance, weightKg: number | undefined) {
  if (!perf.approach) return undefined
  const { speedKias, atWeightKg } = perf.approach
  if (weightKg === undefined) return speedKias
  const share = weightKg / atWeightKg
  if (share < PLAUSIBLE_SHARE[0] || share > PLAUSIBLE_SHARE[1]) return speedKias
  return Math.round(speedKias * Math.sqrt(share))
}
