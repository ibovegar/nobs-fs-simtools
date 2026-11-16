import {
  DEFAULT_GLIDESLOPE_SETUP,
  type GlideslopeSetup,
  glideslopePosition,
} from '~/pages/InFlight/domain'
import { useSimVars } from '~/sim'
import { usePersistentState } from '~/storage'
import { GLIDESLOPE_SIM_VARS } from './inFlightSimVars'
import { useManualDistanceCountdown } from './useManualDistanceCountdown'

/**
 * State behind the GS tab: the persisted runway setup (angle, elevation, distance), live
 * sim values and where the aircraft is relative to the selected glideslope. The position
 * needs live altitude, so it is null without a sim.
 */
export function useGlideslope() {
  const [setup, setSetup] = usePersistentState('glideslope.v1', DEFAULT_GLIDESLOPE_SETUP)
  const sim = useSimVars(GLIDESLOPE_SIM_VARS)
  const update = (patch: Partial<GlideslopeSetup>) => setSetup((prev) => ({ ...prev, ...patch }))

  const gpsAvailable = sim.gpsDistance !== undefined && sim.gpsDistance > 0
  const useGps = setup.distanceSource === 'gps' && gpsAvailable
  const distanceNm = useGps ? (sim.gpsDistance ?? 0) : setup.manualDistanceNm

  useManualDistanceCountdown({
    enabled: !useGps,
    groundSpeedKt: sim.groundSpeed,
    simTimeSec: sim.simTime,
    advance: (next) =>
      setSetup((prev) => ({ ...prev, manualDistanceNm: next(prev.manualDistanceNm) })),
  })

  const position =
    sim.altitude === undefined
      ? null
      : glideslopePosition({
          altitudeFt: sim.altitude,
          runwayElevationFt: setup.runwayElevationFt,
          distanceNm,
          degrees: setup.angleDeg,
        })

  return {
    setup,
    update,
    distanceNm,
    position,
    live: {
      groundSpeed: sim.groundSpeed,
      verticalSpeed: sim.verticalSpeed,
      gpsDistance: gpsAvailable ? sim.gpsDistance : undefined,
    },
  }
}
