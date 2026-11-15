import { DescentOptions, DescentSummary, DescentTargetCard } from '~/pages/Descent/components'
import { useFlightPlanTod } from '~/pages/Descent/hooks'

/**
 * The Flight plan tab: top of descent worked out automatically from the active flight
 * plan. Summary first, then the target altitude, then the rarely touched options.
 */
export function FlightPlanTod() {
  const { setup, update, optionsOpen, setOptionsOpen, inputs, plan, status, live, flightPlanNm } =
    useFlightPlanTod()

  return (
    <>
      <DescentSummary
        plan={plan}
        status={status}
        altitudeFt={inputs.currentAltitudeFt}
        groundSpeedKt={inputs.groundSpeedKt}
        verticalSpeedFpm={live.verticalSpeed}
        live={live.altitude !== undefined && live.groundSpeed !== undefined}
        noDataCaption={
          flightPlanNm === undefined ? 'No flight plan — load one in the sim' : undefined
        }
      />
      <DescentTargetCard setup={setup} flightPlanNm={flightPlanNm} onChange={update} />
      <DescentOptions
        setup={setup}
        altitude={live.altitude}
        groundSpeed={live.groundSpeed}
        onChange={update}
        open={optionsOpen}
        onOpenChange={setOptionsOpen}
      />
    </>
  )
}
