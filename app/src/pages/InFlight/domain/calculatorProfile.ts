// The TOD calculator's descent as a side view, for the Flight plan tab when there is no
// flight plan. Pure and unit-tested.
//
// The calculator's distance is the descent at the glideslope plus the level-off distance the
// pilot keeps (topOfDescent.ts). Drawn as: level at the start altitude, TOD, the descent,
// then any level flight at the end altitude up to the target.

import type { ChartWaypoint } from './profileChart'
import type { TopOfDescentFields } from './topOfDescent'
import { type PlannedWaypoint, planWaypoints, type VerticalProfile } from './verticalProfile'

export interface CalculatorProfile {
  profile: VerticalProfile
  waypoints: PlannedWaypoint<ChartWaypoint>[]
}

/** Level flight shown before TOD, for context: a quarter of the distance, at least 10 nm. */
const leadNm = (distanceNm: number) => Math.max(10, distanceNm * 0.25)

export function calculatorProfile(
  fields: TopOfDescentFields,
  distanceNm: number,
): CalculatorProfile {
  const startFt = fields.startAltitude
  const endFt = fields.endAltitude
  const levelOffNm = Math.max(0, Math.min(distanceNm, fields.levelOffNm))
  const todNm = leadNm(distanceNm)
  const levelNm = todNm + distanceNm - levelOffNm
  const totalNm = todNm + distanceNm

  const profile: VerticalProfile = {
    points: [
      { distanceNm: 0, altitudeFt: startFt },
      { distanceNm: todNm, altitudeFt: startFt },
      { distanceNm: levelNm, altitudeFt: endFt },
      { distanceNm: totalNm, altitudeFt: endFt },
    ],
    tocNm: 0,
    todNm,
    topFt: startFt,
    reachesCruise: true,
    totalNm,
  }

  const waypoints: ChartWaypoint[] = [
    { key: 'start', ident: '', distanceNm: 0, phase: 'enroute' },
    ...(levelOffNm > 0
      ? [{ key: 'level', ident: 'LEVEL', distanceNm: levelNm, phase: 'approach' as const }]
      : []),
    { key: 'target', ident: 'TARGET', distanceNm: totalNm, phase: 'approach' },
  ]

  return { profile, waypoints: planWaypoints(waypoints, profile) }
}
