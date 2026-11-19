import type { ConditionField } from '~/pages/Planning/domain'
import type { SimVarSpec } from '~/sim'

/**
 * The sim values the Planning page shows live (1 Hz): the flap lever, for the "Lever set"
 * badge, and the heading, for the runway number. Each can be undefined.
 */
export const PLANNING_SIM_VARS = {
  flapHandleIndex: { name: 'FLAPS HANDLE INDEX', unit: 'number' },
  /** Lined up on the runway, this gives the runway number. */
  headingMagDeg: { name: 'PLANE HEADING DEGREES MAGNETIC', unit: 'degrees' },
}

/** What the conditions' "fill from the sim" buttons read: once, on tap. */
export const CONDITION_FILL_VARS: Record<ConditionField, SimVarSpec> = {
  /** Read in pounds (as the sim's weight variables are usually read), converted on fill. */
  weightKg: { name: 'TOTAL WEIGHT', unit: 'pounds' },
  /** Longitudinal CG as % of the reference chord (MAC). */
  cgPercentMac: { name: 'CG PERCENT', unit: 'percent' },
  oatC: { name: 'AMBIENT TEMPERATURE', unit: 'celsius' },
  pressureAltitudeFt: { name: 'PRESSURE ALTITUDE', unit: 'feet' },
}
