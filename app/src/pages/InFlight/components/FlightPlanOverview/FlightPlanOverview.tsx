import {
  Badge,
  type BadgeTone,
  Divider,
  HelpPopover,
  Readout,
  ReadoutGroup,
  Section,
  SectionContent,
  SectionMedia,
  SegmentedControl,
  Stack,
} from '@nobs/ui'
import type { ReactNode } from 'react'
import {
  type AircraftOnRoute,
  type FlightPlanStatus,
  type FlightProgress,
  formatAltitude,
  formatDistance,
  formatDuration,
  formatInteger,
  type PlannedWaypoint,
  PROFILE_ASSUMPTIONS,
  type ProfileView,
  type RouteWaypoint,
  type VerticalProfile,
} from '~/pages/InFlight/domain'
import { RouteProfile } from '../RouteProfile'

const A = PROFILE_ASSUMPTIONS

const STATUS_BADGE: Record<FlightPlanStatus, { tone: BadgeTone; label: string; pulse?: boolean }> =
  {
    standby: { tone: 'neutral', label: 'Standby' },
    climb: { tone: 'accent', label: 'Climb' },
    cruise: { tone: 'accent', label: 'Cruise' },
    approaching: { tone: 'warning', label: 'TOD soon', pulse: true },
    descend: { tone: 'danger', label: 'Descend', pulse: true },
    'on-path': { tone: 'success', label: 'On path' },
    'below-path': { tone: 'warning', label: 'Below path' },
  }

const VIEWS = [
  { value: 'all', label: 'Whole flight' },
  { value: 'departure', label: 'Climb' },
  { value: 'arrival', label: 'Descent' },
] as const

interface FlightPlanOverviewProps {
  /** 'ENGM 01L → ENBR 17' */
  title: string
  cruiseFt: number
  /** False when the plan has no cruise altitude and a default is assumed. */
  cruiseFromPlan: boolean
  profile: VerticalProfile
  waypoints: readonly PlannedWaypoint<RouteWaypoint>[]
  progress: FlightProgress
  /** Vertical speed that flies the planned descent at the current groundspeed. */
  descentRateFpm: number
  view: ProfileView
  onViewChange: (view: ProfileView) => void
  /** The live aircraft on the route; omitted without a position. */
  aircraft?: AircraftOnRoute
  nextIndex?: number
}

/**
 * The flight at a glance, in two sections: the route and phase with the one number that
 * matters now (to TOC, to TOD, or the descent path deviation), then the planned profile
 * from the side with its view switch.
 */
export function FlightPlanOverview(props: FlightPlanOverviewProps) {
  const {
    title,
    cruiseFt,
    cruiseFromPlan,
    profile,
    waypoints,
    progress,
    descentRateFpm,
    view,
    onViewChange,
    aircraft,
    nextIndex,
  } = props
  const badge = STATUS_BADGE[progress.status]
  const cruise = cruiseFromPlan ? formatAltitude(cruiseFt) : `${formatAltitude(cruiseFt)} assumed`

  return (
    // Laid out exactly like the TOD calculator's results (no section header, label line
    // then the big value), so switching tabs doesn't shift the answer. The route is the
    // label line; the status badge takes the calculator's pin corner.
    <>
      <Section>
        <SectionContent>
          <Results
            label={`${title}  ·  ${cruise}`}
            action={
              <Badge tone={badge.tone} dot pulse={badge.pulse}>
                {badge.label}
              </Badge>
            }
            progress={progress}
            descentRateFpm={descentRateFpm}
          />
        </SectionContent>
      </Section>
      <Section label="Profile">
        <SectionMedia>
          <RouteProfile
            profile={profile}
            waypoints={waypoints}
            view={view}
            aircraft={aircraft}
            nextIndex={nextIndex}
          />
        </SectionMedia>
        <SectionContent>
          <SegmentedControl
            label="Profile view"
            options={VIEWS}
            value={view}
            onChange={onViewChange}
            size="sm"
          />
        </SectionContent>
      </Section>
    </>
  )
}

interface ResultsProps {
  /** The label line above the big value: the route. */
  label: string
  /** In the top-right corner: the status badge. */
  action: ReactNode
  progress: FlightProgress
  descentRateFpm: number
}

interface Value {
  label: string
  value: string
  unit?: string
  /** What the value means, behind a "?" (also keeps the row as tall as the calculator's). */
  help: string
}

