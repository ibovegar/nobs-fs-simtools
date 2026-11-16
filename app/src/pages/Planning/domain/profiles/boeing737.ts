// Boeing 737-400 (Classic) and 737-600 (NG).
//
// 737-600: the 737-700 takeoff speed table (CFM56-7B20, max takeoff thrust, weight in
// 1000 kg) from "Boeing 737-700 Performance and Selected Limitations" (M. Zagoren, for
// simulator use). The -600 has the same wing and flaps as the -700, so speeds at the
// same weight are the same. Flaps 10 / 15 rows are only given from 40 to 64 t.
//
// 737-400: two published flaps 5 points (20 °C, sea level: 52 t 132/135/146, 68 t
// 154/159/166, PPRuNe "737-400 flight operations"), interpolated, with flaps 15 derived
// from the -700's flaps 15 / flaps 5 ratio (≈0.90 for V1/VR, 0.91 for V2). The -400 is
// not certified for flaps 1 takeoffs.
//
// Both use the -700's "V1, VR, V2 Adjustments" (OAT × pressure altitude).
//
// Trim: no public stab trim table. A straight line through the published points (NG:
// 24 % MAC → 5.5 units, PMDG 737NG tutorial; 8 % MAC → 7.75 units, training handout;
// Classic: forward limit ≈ 6⅓ units, AMM). Check against the FMC's TAKEOFF REF.
import type { AircraftProfile, SpeedAdjustments, SpeedPoint } from '../types'

const ADJUSTMENTS: SpeedAdjustments = {
  tempsC: [-60, 20, 30, 40, 50, 60],
  altitudesFt: [-2000, 0, 2000, 4000, 6000, 8000],
  v1: [
    [0, 0, 0, 0, 2, 3],
    [0, 0, 0, 0, 2, 3],
    [0, 0, 1, 1, 3, 5],
    [1, 2, 2, 2, 4, 6],
    [3, 4, 4, 4, 5, 7],
    [4, 5, 5, 6, 7, 8],
  ],
  vr: [
    [0, 0, 0, 1, 2, 3],
    [0, 0, 0, 1, 2, 4],
    [0, 0, 1, 2, 3, 5],
    [1, 2, 2, 3, 4, 6],
    [3, 3, 4, 4, 5, 7],
    [4, 5, 5, 6, 7, 9],
  ],
  v2: [
    [0, 0, 0, 0, 1, 1],
    [0, 0, 0, 0, 1, 1],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, -1],
    [-1, -1, -1, -1, -1, -1],
  ],
}

/** Rows of [weight (1000 kg), V1, VR, V2]. */
const rows = (r: readonly (readonly [number, number, number, number])[]): SpeedPoint[] =>
  r.map(([t, v1, vr, v2]) => ({ weightKg: t * 1000, v1, vr, v2 }))

/** 737 Classic and NG flap lever detents: UP 1 2 5 10 15 25 30 40. */
const HANDLE = { '1': 1, '5': 3, '10': 4, '15': 5 } as const

/** Round the 737 trim to a quarter unit, the trim indicator's resolution. */
const TRIM_STEP = 0.25

/** Takeoff (green) bands on the 0–17 unit stab trim indicator, approximate. */
const NG_TRIM_BAND = [1, 8.5] as const
const CLASSIC_TRIM_BAND = [1, 6.5] as const

