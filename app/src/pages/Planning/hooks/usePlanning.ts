import {
  type AircraftProfile,
  DEFAULT_TAKEOFF_SETUP,
  LB_PER_KG,
  planTakeoff,
  runwayMarks,
  runwayNumberFromHeading,
  type TakeoffConditions,
  type TakeoffSetup,
} from '~/pages/Planning/domain'
import { useSimVars } from '~/sim'
import { usePersistentState } from '~/storage'
import { PLANNING_SIM_VARS } from './planningSimVars'

/**
 * All state behind the takeoff plan for `profile` (the aircraft recognised in the sim, see
 * ~/aircraft): the persisted setup, live sim values with manual fallbacks, and the
 * computed plan. The maths and aircraft data live in the page's domain/.
 */
export function usePlanning(profile: AircraftProfile) {
  const [stored, setSetup] = usePersistentState('takeoff.v1', DEFAULT_TAKEOFF_SETUP)
  // Navigation state: saved at once, so reopening SimTools shows the notes as left.
  const [notesOpen, setNotesOpen] = usePersistentState('planning.notesOpen.v1', false, {
    debounceMs: 0,
  })
  const setup: TakeoffSetup = { ...DEFAULT_TAKEOFF_SETUP, ...stored }
  const update = (patch: Partial<TakeoffSetup>) =>
    setSetup((prev) => ({ ...DEFAULT_TAKEOFF_SETUP, ...prev, ...patch }))

  // 1 Hz: these are planning values (weight, CG, temperature…), not live needles, so a
  // slower poll saves a full recompute of the page on every small drift.
  const sim = useSimVars(PLANNING_SIM_VARS, 1)

  const live = {
    weightKg: sim.weightLb === undefined ? undefined : sim.weightLb / LB_PER_KG,
    cgPercentMac: sim.cgPercent,
    oatC: sim.oatC,
    pressureAltitudeFt: sim.pressureAltitudeFt,
  }

  const conditions: TakeoffConditions = {
    weightKg: live.weightKg ?? setup.manualWeightKg,
    cgPercentMac: live.cgPercentMac ?? setup.manualCgPercentMac,
    oatC: live.oatC ?? setup.manualOatC,
    pressureAltitudeFt: live.pressureAltitudeFt ?? setup.manualPressureAltitudeFt,
    runwayLengthM: setup.runwayLengthM,
    // Only aircraft with wet-runway data get the correction.
    wetRunway: setup.wetRunway && profile.wetV1ReductionKt !== undefined,
  }

  const plan = planTakeoff(profile, conditions)
  // The flap detent the lever is in, when the sim reports it and the profile maps it.
  const leverFlap = profile.flaps.find(
    (f) => f.handleIndex !== undefined && f.handleIndex === sim.flapHandleIndex,
  )

  // The runway number for the picture, from the magnetic heading (exact once lined up).
  const runway = {
    number:
      sim.headingMagDeg === undefined ? undefined : runwayNumberFromHeading(sim.headingMagDeg),
    marks: runwayMarks(plan.speeds, plan, setup.runwayLengthM),
  }

  return {
    setup,
    update,
    /** The Notes section is open (collapsed by default). */
    notesOpen,
    setNotesOpen,
    weightUnit: setup.weightUnit === 'auto' ? profile.weightUnit : setup.weightUnit,
    conditions,
    live,
    plan,
    /** Undefined when the sim doesn't report the lever or it's between takeoff detents. */
    leverFlap,
    leverKnown: sim.flapHandleIndex !== undefined,
    runway,
  }
}
