import {
  DEFAULT_DESCENT_SETUP,
  type DescentInputs,
  type DescentSetup,
  descentStatus,
  planDescent,
  profileFromSetup,
} from '~/pages/Descent/domain'
import { useSimVars } from '~/sim'
import { usePersistentState } from '~/storage'
import { DESCENT_SIM_VARS } from './descentSimVars'
import { useManualDistanceCountdown } from './useManualDistanceCountdown'

/**
 * All state behind the TOD calculator: the persisted setup, live sim values (with manual
 * fallbacks) and the computed plan. The maths lives in the page's domain/; the views in
 * the page's components/ only render what this returns.
 */
export function useDescentPlanner() {
  const [setup, setSetup] = usePersistentState('descent.v1', DEFAULT_DESCENT_SETUP)
  // Whether the Options section is expanded — remembered like the open page.
  const [optionsOpen, setOptionsOpen] = usePersistentState('descent.optionsOpen.v1', false, {
    debounceMs: 0,
  })
  const sim = useSimVars(DESCENT_SIM_VARS)
  const update = (patch: Partial<DescentSetup>) => setSetup((prev) => ({ ...prev, ...patch }))

  const gpsAvailable = sim.gpsDistance !== undefined && sim.gpsDistance > 0
  const useGps = setup.distanceSource === 'gps' && gpsAvailable

  useManualDistanceCountdown({
    enabled: !useGps,
    groundSpeedKt: sim.groundSpeed,
    simTimeSec: sim.simTime,
    advance: (next) =>
      setSetup((prev) => ({ ...prev, manualDistanceNm: next(prev.manualDistanceNm) })),
  })

  const inputs: DescentInputs = {
    currentAltitudeFt: sim.altitude ?? setup.manualAltitudeFt,
    targetAltitudeFt: setup.targetAltitudeFt,
    groundSpeedKt: sim.groundSpeed ?? setup.manualGroundSpeedKt,
    distanceToTargetNm: useGps ? (sim.gpsDistance ?? 0) : setup.manualDistanceNm,
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
    status: descentStatus(plan, inputs.groundSpeedKt),
    live: {
      altitude: sim.altitude,
      groundSpeed: sim.groundSpeed,
      verticalSpeed: sim.verticalSpeed,
      gpsDistance: gpsAvailable ? sim.gpsDistance : undefined,
    },
  }
}
