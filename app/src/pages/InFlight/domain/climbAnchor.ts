// Where the planned climb starts once the flight is under way. A climb isn't flown to a
// fixed path (take-off time, ATC and the SID decide when it really starts), so the climb
// ahead is planned from the aircraft, as an FMS predicts its TOC: TOC moves with you until
// you reach cruise, and then stays where you did. Pure and unit-tested.
import type { ProfilePoint, VerticalProfile } from './verticalProfile'

/** Within this of the top altitude, cruise is reached: TOC is fixed there. */
export const CRUISE_REACHED_FT = 100

export interface ClimbAnchorInput {
  /** The profile planned from the runway (no live data). */
  planned: VerticalProfile
  /** The aircraft on the route; undefined without a position or altitude. */
  aircraft: ProfilePoint | undefined
  /** Where cruise was reached on this flight (route distance), if it has been. */
  reachedTocNm: number | undefined
}

export interface ClimbAnchor {
  /** Where the climb ahead starts; undefined: from the runway. */
  climbFrom: ProfilePoint | undefined
  /** Where cruise is reached now, to remember as the TOC; undefined while still climbing. */
  reachedTocNm: number | undefined
}

export function climbAnchor(input: ClimbAnchorInput): ClimbAnchor {
  const { planned, aircraft, reachedTocNm } = input
  const topFt = planned.topFt

  // A TOC remembered from this flight holds while the aircraft is past it. One ahead of
  // the aircraft is from an earlier flight on the same route.
  if (reachedTocNm !== undefined && aircraft && aircraft.distanceNm >= reachedTocNm) {
    return { climbFrom: { distanceNm: reachedTocNm, altitudeFt: topFt }, reachedTocNm }
  }
  // Past the planned descent, or no position: the plan from the runway.
  if (!aircraft || aircraft.distanceNm >= planned.todNm) {
    return { climbFrom: undefined, reachedTocNm: undefined }
  }
  if (aircraft.altitudeFt >= topFt - CRUISE_REACHED_FT) {
    return {
      climbFrom: { distanceNm: aircraft.distanceNm, altitudeFt: topFt },
      reachedTocNm: aircraft.distanceNm,
    }
  }
  return { climbFrom: aircraft, reachedTocNm: undefined }
}
