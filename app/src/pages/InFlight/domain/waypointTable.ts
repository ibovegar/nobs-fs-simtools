// The flight plan's waypoint table as ready-to-show rows: what each cell says and how the
// row looks, so the view only lays them out.
import { canBeDescentReference, type DescentReference } from './descentReference'
import { formatAltitude, formatAltitudeLimit, formatDistance, formatSpeedLimit } from './format'
import type { RoutePhase, RouteWaypoint } from './route'
import type { PlannedWaypoint, VerticalProfile } from './verticalProfile'

const PHASE_LABEL: Record<RoutePhase, string> = {
  departure: 'SID',
  enroute: 'DCT',
  arrival: 'STAR',
  approach: 'APP',
}

/** How a fix is reached: its runway, the airway, or the procedure (SID / STAR / APP). */
export function viaLabel(wp: { runway?: string; via?: string; phase: RoutePhase }): string {
  return wp.runway ? `RW${wp.runway}` : (wp.via ?? PHASE_LABEL[wp.phase])
}

/** A row ahead of the aircraft, the fix it's heading for, or one already flown. */
export type WaypointRowState = 'upcoming' | 'next' | 'passed'

/** The flag button of a fix that can be made the TOD reference. */
export interface ReferenceFlagModel {
  /** Index into the route's waypoints. */
  index: number
  /** Accessible name: what a tap does. */
  label: string
}

/**
 * A row of the table: a fix, or TOC / TOD (or T/D when they meet) slotted in between the
 * fixes. TOC / TOD rows have no via, tag, limits or flag, so those come out empty.
 */
export interface WaypointRowModel {
  kind: 'fix' | 'top'
  key: string
  /** The fix's ident, or TOC / TOD / T/D. */
  ident: string
  /** How the fix is reached: its runway, the airway, or the procedure (SID / STAR / APP). */
  via: string
  /** Under the ident: "TOD REF" on the fix the TOD is planned to, else empty. */
  tag: string
  isReference: boolean
  state: WaypointRowState
  /** Distance (to go while flying); empty once passed. */
  distance: string
  /**
   * The altitude limit, top line first (a "between" limit is the ceiling over the floor);
   * without a limit, the altitude set on the fix in the flight plan.
   */
  limitLines: readonly string[]
  speed: string
  /** Only on a fix that can be made the TOD reference. */
  flag?: ReferenceFlagModel
}

export interface WaypointTableInput {
  waypoints: readonly PlannedWaypoint<RouteWaypoint>[]
  profile: VerticalProfile
  reference: DescentReference
  /** Distance flown along the route; omitted without a live position. */
  flownNm?: number
  nextIndex?: number
}

const roundedAltitude = (ft: number) => formatAltitude(Math.round(ft / 100) * 100)

const altitudeText = (ft: number) => {
  const text = roundedAltitude(ft)
  return text.startsWith('FL') ? text : `${text} ft`
}

