// Which takeoff warnings to show, and how serious each is.
import type { TakeoffWarning } from './types'

/** `danger`: the takeoff doesn't work as planned. `warning`: allowed, but worth a look. */
export type WarningSeverity = 'danger' | 'warning'

export const WARNING_SEVERITY: Record<TakeoffWarning, WarningSeverity> = {
  'weight-implausible': 'danger',
  'over-mtow': 'danger',
  'runway-short': 'danger',
}

/**
 * The warnings to show, most serious first. A weight that can't be this aircraft makes
 * every other warning noise, so it is then the only one.
 */
export function shownWarnings(warnings: readonly TakeoffWarning[]): TakeoffWarning[] {
  if (warnings.includes('weight-implausible')) return ['weight-implausible']
  const rank = (w: TakeoffWarning) => (WARNING_SEVERITY[w] === 'danger' ? 0 : 1)
  return [...warnings].sort((a, b) => rank(a) - rank(b))
}
