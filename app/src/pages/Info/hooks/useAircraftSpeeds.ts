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

  const speeds: AircraftSpeeds | undefined = perf && {
    climb: perf.climb && {
      kias: perf.climb.speedKias,
      schedule: perf.climb.schedule,
      power: perf.climb.power,
    },
    cruiseKtas: perf.cruise?.speedKtas,
    descent: perf.descent && {
      kias: perf.descent.speedKias,
      fpm: perf.descent.rateFpm,
      schedule: perf.descent.schedule,
    },
    approach:
      perf.approach && approachKias !== undefined
        ? {
            kias: approachKias,
            // Scaled from the live weight: say which weight it's for.
            weightLb: approachKias !== perf.approach.speedKias ? sim.weightLb : undefined,
            flaps: perf.approach.flaps,
          }
        : undefined,
  }

  return { aircraft, title, speeds }
}
