import {
  AIRCRAFT_PROFILES,
  type AircraftProfile,
  DEFAULT_TAKEOFF_SETUP,
  detectProfile,
  LB_PER_KG,
  planTakeoff,
  runwayMarks,
  runwayNumberFromHeading,
  type TakeoffConditions,
  type TakeoffSetup,
} from '~/pages/Takeoff/domain'
import { useSimText, useSimVars } from '~/sim'
import { usePersistentState } from '~/storage'
import { TAKEOFF_SIM_TEXT, TAKEOFF_SIM_VARS } from './takeoffSimVars'

const FALLBACK_PROFILE = AIRCRAFT_PROFILES[0] as AircraftProfile

/**
 * All state behind the Takeoff page: the persisted setup, the aircraft (picked, or
 * recognised from the sim), live sim values with manual fallbacks, and the computed plan.
 * The maths and aircraft data live in the page's domain/.
 */
export function useTakeoff() {
  const [stored, setSetup] = usePersistentState('takeoff.v1', DEFAULT_TAKEOFF_SETUP)
  const setup: TakeoffSetup = { ...DEFAULT_TAKEOFF_SETUP, ...stored }
  const update = (patch: Partial<TakeoffSetup>) =>
    setSetup((prev) => ({ ...DEFAULT_TAKEOFF_SETUP, ...prev, ...patch }))

  // 1 Hz: these are planning values (weight, CG, temperature…), not live needles, so a
  // slower poll saves a full recompute of the page on every small drift.
  const sim = useSimVars(TAKEOFF_SIM_VARS, 1)
  const text = useSimText(TAKEOFF_SIM_TEXT)

  const detected = detectProfile(AIRCRAFT_PROFILES, text.title, text.atcModel)
  const chosen = AIRCRAFT_PROFILES.find((p) => p.id === setup.aircraftId)
  const profile = chosen ?? detected ?? FALLBACK_PROFILE

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

  const plan = planTakeoff(profile, setup.flapId, conditions)
  // The flap detent the lever is in, when the sim reports it and the profile maps it.
  const leverFlap = profile.flaps.find(
    (f) => f.handleIndex !== undefined && f.handleIndex === sim.flapHandleIndex,
  )

  // The runway number: set by hand, or from the magnetic heading (exact once lined up).
  const headingRunway =
    sim.headingMagDeg === undefined ? undefined : runwayNumberFromHeading(sim.headingMagDeg)
  const runway = {
    number: setup.runwayNumber > 0 ? setup.runwayNumber : headingRunway,
    side: setup.runwaySide,
    fromHeading: setup.runwayNumber === 0 && headingRunway !== undefined,
    headingNumber: headingRunway,
    marks: runwayMarks(plan.speeds, plan, setup.runwayLengthM),
  }

  return {
    setup,
    update,
    profiles: AIRCRAFT_PROFILES,
    profile,
    /** The profile recognised from the sim's aircraft, if any. */
    detected,
    /** The sim's aircraft title, to show what was (not) recognised. */
    simAircraftTitle: text.title,
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
