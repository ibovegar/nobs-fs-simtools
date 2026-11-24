// What the flight plan's results box shows in each phase of flight: the big answer and three
// supporting values (time or distance, V/S, speed), and the "How is this planned?" text.
import type { BadgeTone } from '@nobs/ui'
import type { ClimbTarget } from './climbTarget'
import type { DescentGuidance } from './descentGuidance'
import type { FlightProgress } from './flightProgress'
import { formatDistance, formatDuration, formatInteger } from './format'
import type { ProfileBasis } from './profileAssumptions'

export interface ResultValue {
  label: string
  value: string
  unit?: string
  /** What the value means, behind a "?" (also keeps the row as tall as the calculator's). */
  help: string
  tone?: BadgeTone
  /** A short instruction under the value: too high (V/S), or a slowdown (speed). */
  caption?: string
}

export interface FlightPlanResults {
  /** The big value, which reads as one line with its unit: "38 nm to TOD". */
  main: { value: string; unit: string; tone?: BadgeTone }
  /**
   * Under it: time or distance, the V/S, and the speed to fly beside it (as the autopilot's
   * V/S and speed). The same three columns in every phase, so nothing jumps at TOC or TOD.
   */
  secondary: readonly [ResultValue, ResultValue, ResultValue]
}

// As on the TOD calculator: no thousands separator, so "-2250" doesn't read like a decimal.
// Climbs are positive, descents negative; to the nearest 50 fpm.
const verticalSpeed = (fpm: number | undefined, help: string): ResultValue => ({
  label: 'Vertical speed',
  help,
  value: fpm === undefined ? '—' : String(Math.round(fpm / 50) * 50),
  unit: fpm === undefined ? undefined : 'fpm',
})

const time = (sec: number | undefined, help: string): ResultValue => ({
  label: 'Time',
  help,
  value: sec === undefined ? '—' : formatDuration(sec),
})

const distance = (label: string, nm: number, help: string): ResultValue => ({
  label,
  help,
  value: formatDistance(Math.max(0, nm)),
  unit: 'nm',
})

const speed = (kias: number | undefined, help: string, caption?: string): ResultValue => ({
  label: 'Speed',
  help,
  value: kias === undefined ? '—' : String(Math.round(kias)),
  unit: kias === undefined ? undefined : 'kt',
  caption,
})

const NO_CLIMB_SPEED_HELP = 'SimTools has no recommended climb speed for this aircraft.'
const climbTargetHelp = (speedKias: number) =>
  `The V/S that holds the recommended ${speedKias} kt with your present power, worked out from how your speed is changing. Set climb power first. It shows — for the first few seconds, or when you're more than 30 kt off that speed.`

/** The V/S that holds the aircraft's climb speed. */
function climbTargetValue(target: ClimbTarget | undefined): ResultValue {
  if (!target) return verticalSpeed(undefined, NO_CLIMB_SPEED_HELP)
  return verticalSpeed(target.rateFpm, climbTargetHelp(target.speedKias))
}

/**
 * Before TOC: distance to it, the time, and the climb speed with the V/S that holds it. In
 * flight the climb is planned from the aircraft, so TOC moves with how you climb.
 */
function climbResults(
  progress: FlightProgress,
  climbTarget: ClimbTarget | undefined,
): FlightPlanResults {
  return {
    main: { value: formatDistance(Math.max(0, progress.toTocNm)), unit: 'nm to TOC' },
    secondary: [
      time(progress.timeToTocSec, 'Time to TOC at your groundspeed.'),
      climbTargetValue(climbTarget),
      speed(
        climbTarget?.speedKias,
        climbTarget
          ? "The aircraft's recommended climb speed (indicated airspeed)."
          : NO_CLIMB_SPEED_HELP,
      ),
    ],
  }
}

/** The instruction under the speed: when to slow down for a limit or the approach. */
function slowdownCaption(guidance: DescentGuidance | undefined): string | undefined {
  const slowdown = guidance?.slowdown
  if (!slowdown) return undefined
  const when = slowdown.inNm > 0 ? `in ${formatDistance(slowdown.inNm)} nm` : 'now'
  return `Slow to ${slowdown.kt} kt ${when}`
}

/** A descent V/S, in red with a note when the next fix can't be made. */
function withDescentGuidance(rate: ResultValue, guidance: DescentGuidance | undefined) {
  const tooHighFor = guidance?.tooHighFor
  if (!tooHighFor) return rate
  return { ...rate, tone: 'danger' as const, caption: `Too high for ${tooHighFor}` }
}

const DESCENT_SPEED_HELP =
  "The speed to fly in the descent (indicated airspeed): the aircraft's descent speed, lowered by the procedure's speed limits, and its approach speed from 5 nm before the runway. Below it: when to start slowing down."