export const boeing737_600: AircraftProfile = {
  id: 'b737-600',
  engines: 'multi',
  maxTakeoffWeightKg: 65_544,
  weightUnit: 'kg',
  defaultFlapId: '5',
  flaps: [
    {
      id: '1',
      label: '1',
      handleIndex: HANDLE['1'],
      fieldLengthM: 2150,
      speeds: {
        kind: 'weight-table',
        adjustments: ADJUSTMENTS,
        points: rows([
          [40, 101, 102, 112],
          [44, 108, 109, 118],
          [48, 114, 115, 123],
          [52, 120, 121, 128],
          [56, 126, 127, 133],
          [60, 132, 133, 138],
          [64, 138, 138, 142],
          [68, 143, 143, 147],
          [72, 147, 147, 150],
        ]),
      },
    },
    {
      id: '5',
      label: '5',
      handleIndex: HANDLE['5'],
      fieldLengthM: 1950,
      speeds: {
        kind: 'weight-table',
        adjustments: ADJUSTMENTS,
        points: rows([
          [40, 99, 100, 110],
          [44, 105, 107, 115],
          [48, 112, 113, 120],
          [52, 118, 119, 125],
          [56, 123, 125, 130],
          [60, 129, 130, 135],
          [64, 134, 135, 139],
          [68, 139, 140, 143],
          [72, 144, 144, 147],
        ]),
      },
    },
    {
      id: '10',
      label: '10',
      handleIndex: HANDLE['10'],
      fieldLengthM: 1850,
      speeds: {
        kind: 'weight-table',
        adjustments: ADJUSTMENTS,
        points: rows([
          [40, 96, 97, 106],
          [44, 102, 102, 111],
          [48, 107, 108, 115],
          [52, 113, 113, 120],
          [56, 118, 118, 124],
          [60, 123, 124, 128],
          [64, 128, 128, 133],
        ]),
      },
    },
    {
      id: '15',
      label: '15',
      handleIndex: HANDLE['15'],
      fieldLengthM: 1800,
      speeds: {
        kind: 'weight-table',
        adjustments: ADJUSTMENTS,
        points: rows([
          [44, 94, 95, 105],
          [48, 100, 101, 109],
          [52, 106, 106, 114],
          [56, 111, 111, 118],
          [60, 116, 116, 122],
          [64, 121, 121, 126],
        ]),
      },
    },
  ],
  trim: {
    kind: 'computed',
    unit: 'units',
    step: TRIM_STEP,
    scale: [0, 17],
    band: NG_TRIM_BAND,
    compute: (cg) => Math.min(NG_TRIM_BAND[1], Math.max(NG_TRIM_BAND[0], 9 - 0.15 * cg)),
    note: 'Approximation from CG; the FMC TAKEOFF REF page gives the exact value.',
  },
  notes: [
    'Speeds: 737-700 table (same wing), max takeoff thrust, dry runway.',
    'Check V1 against V1(MCG) at light weights.',
  ],
  sources: [
    'Boeing 737-700 Performance and Selected Limitations, CFM56-7B20 (M. Zagoren, simulator use)',
    'PMDG 737NG tutorial (trim example), 737 training material (trim at 8 % MAC)',
  ],
}

export const boeing737_400: AircraftProfile = {
  id: 'b737-400',
  engines: 'multi',
  maxTakeoffWeightKg: 68_040,
  weightUnit: 'kg',
  defaultFlapId: '5',
  flaps: [
    {
      id: '5',
      label: '5',
      handleIndex: HANDLE['5'],
      fieldLengthM: 2540,
      speeds: {
        kind: 'weight-table',
        adjustments: ADJUSTMENTS,
        points: rows([
          [52, 132, 135, 146],
          [60, 143, 147, 156],
          [68, 154, 159, 166],
        ]),
      },
    },
    {
      id: '15',
      label: '15',
      handleIndex: HANDLE['15'],
      fieldLengthM: 2300,
      speeds: {
        kind: 'weight-table',
        adjustments: ADJUSTMENTS,
        points: rows([
          [52, 119, 122, 133],
          [60, 129, 132, 142],
          [68, 139, 143, 151],
        ]),
      },
    },
  ],
  trim: {
    kind: 'computed',
    unit: 'units',
    step: TRIM_STEP,
    scale: [0, 17],
    band: CLASSIC_TRIM_BAND,
    compute: (cg) =>
      Math.min(CLASSIC_TRIM_BAND[1], Math.max(CLASSIC_TRIM_BAND[0], 7.5 - 0.15 * cg)),
    note: 'Approximation from CG; set the green band value from your load sheet if you have one.',
  },
  notes: [
    'Flaps 5 is standard; flaps 15 for short or hot-and-high runways. No flaps 1 takeoff on the -400.',
    'Speeds from a few published points: treat as approximate.',
  ],
  sources: [
    'PPRuNe "737-400 flight operations" (flaps 5 V-speeds at 52 t and 68 t)',
    'Boeing 737-700 V1/VR/V2 adjustments and flaps 15 ratios (M. Zagoren, simulator use)',
    '737-300/400/500 AMM via PPRuNe (takeoff trim range)',
  ],
}
