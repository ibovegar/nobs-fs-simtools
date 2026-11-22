// The takeoff summary as ready-to-show readouts: the V-speeds, the flap with the lever's
// state, and trim (or the runway needed when the profile has no trim figures).
import { formatInteger, formatTrim } from './format'
import { FT_PER_M } from './takeoffMath'
import type {
  AircraftProfile,
  FlapSetting,
  TakeoffConditions,
  TakeoffResult,
  TakeoffSpeeds,
} from './types'

export interface SpeedSummary {
  key: 'v1' | 'vr' | 'v2'
  label: string
  /** Knots, or '—' when the weight makes no sense. */
  value: string
  help: string
  /** The "?" button's name, when "What is <label>?" doesn't read. */
  helpLabel?: string
}

export interface SummaryValue {
  label: string
  value: string
  unit?: string
  caption?: string
}

export interface FlapSummary {
  value: string
  /** Whether the sim's lever is in the recommended detent; undefined when unknown. */
  lever?: { set: boolean; text: string }
}

export interface TakeoffSummaryModel {
  /** V1, VR, V2; a single has no V1, and the speed at 50 ft in place of V2. */
  speeds: readonly SpeedSummary[]
  flaps: FlapSummary
  /** Trim from the CG, or (without trim figures) the runway needed. */
  trimOrRunway: SummaryValue
}

export interface TakeoffSummaryInput {
  profile: AircraftProfile
  result: TakeoffResult
  conditions: TakeoffConditions
  /** The flap detent the sim's lever is in; undefined when unknown or not a takeoff detent. */
  leverFlap: FlapSetting | undefined
  leverKnown: boolean
}

function speedSummaries(
  speeds: TakeoffSpeeds,
  single: boolean,
  implausible: boolean,
): SpeedSummary[] {
  const kt = (v: number | undefined) => (implausible || v === undefined ? '—' : String(v))
  const vr: SpeedSummary = {
    key: 'vr',
    label: 'VR',
    value: kt(speeds.vr),
    help: 'Rotation speed: at this speed, raise the nose to lift off.',
  }
  if (single) {
    return [
      vr,
      {
        key: 'v2',
        label: '50 ft',
        value: kt(speeds.v2),
        help: 'The speed to have as you pass 50 ft above the runway. Hold it in the first part of the climb, until you are clear of obstacles.',
        helpLabel: 'What is the 50 ft speed?',
      },
    ]
  }
  return [
    {
      key: 'v1',
      label: 'V1',
      value: kt(speeds.v1),
      help: 'Decision speed: before it, stop if something goes wrong; from it on, the takeoff continues, even with an engine failure.',
    },
    vr,
    {
      key: 'v2',
      label: 'V2',
      value: kt(speeds.v2),
      help: 'Takeoff safety speed: the speed to climb at, by 35 ft above the runway, if an engine fails. Hold at least V2 until clear of obstacles.',
    },
  ]
}

function leverState(flap: FlapSetting, leverFlap: FlapSetting | undefined, leverKnown: boolean) {
  if (!leverKnown) return undefined
  if (leverFlap?.id === flap.id) return { set: true, text: 'Lever set' }
  return { set: false, text: leverFlap ? `Lever at ${leverFlap.label}` : 'Lever not set' }
}

function trimOrRunway(
  profile: AircraftProfile,
  result: TakeoffResult,
  conditions: TakeoffConditions,
  implausible: boolean,
): SummaryValue {
  if (result.trim !== undefined && profile.trim.kind === 'computed') {
    return {
      label: 'Trim',
      value: formatTrim(result.trim),
      unit: profile.trim.unit,
      caption: `CG ${conditions.cgPercentMac.toFixed(1)} % MAC`,
    }
  }
  return {
    label: 'Runway needed',
    value: implausible ? '—' : formatInteger(result.requiredRunwayM),
    unit: 'm',
    caption: implausible
      ? undefined
      : `estimate, ${formatInteger(result.requiredRunwayM * FT_PER_M)} ft`,
  }
}

/** What the takeoff summary shows. */
export function takeoffSummary(input: TakeoffSummaryInput): TakeoffSummaryModel {
  const { profile, result, conditions, leverFlap, leverKnown } = input
  const implausible = result.warnings.includes('weight-implausible')
  return {
    speeds: speedSummaries(result.speeds, profile.engines === 'single', implausible),
    flaps: { value: result.flap.label, lever: leverState(result.flap, leverFlap, leverKnown) },
    trimOrRunway: trimOrRunway(profile, result, conditions, implausible),
  }
}