const NO_DESCENT_SPEED_HELP =
  "SimTools has no descent speed for this aircraft. It shows the procedure's speed limits once you pass them."
const CRUISE_SPEED_HELP =
  'In cruise the speed follows your cruise power. Close to TOD this shows the speed to descend at.'

/** The speed to fly in the descent, with the slowdown cue. */
function descentSpeed(guidance: DescentGuidance | undefined): ResultValue {
  const kias = guidance?.speedKias
  return speed(
    kias,
    kias === undefined ? NO_DESCENT_SPEED_HELP : DESCENT_SPEED_HELP,
    slowdownCaption(guidance),
  )
}

/** In cruise: distance to TOD; hold (or regain) the cruise altitude, then the rate for TOD. */
function cruiseResults(
  progress: FlightProgress,
  descentRateFpm: number,
  guidance: DescentGuidance | undefined,
): FlightPlanResults {
  const approaching = progress.status === 'approaching'
  const rate = approaching
    ? withDescentGuidance(
        {
          ...verticalSpeed(
            -descentRateFpm,
            'The descent rate to fly from TOD: the planned path at your groundspeed.',
          ),
          label: 'V/S at TOD',
        },
        guidance,
      )
    : verticalSpeed(
        progress.cruiseRateFpm,
        '0 at the cruise altitude. Off it: the rate that gets you back (the gap per minute, at most 1500 fpm).',
      )
  return {
    main: {
      value: formatDistance(Math.max(0, progress.toTodNm)),
      unit: 'nm to TOD',
      tone: approaching ? 'warning' : undefined,
    },
    secondary: [
      time(progress.timeToTodSec, 'Time to TOD at your groundspeed.'),
      rate,
      approaching ? descentSpeed(guidance) : speed(undefined, CRUISE_SPEED_HELP),
    ],
  }
}

/** Past TOD: how far off the planned path. On it: a signed trend; off it: high / low. */
function descentResults(
  progress: FlightProgress,
  descentRateFpm: number,
  guidance: DescentGuidance | undefined,
): FlightPlanResults {
  const dev = progress.deviationFt ?? 0
  const rounded = Math.round(dev / 10) * 10
  const onPath = progress.status === 'on-path'
  const sign = onPath && rounded > 0 ? '+' : onPath && rounded < 0 ? '-' : ''
  const unit = onPath ? 'ft on path' : dev > 0 ? 'ft above path' : 'ft below path'
  const tone: BadgeTone = onPath ? 'success' : progress.status === 'descend' ? 'danger' : 'warning'
  return {
    main: { value: `${sign}${formatInteger(Math.abs(rounded))}`, unit, tone },
    secondary: [
      distance('To go', progress.remainingNm, 'Distance left along the route to the runway.'),
      withDescentGuidance(
        verticalSpeed(
          -(guidance?.rateFpm ?? descentRateFpm),
          "The V/S to fly, worked out live to reach the next planned altitude from where you are, so it corrects for wind and for being high or low. 0 means hold your altitude until the path comes down to you. Too high: it can't be made at a normal descent rate.",
        ),
        guidance,
      ),
      descentSpeed(guidance),
    ],
  }
}

/** What the results box shows for the phase of flight. */
export function flightPlanResults(
  progress: FlightProgress,
  descentRateFpm: number,
  climbTarget?: ClimbTarget,
  descentGuidance?: DescentGuidance,
): FlightPlanResults {
  const { status } = progress
  if ((status === 'standby' || status === 'climb') && progress.toTocNm > 0) {
    return climbResults(progress, climbTarget)
  }
  if (status === 'standby' || status === 'cruise' || status === 'approaching') {
    return cruiseResults(progress, descentRateFpm, descentGuidance)
  }
  return descentResults(progress, descentRateFpm, descentGuidance)
}

/** "How is this planned?": the aircraft's own climb and descent, or the generic ones. */
export function planningText(basis: ProfileBasis): string {
  const own = (fromAircraft: boolean) =>
    fromAircraft && basis.aircraftName ? ` (the ${basis.aircraftName}'s)` : ' (generic)'
  const climb = `a climb at ${basis.climbSpeedKt} kt, about ${formatInteger(basis.climbRateFpm)} fpm${own(basis.climbFromAircraft)}`
  const descent = `a descent of about ${basis.descentAngleDeg.toFixed(1)}°${own(basis.descentFromAircraft)}`
  const limits = "kept within the procedures' altitude limits. TOC and TOD follow from that."
  return `From the sim's flight plan: ${climb}, cruise at the plan's altitude and ${descent}, ${limits}`
}
