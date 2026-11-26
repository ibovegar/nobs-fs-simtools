// The wind card: the wind at the aircraft (with its heading) or at an airport (from its
// METAR, with its runways), as a north-up graphic with the wind's figures at the arrow. Every bearing is true (the sim's wind and METARs are true).
// Pure.

import { type RunwayInput, type RunwayShape, runwayDiagram } from './runwayDiagram'

/** Below this the wind is calm: no direction to show. */
export const CALM_KT = 1

/** The runway diagram's radius in the graphic (px, unscaled): most of the compass ring. */
export const RUNWAY_DIAGRAM_R = 66

/** The wind's figures, at the arrow's tail (or under the compass without an arrow). */
export interface WindText {
  /** Where it blows from: '250°'; 'VRB', 'Calm'; '—' without a value. */
  direction: string
  /** '14 kt', '18G27 kt'; undefined when calm or unknown. */
  speed: string | undefined
}

export interface WindView {
  /** In the middle: the aircraft on its heading, or the airport's runways. */
  center: 'aircraft' | 'airport'
  /** The wind arrow (degrees from north, where it blows from); none without a direction. */
  arrowDeg: number | undefined
  /** How strong the wind is, 0–1 (full at 30 kt): the arrow's length. */
  strength: number | undefined
  windText: WindText
  /** The aircraft, turned to it; none without a heading (or at an airport). */
  headingDeg: number | undefined
  /** An airport's runways, to scale; none for the aircraft (or before they're loaded). */
  runways: readonly RunwayShape[]
}

/** The wind is drawn at full strength from this speed on. */
const FULL_STRENGTH_KT = 30

/** How strong the wind looks, 0–1: a light breeze short, 30 kt or more at full length. */
export function windStrength(kt: number): number {
  return Math.max(0.25, Math.min(1, kt / FULL_STRENGTH_KT))
}

const known = (v: number | undefined): v is number => v !== undefined && Number.isFinite(v)

/** A bearing as a pilot reads it: three digits, north as 360 ('360°', not '000°'). */
export function bearingText(deg: number): string {
  const whole = Math.round(((deg % 360) + 360) % 360)
  return `${String(whole === 0 ? 360 : whole).padStart(3, '0')}°`
}

const NO_WIND: WindText = { direction: '—', speed: undefined }
const CALM: WindText = { direction: 'Calm', speed: undefined }

/** The wind at the aircraft, with its heading. */
export function windView(
  windFromDeg: number | undefined,
  windKt: number | undefined,
  headingDeg: number | undefined,
): WindView {
  const heading = known(headingDeg) ? headingDeg : undefined
  const still = {
    center: 'aircraft' as const,
    headingDeg: heading,
    runways: [],
    arrowDeg: undefined,
    strength: undefined,
  }
  if (!known(windKt) || windKt < 0 || !known(windFromDeg)) return { ...still, windText: NO_WIND }
  if (windKt < CALM_KT) return { ...still, windText: CALM }
  return {
    ...still,
    arrowDeg: windFromDeg,
    strength: windStrength(windKt),
    windText: { direction: bearingText(windFromDeg), speed: `${Math.round(windKt)} kt` },
  }
}

/** The wind part of a METAR, as the sim reports it (speeds in `windSpeedUnits`). */
export interface MetarWind {
  hour: number
  min: number
  windDir?: number
  windSpeed?: number
  gust?: number
  /** -1 not given, 0 knots, 1 metres per second, 2 km/h. */
  windSpeedUnits: number
  vrb: boolean
}

/** An airport's METAR as the wind card follows it. */
export type MetarState =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'ready'; metar: MetarWind }

const KT_PER_UNIT: Record<number, number> = { 0: 1, 1: 1.943_844, 2: 0.539_957 }

/** A METAR speed in knots (a speed without a unit is taken as knots). */
export function metarKnots(speed: number, units: number): number {
  return speed * (KT_PER_UNIT[units] ?? 1)
}

/**
 * The wind at an airport, from its METAR, with its runways (the one to land on, with the
 * most headwind, marked).
 */
export function airportWindView(
  state: MetarState,
  runways: readonly RunwayInput[] = [],
  /** The flight plan's runway end at this airport ('19R'). */
  plannedRunway?: string,
): WindView {
  const still = {
    center: 'airport' as const,
    headingDeg: undefined,
    runways: runwayDiagram(runways, RUNWAY_DIAGRAM_R, undefined, plannedRunway),
    arrowDeg: undefined,
    strength: undefined,
  }
  if (state.status !== 'ready') return { ...still, windText: NO_WIND }
  const { metar } = state
  const kt =
    metar.windSpeed === undefined ? undefined : metarKnots(metar.windSpeed, metar.windSpeedUnits)
  if (kt === undefined) return { ...still, windText: NO_WIND }
  if (Math.round(kt) < CALM_KT) return { ...still, windText: CALM }

  const gust =
    metar.gust === undefined ? '' : `G${Math.round(metarKnots(metar.gust, metar.windSpeedUnits))}`
  const speed = `${Math.round(kt)}${gust} kt`
  const direction = metar.vrb || metar.windDir === undefined ? undefined : metar.windDir
  if (direction === undefined) {
    return { ...still, windText: { direction: 'VRB', speed } }
  }
  return {
    ...still,
    arrowDeg: direction,
    strength: windStrength(kt),
    windText: { direction: bearingText(direction), speed },
    runways: runwayDiagram(runways, RUNWAY_DIAGRAM_R, { fromDeg: direction, kt }, plannedRunway),
  }
}

/** A point on the compass: `radius` from its centre toward `bearingDeg` (y grows down). */
export function compassPoint(bearingDeg: number, radius: number): { x: number; y: number } {
  const rad = (bearingDeg * Math.PI) / 180
  return { x: Math.sin(rad) * radius, y: -Math.cos(rad) * radius }
}

const CARDINALS: Record<number, string> = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' }

/** The compass's labels every 30°: the cardinal letters, else the degrees ('30', '120'). */
export function compassLabel(deg: number): { text: string; cardinal: boolean } {
  const cardinal = CARDINALS[deg]
  return cardinal ? { text: cardinal, cardinal: true } : { text: String(deg), cardinal: false }
}
