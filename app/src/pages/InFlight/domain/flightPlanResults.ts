// What the flight plan's results box shows in each phase of flight: the big answer and two
// supporting values, and the "How is this planned?" text.
import type { BadgeTone } from '@nobs/ui'
import type { FlightProgress } from './flightProgress'
import { formatDistance, formatDuration, formatInteger } from './format'
import type { ProfileBasis } from './profileAssumptions'

export interface ResultValue {
  label: string
  value: string
  unit?: string
  /** What the value means, behind a "?" (also keeps the row as tall as the calculator's). */
  help: string
}

export interface FlightPlanResults {
  /** The big value, which reads as one line with its unit: "38 nm to TOD". */
  main: { value: string; unit: string; tone?: BadgeTone }
  /** Under it, vertical speed always on the right so it doesn't jump sides at TOD. */
  secondary: readonly [ResultValue, ResultValue]
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

/** Before TOC: distance to it, the time, and the climb rate that makes it. */
function climbResults(progress: FlightProgress): FlightPlanResults {
  return {
    main: { value: formatDistance(Math.max(0, progress.toTocNm)), unit: 'nm to TOC' },
    secondary: [
      time(progress.timeToTocSec, 'Time to TOC at your groundspeed.'),
      verticalSpeed(
        progress.climbRateToTocFpm,
        'The climb rate that reaches the cruise altitude exactly at TOC, from where you are now.',
      ),
    ],
  }
}

/** In cruise: distance to TOD; hold (or regain) the cruise altitude, then the rate for TOD. */
function cruiseResults(progress: FlightProgress, descentRateFpm: number): FlightPlanResults {
  const approaching = progress.status === 'approaching'
  const rate = approaching
    ? {
        ...verticalSpeed(
          -descentRateFpm,
          'The descent rate to fly from TOD: the planned path angle at your groundspeed.',
        ),
        label: 'V/S at TOD',
      }
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
    secondary: [time(progress.timeToTodSec, 'Time to TOD at your groundspeed.'), rate],
  }
}

/** Past TOD: how far off the planned path. On it: a signed trend; off it: high / low. */
function descentResults(progress: FlightProgress, descentRateFpm: number): FlightPlanResults {
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
      verticalSpeed(
        -descentRateFpm,
        'The descent rate that holds the planned path angle at your groundspeed.',
      ),
    ],
  }
}

/** What the results box shows for the phase of flight. */
export function flightPlanResults(
  progress: FlightProgress,
  descentRateFpm: number,
): FlightPlanResults {
  const { status } = progress
  if ((status === 'standby' || status === 'climb') && progress.toTocNm > 0) {
    return climbResults(progress)
  }
  if (status === 'standby' || status === 'cruise' || status === 'approaching') {
    return cruiseResults(progress, descentRateFpm)
  }
  return descentResults(progress, descentRateFpm)
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
