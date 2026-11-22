// What the side view's tooltip says about a fix: its exact charted limits from the sim, and
// how far (and how long) to go. Pure and unit-tested.
import { formatAltitude, formatDistance, formatDuration } from './format'
import { type ChartWaypoint, chartLabel } from './profileChart'
import type { AltitudeConstraint, SpeedConstraint } from './route'
import { viaLabel } from './waypointTable'

/** Below this groundspeed there's no meaningful time to the fix. */
const MIN_ETE_GROUNDSPEED_KT = 40

export interface FixTooltipInput {
  waypoint: ChartWaypoint
  /** Distance of the route's first fix (distances are counted from there). */
  startNm: number
  /** Distance flown along the route; omitted without a live position. */
  flownNm?: number
  groundSpeedKt?: number
  /** The fix the TOD is planned to. */
  isReference?: boolean
  /** The reference is the pilot's pick, not the default. */
  isPickedReference?: boolean
  /** The pilot can make this fix the TOD reference from the tooltip. */
  canBeReference?: boolean
}

export interface FixTooltipModel {
  title: string
  /** How it's reached (RW01L, an airway, SID / STAR / APP), and "TOD reference". */
  subtitle: string
  rows: { label: string; value: string }[]
  /** The button that picks this fix, or undoes the pick; none on the default reference. */
  referenceAction?: { label: string; isPicked: boolean }
}

// Exactly as charted: a limit of 2,350 ft must not read 2,400.
const altitudeText = (ft: number) => {
  const text = formatAltitude(ft)
  return text.startsWith('FL') ? text : `${text} ft`
}

/** An altitude limit in words: "At or above 3,000 ft", "Between 3,000 ft and FL100". */
export function altitudeLimitText(limit: AltitudeConstraint | undefined): string {
  if (!limit) return 'None'
  const lower = limit.lowerFt === undefined ? '' : altitudeText(limit.lowerFt)
  const upper = limit.upperFt === undefined ? '' : altitudeText(limit.upperFt)
  switch (limit.kind) {
    case 'at':
      return `At ${lower || upper}`
    case 'atOrAbove':
      return `At or above ${lower}`
    case 'atOrBelow':
      return `At or below ${upper}`
    default:
      // "Between 5,000 and 7,000 ft": the unit once when both are in feet.
      return `Between ${lower.replace(/ ft$/, upper.endsWith(' ft') ? '' : ' ft')} and ${upper}`
  }
}

/** A speed limit in words: "At or below 210 kt". */
export function speedLimitText(limit: SpeedConstraint | undefined): string {
  if (!limit) return 'None'
  const how = { at: 'At', atOrAbove: 'At or above', atOrBelow: 'At or below' }[limit.kind]
  return `${how} ${limit.kt} kt`
}

/** The tooltip of a fix on the side view. */
export function fixTooltip(input: FixTooltipInput): FixTooltipModel {
  const {
    waypoint,
    startNm,
    flownNm,
    groundSpeedKt,
    isReference = false,
    isPickedReference = false,
    canBeReference = false,
  } = input

  const live = flownNm !== undefined
  const toGoNm = live ? waypoint.distanceNm - flownNm : undefined
  const passed = toGoNm !== undefined && toGoNm < -0.05
  const distance =
    toGoNm === undefined
      ? `${formatDistance(waypoint.distanceNm - startNm)} nm from departure`
      : passed
        ? 'Passed'
        : `${formatDistance(toGoNm)} nm to go`
  const ete =
    toGoNm !== undefined &&
    !passed &&
    groundSpeedKt !== undefined &&
    groundSpeedKt >= MIN_ETE_GROUNDSPEED_KT
      ? formatDuration((Math.max(0, toGoNm) / groundSpeedKt) * 3600)
      : undefined

  const rows = [
    { label: 'Altitude limit', value: altitudeLimitText(waypoint.altitude) },
    { label: 'Speed limit', value: speedLimitText(waypoint.speed) },
    { label: 'Distance', value: distance },
  ]
  if (waypoint.planAltitudeFt !== undefined) {
    rows.unshift({ label: 'Flight plan altitude', value: altitudeText(waypoint.planAltitudeFt) })
  }
  if (ete) rows.push({ label: 'Time to fix', value: ete })

  const title = chartLabel(waypoint)
  const picked = isReference && isPickedReference
  const referenceAction =
    !canBeReference || (isReference && !picked)
      ? undefined
      : {
          label: `Plan TOD to ${title}`,
          isPicked: picked,
        }

  return {
    title,
    subtitle: [viaLabel(waypoint), isReference && 'TOD reference'].filter(Boolean).join('  ·  '),
    rows,
    referenceAction,
  }
}