// As on the TOD calculator: no thousands separator, so "-2250" doesn't read like a decimal.
// Climbs are positive, descents negative; to the nearest 50 fpm.
const verticalSpeed = (fpm: number | undefined, help: string): Value => ({
  label: 'Vertical speed',
  help,
  value: fpm === undefined ? '—' : String(Math.round(fpm / 50) * 50),
  unit: fpm === undefined ? undefined : 'fpm',
})
const time = (sec: number | undefined, help: string): Value => ({
  label: 'Time',
  help,
  value: sec === undefined ? '—' : formatDuration(sec),
})
const distance = (label: string, nm: number, help: string): Value => ({
  label,
  help,
  value: formatDistance(Math.max(0, nm)),
  unit: 'nm',
})

interface ResultValues {
  main: { value: string; unit: string; tone?: BadgeTone }
  secondary: [Value, Value]
}

/** What the box shows for the phase of flight. Plain function: see Results. */
function resultValues(progress: FlightProgress, descentRateFpm: number): ResultValues {
  const { status } = progress

  // The big value reads as one line after the unit: "38 nm to TOD", "1,780 ft below path".
  let main: { value: string; unit: string; tone?: BadgeTone }
  let secondary: [Value, Value]
  if ((status === 'standby' || status === 'climb') && progress.toTocNm > 0) {
    main = { value: formatDistance(Math.max(0, progress.toTocNm)), unit: 'nm to TOC' }
    secondary = [
      time(progress.timeToTocSec, 'Time to TOC at your groundspeed.'),
      verticalSpeed(
        progress.climbRateToTocFpm,
        'The climb rate that reaches the cruise altitude exactly at TOC, from where you are now.',
      ),
    ]
  } else if (status === 'standby' || status === 'cruise' || status === 'approaching') {
    main = {
      value: formatDistance(Math.max(0, progress.toTodNm)),
      unit: 'nm to TOD',
      tone: status === 'approaching' ? 'warning' : undefined,
    }
    // In cruise: hold (or regain) the cruise altitude. Two minutes out: the rate for TOD.
    secondary = [
      time(progress.timeToTodSec, 'Time to TOD at your groundspeed.'),
      status === 'approaching'
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
          ),
    ]
  } else {
    // Past TOD: how far off the planned path. On it: a signed trend; off it: high / low.
    const dev = progress.deviationFt ?? 0
    const rounded = Math.round(dev / 10) * 10
    const onPath = status === 'on-path'
    const sign = onPath && rounded > 0 ? '+' : onPath && rounded < 0 ? '-' : ''
    main = {
      value: `${sign}${formatInteger(Math.abs(rounded))}`,
      unit: onPath ? 'ft on path' : dev > 0 ? 'ft above path' : 'ft below path',
      tone: onPath ? 'success' : status === 'descend' ? 'danger' : 'warning',
    }
    secondary = [
      verticalSpeed(
        -descentRateFpm,
        'The descent rate that holds the planned path angle at your groundspeed.',
      ),
      distance('To go', progress.remainingNm, 'Distance left along the route to the runway.'),
    ]
  }

  return { main, secondary }
}

/**
 * Laid out like the TOD calculator's results: the answer big, two supporting values under
 * a hairline. What the answer is follows the phase of flight.
 */
function Results(props: ResultsProps) {
  const { label, action, progress, descentRateFpm } = props
  // Worked out outside the component: the React Compiler mis-memoises a `let` assigned in
  // branches here (it read `main.tone` before `main` was set).
  const { main, secondary } = resultValues(progress, descentRateFpm)

  return (
    <>
      <Readout
        size="lg"
        label={label}
        labelAddon={
          <HelpPopover label="How is this planned?" size="lg">
            From the sim's flight plan: a climb at {formatInteger(A.climbRateFpm)} fpm and{' '}
            {A.climbSpeedKt} kt, cruise at the plan's altitude and a {A.descentAngleDeg}° descent,
            kept within the procedures' altitude limits. TOC and TOD follow from that.
          </HelpPopover>
        }
        action={action}
        value={main.value}
        unit={main.unit}
        tone={main.tone}
      />
      <Stack gap={3}>
        <Divider />
        <ReadoutGroup divided>
          {secondary.map((v) => (
            <Readout
              key={v.label}
              label={v.label}
              labelAddon={
                <HelpPopover label={`What is ${v.label.toLowerCase()}?`}>{v.help}</HelpPopover>
              }
              value={v.value}
              unit={v.unit}
            />
          ))}
        </ReadoutGroup>
      </Stack>
    </>
  )
}
