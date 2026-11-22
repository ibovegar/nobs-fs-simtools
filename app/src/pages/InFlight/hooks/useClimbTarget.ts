import { useEffect, useRef, useState } from 'react'
import { type AircraftPerformance, climbSpeedKias } from '~/aircraft'
import {
  addClimbSample,
  type ClimbSample,
  type ClimbTarget,
  climbRateToHold,
} from '~/pages/InFlight/domain'
import { useSimVars } from '~/sim'
import { CLIMB_TARGET_SIM_VARS } from './inFlightSimVars'

/** Polls nothing outside the climb. */
const NOT_CLIMBING = {} as typeof CLIMB_TARGET_SIM_VARS

/**
 * The aircraft's climb speed at this altitude and, while climbing, the V/S that holds it.
 * Re-renders only when the rounded V/S changes.
 */
export function useClimbTarget(
  performance: AircraftPerformance | undefined,
  climbing: boolean,
  altitudeFt: number | undefined,
): ClimbTarget | undefined {
  const sim = useSimVars(climbing ? CLIMB_TARGET_SIM_VARS : NOT_CLIMBING, 1)
  const samples = useRef<readonly ClimbSample[]>([])
  const [rateFpm, setRateFpm] = useState<number>()
  const speedKias =
    performance && altitudeFt !== undefined ? climbSpeedKias(performance, altitudeFt) : undefined

  useEffect(() => {
    const { simTime, tas, ias, verticalSpeed } = sim
    if (
      !climbing ||
      speedKias === undefined ||
      altitudeFt === undefined ||
      simTime === undefined ||
      tas === undefined ||
      ias === undefined ||
      verticalSpeed === undefined
    ) {
      samples.current = []
      setRateFpm(undefined)
      return
    }
    samples.current = addClimbSample(samples.current, {
      timeSec: simTime,
      tasKt: tas,
      iasKt: ias,
      verticalSpeedFpm: verticalSpeed,
      altitudeFt,
    })
    setRateFpm(climbRateToHold(samples.current, speedKias))
  }, [sim, climbing, speedKias, altitudeFt])

  return speedKias === undefined ? undefined : { speedKias, rateFpm }
}
