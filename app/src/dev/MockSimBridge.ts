import type { SimBridge, SimVarSpec } from '~/sim'

/**
 * In-memory stand-in for the sim, driven by the dev harness (and usable in tests).
 * Values are stored by variable name in whatever unit the app asks for. Lives in dev/
 * because nothing in the shipped bundle uses it.
 */
export class MockSimBridge implements SimBridge {
  readonly source = 'mock' as const
  private readonly values = new Map<string, number>()

  read(spec: SimVarSpec): number | undefined {
    return this.values.get(spec.name)
  }

  set(name: string, value: number | undefined): void {
    if (value === undefined) this.values.delete(name)
    else this.values.set(name, value)
  }
}
