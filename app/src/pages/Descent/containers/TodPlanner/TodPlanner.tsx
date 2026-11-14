import { DescentOptions, DescentSummary, DescentTargetCard } from '~/pages/Descent/components'
import { useDescentPlanner } from '~/pages/Descent/hooks'

/**
 * The TOD tab: where to start down, and at what rate. Summary first, then the two inputs
 * you change per flight (target), then the rarely touched options folded away.
 */
export function TodPlanner() {
  const { setup, update, optionsOpen, setOptionsOpen, inputs, plan, status, live } =
    useDescentPlanner()

  return (
    <>
      <DescentSummary
        plan={plan}
        status={status}
        altitudeFt={inputs.currentAltitudeFt}
        groundSpeedKt={inputs.groundSpeedKt}
        verticalSpeedFpm={live.verticalSpeed}
        live={live.altitude !== undefined && live.groundSpeed !== undefined}
      />
      <DescentTargetCard setup={setup} gpsDistance={live.gpsDistance} onChange={update} />
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
