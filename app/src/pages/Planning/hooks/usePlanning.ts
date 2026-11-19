import {
  type AircraftProfile,
  type ConditionField,
  conditionValues,
  DEFAULT_TAKEOFF_SETUP,
  LB_PER_KG,
  planTakeoff,
  roundConditionFill,
  runwayMarks,
  runwayNumberFromHeading,
  type TakeoffConditions,
  type TakeoffSetup,
  withCondition,
} from '~/pages/Planning/domain'
import { useSim } from '~/providers'
import { useSimVars } from '~/sim'
import { usePersistentState } from '~/storage'
import { CONDITION_FILL_VARS, PLANNING_SIM_VARS } from './planningSimVars'

/**
 * All state behind the takeoff plan for `profile` (the aircraft recognised in the sim, see
 * ~/aircraft): the persisted setup (runway and takeoff conditions; the conditions are filled
 * from the sim with a tap, never polled), and the computed plan. Only the flap lever and the
 * heading are read live. The maths and aircraft data live in the page's domain/.
 */
export function usePlanning(profile: AircraftProfile) {
  const [stored, setSetup] = usePersistentState('takeoff.v2', DEFAULT_TAKEOFF_SETUP)
  // Navigation state: saved at once, so reopening SimTools shows the notes as left.
  const [notesOpen, setNotesOpen] = usePersistentState('planning.notesOpen.v1', false, {
    debounceMs: 0,
  })
  const setup: TakeoffSetup = { ...DEFAULT_TAKEOFF_SETUP, ...stored }
  const update = (patch: Partial<TakeoffSetup>) =>
    setSetup((prev) => ({ ...DEFAULT_TAKEOFF_SETUP, ...prev, ...patch }))

  // 1 Hz: the lever badge and the runway number; nothing else is polled.
  const sim = useSimVars(PLANNING_SIM_VARS, 1)
  const { bridge } = useSim()
  const weightUnit = setup.weightUnit === 'auto' ? profile.weightUnit : setup.weightUnit

  // Weight and CG are this aircraft's own; temperature and pressure altitude are shared.
  const values = conditionValues(setup, profile.id)
  const setCondition = (field: ConditionField, value: number) =>
    setSetup((prev) =>
      withCondition({ ...DEFAULT_TAKEOFF_SETUP, ...prev }, profile.id, field, value),
    )

  const conditions: TakeoffConditions = {
    // Not set yet: plan for the max takeoff weight (the highest speeds).
    weightKg: values.weightKg > 0 ? values.weightKg : profile.maxTakeoffWeightKg,
    cgPercentMac: values.cgPercentMac,
    oatC: values.oatC,
    pressureAltitudeFt: values.pressureAltitudeFt,
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
    weightUnit,
    conditions,
    /** Sets one condition (weight and CG for this aircraft only). */
    setCondition,
    plan,
    /** Whether there is a sim to fill from; the value itself is read on tap. */
    canFill: bridge.source !== 'offline',
    /** Copies the sim's current value into a condition once; it stays editable. */
    fillFromSim: (field: ConditionField) => {
      const read = bridge.read(CONDITION_FILL_VARS[field])
      if (read === undefined) return
      const value = field === 'weightKg' ? read / LB_PER_KG : read
      setCondition(field, roundConditionFill(field, value, weightUnit))
    },
    /** Undefined when the sim doesn't report the lever or it's between takeoff detents. */
    leverFlap,
    leverKnown: sim.flapHandleIndex !== undefined,
    runway,
  }
}