/** Every fix in route order, with TOC and TOD slotted in by distance. */
export function waypointRows(input: WaypointTableInput): WaypointRowModel[] {
  const { waypoints, profile, reference, flownNm, nextIndex } = input
  const routeWaypoints = waypoints.map((p) => p.waypoint)

  const progress = (distanceNm: number) => {
    const passed = flownNm !== undefined && distanceNm < flownNm - 0.05
    const shownNm = flownNm === undefined ? distanceNm : distanceNm - flownNm
    return { passed, distance: passed ? '' : formatDistance(shownNm) }
  }

  const rows: { distanceNm: number; row: WaypointRowModel }[] = waypoints.map((planned, index) => {
    const wp = planned.waypoint
    const { passed, distance } = progress(wp.distanceNm)
    const isReference = index === reference.index
    const live = flownNm !== undefined
    const planAltitudeLines =
      wp.planAltitudeFt === undefined ? [] : [formatAltitude(wp.planAltitudeFt)]
    return {
      distanceNm: wp.distanceNm,
      row: {
        kind: 'fix',
        key: `${wp.key}-${index}`,
        ident: wp.ident,
        via: viaLabel(wp),
        tag: isReference ? 'TOD REF' : '',
        isReference,
        state: passed ? 'passed' : live && index === nextIndex ? 'next' : 'upcoming',
        distance,
        limitLines: wp.altitude
          ? formatAltitudeLimit(wp.altitude).split(' ').reverse()
          : planAltitudeLines,
        speed: wp.speed ? formatSpeedLimit(wp.speed) : '',
        flag: canBeDescentReference(routeWaypoints, index)
          ? {
              index,
              // The picked reference's flag goes back to the default; the default's
              // (filled too) makes it an explicit pick.
              label:
                isReference && reference.source === 'selected'
                  ? 'Back to the default TOD reference'
                  : `Plan the TOD to ${wp.ident}`,
            }
          : undefined,
      },
    }
  })

  const tops =
    Math.abs(profile.todNm - profile.tocNm) < 0.5
      ? [{ label: 'T/D', distanceNm: profile.tocNm }]
      : [
          { label: 'TOC', distanceNm: profile.tocNm },
          { label: 'TOD', distanceNm: profile.todNm },
        ]
  for (const top of tops) {
    const { passed, distance } = progress(top.distanceNm)
    const at = rows.findIndex((r) => r.distanceNm > top.distanceNm)
    rows.splice(at < 0 ? rows.length : at, 0, {
      distanceNm: top.distanceNm,
      row: {
        kind: 'top',
        key: top.label,
        ident: top.label,
        via: '',
        tag: '',
        isReference: false,
        state: passed ? 'passed' : 'upcoming',
        distance,
        limitLines: [],
        speed: '',
      },
    })
  }

  return rows.map((r) => r.row)
}

/** The list's folded summary: fix count, length, and a warning when some are missing. */
export function waypointSummary(fixCount: number, totalNm: number, hasMissing: boolean): string {
  return [`${fixCount} fixes`, `${formatDistance(totalNm)} nm`, hasMissing && 'some missing']
    .filter(Boolean)
    .join('  ·  ')
}

/** What the database didn't have, or undefined when nothing is missing. */
export function missingRouteNote(
  missingProcedures: readonly string[],
  missingFixes: readonly string[],
): string | undefined {
  const notes = [
    missingProcedures.length > 0 && `Not in the database: ${missingProcedures.join(', ')}.`,
    missingFixes.length > 0 && `Fixes not found (left out): ${missingFixes.join(', ')}.`,
  ].filter(Boolean)
  return notes.length > 0 ? notes.join(' ') : undefined
}

/** One line on what the TOD is planned to, and how to change it. */
export function referenceNote(
  reference: DescentReference,
  waypoints: readonly PlannedWaypoint<RouteWaypoint>[],
  topFt: number,
): string {
  const wp = waypoints[reference.index]?.waypoint
  const name = wp?.runway ? `runway ${wp.runway}` : (wp?.ident ?? 'the runway')
  const at = reference.altitudeFt !== undefined ? ` at ${altitudeText(reference.altitudeFt)}` : ''
  switch (reference.source) {
    case 'default':
      return `TOD planned to ${name}${at}, the first approach fix with an altitude. Tap a fix's flag to plan to it instead.`
    case 'runway':
      return `TOD planned to the runway: no approach fix has an altitude. Tap a fix's flag to plan to it instead.`
    case 'selected':
      if (reference.altitudeFt !== undefined && reference.altitudeFt >= topFt - 0.5) {
        return `${name}'s limit${at} is at or above the cruise altitude, so it doesn't move the TOD. Tap its flag again for the default.`
      }
      return reference.altitudeFt !== undefined || wp?.runway
        ? `TOD planned to ${name}${at}, your pick. Tap its flag again for the default.`
        : `${name} has no altitude limit, so the descent passes it on the way to the runway. Tap its flag again for the default.`
  }
}
