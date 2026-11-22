import { FlightPlanMessage, FlightPlanOverview, WaypointList } from '~/pages/InFlight/components'
import { describeRoute } from '~/pages/InFlight/domain'
import { useFlightPlanProfile } from '~/pages/InFlight/hooks'
import { CalculatorTod } from '../CalculatorTod'

interface FlightPlanProfileProps {
  /** Switch to the TOD calculator tab (from the no-flight-plan fallback). */
  onOpenCalculator: () => void
}

/**
 * The Flight plan tab, read-only: the sim's flight plan as a planned climb / cruise /
 * descent. One overview (phase, the number that matters now, the profile from the side),
 * then the waypoints with planned altitudes and limits. Without a flight plan (or a sim),
 * it shows the TOD calculator's descent instead.
 */
export function FlightPlanProfile(props: FlightPlanProfileProps) {
  const { onOpenCalculator } = props
  const { state, reload, plan, view, setView, waypointsOpen, setWaypointsOpen, selectReference } =
    useFlightPlanProfile()

  if (!plan || state.status !== 'ready') {
    const status = state.status === 'ready' ? 'loading' : state.status
    return (
      // The calculator's answer first, in the same place as on its own tab; the reason
      // (no flight plan / no sim) below it.
      <>
        {status !== 'loading' && <CalculatorTod onOpenCalculator={onOpenCalculator} />}
        <FlightPlanMessage status={status} onReload={reload} />
      </>
    )
  }

  const { title } = describeRoute(plan.route.plan)
  const flying = plan.progress.status !== 'standby'

  return (
    <>
      <FlightPlanOverview
        title={title}
        cruiseFt={plan.cruiseFt}
        cruiseFromPlan={plan.cruiseFromPlan}
        profile={plan.profile}
        waypoints={plan.waypoints}
        progress={plan.progress}
        descentRateFpm={plan.descentRateFpm}
        basis={plan.basis}
        view={view}
        onViewChange={setView}
        aircraft={plan.aircraft}
        nextIndex={flying ? plan.progress.nextIndex : undefined}
        referenceIndex={plan.reference.index}
      />
      <WaypointList
        waypoints={plan.waypoints}
        profile={plan.profile}
        reference={plan.reference}
        onSelectReference={selectReference}
        flownNm={plan.aircraft ? plan.aircraft.distanceNm : undefined}
        nextIndex={flying ? plan.progress.nextIndex : undefined}
        missingFixes={plan.route.missingFixes}
        missingProcedures={plan.route.missingProcedures}
        onReload={reload}
        open={waypointsOpen}
        onOpenChange={setWaypointsOpen}
      />
    </>
  )
}
