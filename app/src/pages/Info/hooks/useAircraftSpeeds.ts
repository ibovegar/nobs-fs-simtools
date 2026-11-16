import { approachSpeedKias, useSimAircraft } from '~/aircraft'
import type { AircraftSpeeds } from '~/pages/Info/domain'
import { useSimVars } from '~/sim'

const WEIGHT_SIM_VARS = {
  weightLb: { name: 'TOTAL WEIGHT', unit: 'pounds' },
}

const LB_PER_KG = 2.204_622_6

/**
 * The aircraft loaded in the sim and, when SimTools has its figures, the speeds to fly:
 * climb, cruise, descent and approach. The approach speed follows the live weight (1 Hz:
 * weight changes slowly).
 */
export function useAircraftSpeeds() {
  const { aircraft, title } = useSimAircraft()
  const sim = useSimVars(WEIGHT_SIM_VARS, 1)
  const perf = aircraft?.performance

  const weightKg = sim.weightLb === undefined ? undefined : sim.weightLb / LB_PER_KG
  const approachKias = perf ? approachSpeedKias(perf, weightKg) : undefined
  const scaled = perf !== undefined && approachKias !== perf.approach.speedKias

  const speeds: AircraftSpeeds | undefined =
    perf && approachKias !== undefined
      ? {
          climbKias: perf.climb.speedKias,
          cruiseKtas: perf.cruise.speedKtas,
          descentKias: perf.descent.speedKias,
          descentFpm: perf.descent.rateFpm,
          approachKias,
          approachWeightLb: scaled ? sim.weightLb : undefined,
        }
      : undefined

  return { aircraft, title, speeds }
}
