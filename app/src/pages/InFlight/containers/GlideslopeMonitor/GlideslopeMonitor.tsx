import { GlidepathCard, GlideslopeCard, RunwayCard } from '~/pages/InFlight/components'
import { useGlideslope } from '~/pages/InFlight/hooks'

/**
 * The GS tab: where the aircraft is on the selected glideslope (side view, dot scale,
 * deviation), the vertical speed that holds it, and the runway it ends at.
 */
export function GlideslopeMonitor() {
  const { setup, update, distanceNm, position, live } = useGlideslope()

  return (
    <>
      <GlideslopeCard position={position} degrees={setup.angleDeg} distanceNm={distanceNm} />
      <GlidepathCard
        groundSpeedKt={live.groundSpeed}
        verticalSpeedFpm={live.verticalSpeed}
        degrees={setup.angleDeg}
      />
      <RunwayCard setup={setup} gpsDistance={live.gpsDistance} onChange={update} />
    </>
  )
}
