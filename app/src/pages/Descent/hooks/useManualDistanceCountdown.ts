import { useEffect, useRef } from 'react'
import { advanceDistance } from '~/pages/Descent/domain'

interface ManualDistanceCountdownOptions {
  /** Count down only while the manual distance is the one in use. */
  enabled: boolean
  groundSpeedKt: number | undefined
  simTimeSec: number | undefined
  /** Applies an update to the stored manual distance. */
  advance: (update: (distanceNm: number) => number) => void
}

/**
 * Makes a hand-entered distance count down as you fly, driven by sim time so a paused sim
 * doesn't move it. Shared by the TOD planner and the glideslope.
 */
export function useManualDistanceCountdown(options: ManualDistanceCountdownOptions) {
  const { enabled, groundSpeedKt, simTimeSec, advance } = options

  const lastSimTime = useRef<number | undefined>(undefined)
  useEffect(() => {
    const previous = lastSimTime.current
    // Only act on a new sim-time sample (the effect also re-runs when `advance` changes).
    if (simTimeSec === previous) return
    lastSimTime.current = simTimeSec
    if (simTimeSec === undefined || previous === undefined) return
    if (!enabled || groundSpeedKt === undefined) return
    const elapsed = simTimeSec - previous
    const groundSpeed = groundSpeedKt
    advance((distanceNm) => advanceDistance(distanceNm, groundSpeed, elapsed))
  }, [simTimeSec, groundSpeedKt, enabled, advance])
}
