// Which fix the descent from cruise is planned to (the TOD's reference). By default the
// first approach fix with a charted altitude (the IAF / IF, as a pilot plans 3:1 to it);
// the pilot can pick another fix in the waypoint list. Without one, the runway. Pure.

import type { AltitudeConstraint, RouteWaypoint } from './route'
import type { DescentTarget } from './verticalProfile'

export type DescentReferenceSource = 'default' | 'selected' | 'runway'

export interface DescentReference {
  /** Index into the route's waypoints (the last one for the runway). */
  index: number
  source: DescentReferenceSource
  /**
   * The altitude the fix is crossed at. Undefined for the runway, and for a picked fix
   * without an altitude limit (the descent then just passes it on the way to the runway).
   */
  altitudeFt?: number
}

type ReferenceWaypoint = Pick<RouteWaypoint, 'key' | 'phase' | 'runway' | 'altitude'>

/**
 * The altitude to plan the descent to for a limit: the top of an "at or below" / "between"
 * window (the latest descent that meets it), the floor of an "at or above".
 */
export function referenceAltitudeFt(limit: AltitudeConstraint | undefined): number | undefined {
  return limit?.upperFt ?? limit?.lowerFt
}

/** Whether a fix can be the TOD reference: anything after the departure (SID) part. */
export function canBeDescentReference(
  waypoints: readonly ReferenceWaypoint[],
  index: number,
): boolean {
  const wp = waypoints[index]
  return wp !== undefined && index > 0 && wp.phase !== 'departure'
}

/** The reference fix: the picked one (by key) if it's still on the route, else the default. */
export function resolveDescentReference(
  waypoints: readonly ReferenceWaypoint[],
  selectedKey: string | undefined,
): DescentReference {
  const lastIndex = waypoints.length - 1
  if (selectedKey !== undefined) {
    const index = waypoints.findIndex(
      (wp, i) => wp.key === selectedKey && canBeDescentReference(waypoints, i),
    )
    if (index >= 0) {
      return {
        index,
        source: 'selected',
        altitudeFt:
          index === lastIndex ? undefined : referenceAltitudeFt(waypoints[index]?.altitude),
      }
    }
  }
  const index = waypoints.findIndex(
    (wp, i) =>
      i > 0 &&
      i < lastIndex &&
      wp.phase === 'approach' &&
      !wp.runway &&
      referenceAltitudeFt(wp.altitude) !== undefined,
  )
  const wp = waypoints[index]
  if (index >= 0 && wp) {
    return { index, source: 'default', altitudeFt: referenceAltitudeFt(wp.altitude) }
  }
  return { index: Math.max(0, lastIndex), source: 'runway' }
}

/** The profile input for a reference: none when it has no altitude to cross at. */
export function descentTarget(reference: DescentReference): DescentTarget | undefined {
  return reference.altitudeFt === undefined
    ? undefined
    : {
        index: reference.index,
        altitudeFt: reference.altitudeFt,
        overridesEarlierLimits: reference.source === 'selected',
      }
}
