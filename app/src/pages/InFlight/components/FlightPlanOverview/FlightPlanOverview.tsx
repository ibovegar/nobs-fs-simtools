import {
  Badge,
  type BadgeTone,
  Divider,
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
  type ClimbTarget,
  type DescentGuidance,
  type FlightPlanStatus,
  type FlightProgress,
  flightPlanResults,
  formatAltitude,
  type PlannedWaypoint,
  type ProfileBasis,
  type ProfileView,
  planningText,
  type RouteWaypoint,
  type VerticalProfile,
} from '~/pages/InFlight/domain'
import { RouteProfile } from '../RouteProfile'

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
  /** The aircraft's climb speed and the V/S that holds it; omitted when it has none. */
  climbTarget?: ClimbTarget
  /** Near and past TOD: the speed and V/S to fly, and any slowdown cue. */
  descentGuidance?: DescentGuidance
  /** The climb and descent the profile is planned with, for the explanation. */
  basis: ProfileBasis
  view: ProfileView
  onViewChange: (view: ProfileView) => void
  /** The live aircraft on the route; omitted without a position. */
  aircraft?: AircraftOnRoute
  nextIndex?: number
  /** The fix the TOD is planned to, flagged in the side view. */
  referenceIndex?: number
  /** The reference is the pilot's pick, not the default. */
  referencePicked?: boolean
  onSelectReference?: (index: number) => void
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
    climbTarget,
    descentGuidance,
    basis,
    view,
    onViewChange,
    aircraft,
    nextIndex,
    referenceIndex,
    referencePicked,
    onSelectReference,
  } = props
  const badge = STATUS_BADGE[progress.status]
  const cruise = cruiseFromPlan ? formatAltitude(cruiseFt) : `${formatAltitude(cruiseFt)} assumed`
  const routeLabel = `${title}  ·  ${cruise}`
  const statusBadge = (
    <Badge tone={badge.tone} dot pulse={badge.pulse}>
      {badge.label}
    </Badge>
  )

  return (
    // Laid out exactly like the TOD calculator's results (no section header, label line
    // then the big value), so switching tabs doesn't shift the answer. The route is the
    // label line; the status badge takes the calculator's pin corner.
    <>
      <Section>
        <SectionContent>
          <Results
            label={routeLabel}
            action={statusBadge}
            progress={progress}
            descentRateFpm={descentRateFpm}
            climbTarget={climbTarget}
            descentGuidance={descentGuidance}
            basis={basis}
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
            referenceIndex={referenceIndex}
            referencePicked={referencePicked}
            onSelectReference={onSelectReference}
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
  climbTarget?: ClimbTarget
  descentGuidance?: DescentGuidance
  basis: ProfileBasis
}

/**
 * Laid out like the TOD calculator's results: the answer big, two supporting values under
 * a hairline. What the answer is follows the phase of flight.
 */
function Results(props: ResultsProps) {
  const { label, action, progress, descentRateFpm, climbTarget, descentGuidance, basis } = props
  const { main, secondary } = flightPlanResults(
    progress,
    descentRateFpm,
    climbTarget,
    descentGuidance,
  )

  return (
    <>
      <Readout
        size="lg"
        label={label}
        help={planningText(basis)}
        helpLabel="How is this planned?"
        helpSize="lg"
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
              help={v.help}
              value={v.value}
              unit={v.unit}
              tone={v.tone}
              caption={v.caption}
              aside={v.aside?.value}
              asideUnit={v.aside?.unit}
            />
          ))}
        </ReadoutGroup>
      </Stack>
    </>
  )
}
