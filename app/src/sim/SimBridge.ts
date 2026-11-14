/** A simulation variable to read, e.g. `{ name: 'GROUND VELOCITY', unit: 'knots' }`. */
export interface SimVarSpec {
  name: string
  unit: string
}

export type SimSource = 'sim' | 'mock' | 'offline'

/**
 * The app's only door to the simulator. Components never call the sim API directly,
 * which lets the same UI run against the real sim, the dev-harness mock, or nothing.
 */
export interface SimBridge {
  readonly source: SimSource
  /** Read one numeric variable synchronously. `undefined` when it isn't available. */
  read(spec: SimVarSpec): number | undefined
  /**
   * Read one text variable (e.g. `TITLE`, `ATC MODEL`) synchronously. `undefined` when it
   * isn't available or is empty.
   */
  readText(name: string): string | undefined
}
