import { LB_PER_KG } from './takeoffMath'

// What the Planning page persists: the runway length and condition, and the takeoff
// conditions. Those are filled from the sim with a tap (read once, never polled) and stay
// editable. Weight and CG belong to the aircraft, so each aircraft keeps its own;
// temperature and pressure altitude belong to the airport, so they're shared.

/** An aircraft's own takeoff conditions. */
export interface AircraftLoad {
  /** Takeoff weight (kg). 0 = not set: the aircraft's max takeoff weight is assumed. */
  weightKg: number
  cgPercentMac: number
}

export const DEFAULT_AIRCRAFT_LOAD: AircraftLoad = { weightKg: 0, cgPercentMac: 20 }

export interface TakeoffSetup {
  /** Show weights in kg or lb. 'auto' follows the aircraft's own documents. */
  weightUnit: 'auto' | 'kg' | 'lb'
  /** Takeoff runway available (m). 0 = not set. */
  runwayLengthM: number
  wetRunway: boolean
  /** Weight and CG per aircraft id. */
  loads: Record<string, AircraftLoad>
  oatC: number
  pressureAltitudeFt: number
}

export const DEFAULT_TAKEOFF_SETUP: TakeoffSetup = {
  weightUnit: 'auto',
  runwayLengthM: 0,
  wetRunway: false,
  loads: {},
  oatC: 15,
  pressureAltitudeFt: 0,
}

/** The takeoff conditions that can be filled from the sim. */
export type ConditionField = 'weightKg' | 'cgPercentMac' | 'oatC' | 'pressureAltitudeFt'

/**
 * A value filled from the sim, rounded to what's worth showing (and stepping from): weight
 * to 10 in the unit shown, CG to 0.1 %, OAT to 1 °C, pressure altitude to 10 ft.
 */
export function roundConditionFill(
  field: ConditionField,
  value: number,
  weightUnit: 'kg' | 'lb',
): number {
  switch (field) {
    case 'weightKg': {
      const perKg = weightUnit === 'lb' ? LB_PER_KG : 1
      return (Math.round((value * perKg) / 10) * 10) / perKg
    }
    case 'cgPercentMac':
      return Math.round(value * 10) / 10
    case 'oatC':
      return Math.round(value)
    case 'pressureAltitudeFt':
      return Math.round(value / 10) * 10
  }
}

/**
 * The four conditions for an aircraft, as set (weight 0 = not set yet: the caller decides
 * what to assume).
 */
export function conditionValues(
  setup: TakeoffSetup,
  aircraftId: string,
): Record<ConditionField, number> {
  const load = { ...DEFAULT_AIRCRAFT_LOAD, ...setup.loads[aircraftId] }
  return {
    weightKg: load.weightKg,
    cgPercentMac: load.cgPercentMac,
    oatC: setup.oatC,
    pressureAltitudeFt: setup.pressureAltitudeFt,
  }
}

/** Sets one condition: weight and CG for this aircraft only, the others for all. */
export function withCondition(
  setup: TakeoffSetup,
  aircraftId: string,
  field: ConditionField,
  value: number,
): TakeoffSetup {
  if (field === 'oatC' || field === 'pressureAltitudeFt') return { ...setup, [field]: value }
  const load = { ...DEFAULT_AIRCRAFT_LOAD, ...setup.loads[aircraftId], [field]: value }
  return { ...setup, loads: { ...setup.loads, [aircraftId]: load } }
}
