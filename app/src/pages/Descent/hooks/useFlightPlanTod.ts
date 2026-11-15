import {
  DEFAULT_DESCENT_SETUP,
  type DescentInputs,
  type DescentSetup,
  descentStatus,
  distanceFromEte,
  planDescent,
  profileFromSetup,
} from '~/pages/Descent/domain'
import { useSimVars } from '~/sim'
import { usePersistentState } from '~/storage'
import { DESCENT_SIM_VARS } from './descentSimVars'

/**
 * State behind the flight-plan TOD tab: the persisted setup (target altitude, profile,
 * buffer), live sim values and the plan. The distance is what is left on the active flight
 * plan (time to destination × groundspeed); without one there is no plan.
 */
export function useFlightPlanTod() {
  const [setup, setSetup] = usePersistentState('descent.v2', DEFAULT_DESCENT_SETUP)
  // Whether the Options section is expanded — remembered like the open page.
  const [optionsOpen, setOptionsOpen] = usePersistentState('descent.optionsOpen.v1', false, {
    debounceMs: 0,
  })
  const sim = useSimVars(DESCENT_SIM_VARS)
  const update = (patch: Partial<DescentSetup>) => setSetup((prev) => ({ ...prev, ...patch }))

  const groundSpeedKt = sim.groundSpeed ?? setup.manualGroundSpeedKt
  const flightPlanNm =
    sim.destinationEte !== undefined && sim.destinationEte > 0
      ? distanceFromEte(sim.destinationEte, groundSpeedKt)
      : undefined

  const inputs: DescentInputs = {
    currentAltitudeFt: sim.altitude ?? setup.manualAltitudeFt,
    targetAltitudeFt: setup.targetAltitudeFt,
    groundSpeedKt,
    distanceToTargetNm: flightPlanNm ?? 0,
    bufferNm: setup.bufferNm,
    profile: profileFromSetup(setup),
  }
  const plan = planDescent(inputs)

  return {
    setup,
    update,
    optionsOpen,
    setOptionsOpen,
    inputs,
    plan,
    flightPlanNm,
    status: flightPlanNm === undefined ? 'no-data' : descentStatus(plan, inputs.groundSpeedKt),
    live: {
      altitude: sim.altitude,
      groundSpeed: sim.groundSpeed,
      verticalSpeed: sim.verticalSpeed,
    },
  }
}
