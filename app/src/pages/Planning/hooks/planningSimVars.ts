/** The sim values the Planning page reads. Each can be undefined: there is a manual value. */
export const PLANNING_SIM_VARS = {
  weightLb: { name: 'TOTAL WEIGHT', unit: 'pounds' },
  /** Longitudinal CG as % of the reference chord (MAC). */
  cgPercent: { name: 'CG PERCENT', unit: 'percent' },
  oatC: { name: 'AMBIENT TEMPERATURE', unit: 'celsius' },
  pressureAltitudeFt: { name: 'PRESSURE ALTITUDE', unit: 'feet' },
  flapHandleIndex: { name: 'FLAPS HANDLE INDEX', unit: 'number' },
  /** Lined up on the runway, this gives the runway number. */
  headingMagDeg: { name: 'PLANE HEADING DEGREES MAGNETIC', unit: 'degrees' },
}
