import type { SimBridge, SimVarSpec } from '~/sim'
import { MockNavData } from './MockNavData'

/**
 * In-memory stand-in for the sim, driven by the dev harness (and usable in tests).
 * Values are stored by variable name in whatever unit the app asks for. Lives in dev/
 * because nothing in the shipped bundle uses it.
 */
export class MockSimBridge implements SimBridge {
  readonly source = 'mock' as const
  /** The mock flight plan and navigation database (the harness picks the route). */
  readonly navData = new MockNavData()
  private readonly values = new Map<string, number>()
  private readonly texts = new Map<string, string>()

  read(spec: SimVarSpec): number | undefined {
    return this.values.get(spec.name)
  }

  readText(name: string): string | undefined {
    return this.texts.get(name)
  }

  set(name: string, value: number | undefined): void {
    if (value === undefined) this.values.delete(name)
    else this.values.set(name, value)
  }

  setText(name: string, value: string | undefined): void {
    if (value === undefined || value === '') this.texts.delete(name)
    else this.texts.set(name, value)
  }
}
