// The vertical speed that holds the aircraft's climb speed, from its energy right now: if it
// is accelerating it has power to spare for climbing, if it is slowing it climbs too steeply.
// Uses the real power, weight and temperature, so it needs no performance tables.

/** What the Flight plan shows in the climb. */
export interface ClimbTarget {
  speedKias: number
  /** Undefined until the speed is steady enough to tell, or far from the climb speed. */
  rateFpm: number | undefined
}

export interface ClimbSample {
  timeSec: number
  tasKt: number
  iasKt: number
  verticalSpeedFpm: number
  altitudeFt: number
}

/**
 * The acceleration is averaged over this many samples (8 s at 1 Hz), so turbulence doesn't
 * make the value jump. Counted, not timed: at a higher sim rate the samples are further apart.
 */
const MAX_SAMPLES = 9
const MIN_SPAN_SEC = 3
const MIN_SAMPLES = 4
/** A longer gap between samples (slew, teleport, panel reopened) starts over; 16× sim rate fits. */
const MAX_GAP_SEC = 30
/** Further than this from the climb speed the estimate means little. */
export const MAX_SPEED_ERROR_KT = 30
/** Time to bring the speed back to the target, and the most acceleration asked for it. */
const SPEED_CAPTURE_SEC = 20
const MAX_CAPTURE_KT_PER_SEC = 0.5

/** fpm of climb worth 1 kt of TAS × 1 kt/s of acceleration: (1.688 ft/s per kt)² × 60 / g. */
const FPM_PER_KT2_PER_SEC = 5.31
const SEA_LEVEL_SOUND_KT = 661.47

/** The recent samples with a new one added; the same sim time (paused) changes nothing. */
export function addClimbSample(
  samples: readonly ClimbSample[],
  sample: ClimbSample,
): readonly ClimbSample[] {
  const last = samples[samples.length - 1]
  if (last?.timeSec === sample.timeSec) return samples
  if (!last || sample.timeSec < last.timeSec || sample.timeSec - last.timeSec > MAX_GAP_SEC) {
    return [sample]
  }
  return [...samples, sample].slice(-MAX_SAMPLES)
}

const mean = (values: readonly number[]) => values.reduce((sum, v) => sum + v, 0) / values.length

/** Slope of TAS over time (least squares), in kt per second. */
function accelerationKtPerSec(samples: readonly ClimbSample[]) {
  const meanTime = mean(samples.map((s) => s.timeSec))
  const meanTas = mean(samples.map((s) => s.tasKt))
  const covariance = samples.reduce(
    (sum, s) => sum + (s.timeSec - meanTime) * (s.tasKt - meanTas),
    0,
  )
  const variance = samples.reduce((sum, s) => sum + (s.timeSec - meanTime) ** 2, 0)
  return variance > 0 ? covariance / variance : 0
}

/**
 * V/S (fpm, to the nearest 50) that holds `targetKias` with the present power, easing back
 * to it when off. Undefined without enough samples or too far from the target.
 */
export function climbRateToHold(samples: readonly ClimbSample[], targetKias: number) {
  const first = samples[0]
  const last = samples[samples.length - 1]
  if (!first || !last || samples.length < MIN_SAMPLES) return undefined
  if (last.timeSec - first.timeSec < MIN_SPAN_SEC) return undefined

  const iasKt = mean(samples.map((s) => s.iasKt))
  const tasKt = mean(samples.map((s) => s.tasKt))
  const speedError = targetKias - iasKt
  if (iasKt <= 0 || tasKt <= 0 || Math.abs(speedError) > MAX_SPEED_ERROR_KT) return undefined

  const captureIas = Math.max(
    -MAX_CAPTURE_KT_PER_SEC,
    Math.min(MAX_CAPTURE_KT_PER_SEC, speedError / SPEED_CAPTURE_SEC),
  )
  const captureTas = captureIas * (tasKt / iasKt)
  const spareAcceleration = accelerationKtPerSec(samples) - captureTas
  const energyRate =
    mean(samples.map((s) => s.verticalSpeedFpm)) + FPM_PER_KT2_PER_SEC * tasKt * spareAcceleration

  // Holding an indicated speed, TAS rises with height: that takes a little of the energy.
  const theta = Math.max(0.75, 1 - 6.875_59e-6 * mean(samples.map((s) => s.altitudeFt)))
  const mach = tasKt / (SEA_LEVEL_SOUND_KT * Math.sqrt(theta))
  const rate = energyRate / (1 + 0.57 * mach * mach)
  return Math.max(0, Math.round(rate / 50) * 50)
}
