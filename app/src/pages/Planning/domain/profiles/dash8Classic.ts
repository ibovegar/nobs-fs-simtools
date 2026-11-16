// De Havilland Dash 8-100, -200 and -300.
//
// No public speed tables, so the speeds are DERIVED: takeoff speeds scale with
// √(wing loading), and the Q400 card's heavy rows (24–29 t, where no minimum-control
// limit applies) give VR and V2 per flap as k·√(equivalent Q400 weight in tonnes). The
// equivalent weight is the Dash 8's weight × (Q400 wing area / its wing area).
// Check: a Dash 8-100 near MTOW (15.6 t, flaps 15) gives VR 93 / V2 95 kt; Flight
// International's flight test of a near-MTOW Dash 8 quotes V1/VR 93, V2 96 kt.
// Minimum speeds (VMCG/VMCA limits) are estimates per variant.
//
// Field lengths: published takeoff field lengths at MTOW, flaps estimated around them.
import type { AircraftProfile, FlapSetting, SpeedPoint } from '../types'

const Q400_WING_M2 = 63.08

/** VR and V2 coefficients per flap: V = k · √(tonnes), from the Q400 heavy rows. */
const K = {
  '5': { vr: 24.4, v2: 24.95 },
  '10': { vr: 22.6, v2: 23.1 },
  '15': { vr: 21.85, v2: 22.25 },
} as const

type FlapId = keyof typeof K

/** Speed points every 1,000 kg from `minKg` to `maxKg` (V1 = VR). */
function derivedPoints(flap: FlapId, wingM2: number, minKg: number, maxKg: number): SpeedPoint[] {
  const points: SpeedPoint[] = []
  for (let w = minKg; w <= maxKg + 999; w += 1000) {
    const weightKg = Math.min(w, maxKg)
    const tonnes = (weightKg / 1000) * (Q400_WING_M2 / wingM2)
    const vr = Math.round(K[flap].vr * Math.sqrt(tonnes))
    points.push({ weightKg, v1: vr, vr, v2: Math.round(K[flap].v2 * Math.sqrt(tonnes)) })
    if (weightKg === maxKg) break
  }
  return points
}

interface Variant {
  wingM2: number
  minKg: number
  mtowKg: number
  minVr: number
  minV2: number
  /** Field length (m) at MTOW per flap. */
  fields: Partial<Record<FlapId, number>>
}

/** Classic Dash 8 flap lever detents: 0 5 10 15 35 (the -100/-200 have no 10). */
const HANDLE_INDEX: Record<FlapId, number> = { '5': 1, '10': 2, '15': 3 }

function flapsFor(v: Variant): FlapSetting[] {
  return (Object.keys(v.fields) as FlapId[]).map((id) => ({
    id,
    label: id,
    handleIndex: HANDLE_INDEX[id],
    fieldLengthM: v.fields[id] ?? 0,
    minV1: v.minVr,
    minVr: v.minVr,
    minV2: v.minV2,
    speeds: { kind: 'weight-table', points: derivedPoints(id, v.wingM2, v.minKg, v.mtowKg) },
  }))
}

const TRIM_ADVICE =
  'Elevator trim: set within the green takeoff band, toward nose-up for a forward CG.'

const NOTES = [
  'Speeds derived from Q400 data by wing loading, not from the AFM: approximate.',
  'V1 = VR.',
]

const SOURCES = [
  'Majestic MJC8 Q400 Takeoff Speeds Card (scaled by wing loading)',
  'Flight International Dash 8 flight test (V1/VR 93, V2 96 kt near MTOW, flaps 15)',
]

const DASH8_100: Variant = {
  wingM2: 54.35,
  minKg: 11_000,
  mtowKg: 15_649,
  minVr: 88,
  minV2: 92,
  fields: { '5': 1000, '15': 910 },
}

const DASH8_200: Variant = {
  wingM2: 54.35,
  minKg: 11_000,
  mtowKg: 16_466,
  minVr: 90,
  minV2: 95,
  fields: { '5': 1100, '15': 1000 },
}

const DASH8_300: Variant = {
  wingM2: 56.21,
  minKg: 12_000,
  mtowKg: 19_505,
  minVr: 92,
  minV2: 97,
  fields: { '5': 1300, '10': 1180, '15': 1100 },
}

export const dash8_100: AircraftProfile = {
  id: 'dash8-100',
  engines: 'multi',
  maxTakeoffWeightKg: DASH8_100.mtowKg,
  weightUnit: 'kg',
  defaultFlapId: '5',
  flaps: flapsFor(DASH8_100),
  trim: { kind: 'advice', text: TRIM_ADVICE },
  notes: ['Flaps 5 is normal; flaps 15 for short runways.', ...NOTES],
  sources: SOURCES,
}

export const dash8_200: AircraftProfile = {
  id: 'dash8-200',
  engines: 'multi',
  maxTakeoffWeightKg: DASH8_200.mtowKg,
  weightUnit: 'kg',
  defaultFlapId: '5',
  flaps: flapsFor(DASH8_200),
  trim: { kind: 'advice', text: TRIM_ADVICE },
  notes: ['Flaps 5 is normal; flaps 15 for short runways.', ...NOTES],
  sources: SOURCES,
}

export const dash8_300: AircraftProfile = {
  id: 'dash8-300',
  engines: 'multi',
  maxTakeoffWeightKg: DASH8_300.mtowKg,
  weightUnit: 'kg',
  defaultFlapId: '10',
  flaps: flapsFor(DASH8_300),
  trim: { kind: 'advice', text: TRIM_ADVICE },
  notes: ['Flaps 10 is common; 5 for long runways, 15 for short ones.', ...NOTES],
  sources: SOURCES,
}
