// Every aircraft SimTools recognises in the sim. Pages key their own per-aircraft data
// (e.g. Planning's takeoff profiles) by `id`. To add an aircraft, list it here and give it
// data where it's needed: see docs/takeoff-profiles.md.
import type { AircraftPerformance } from './performance'

/** An aircraft SimTools can recognise from the sim's TITLE and ATC MODEL. */
export interface Aircraft {
  /** Stable id. Pages key their per-aircraft data by it. */
  id: string
  /** Full name ('Boeing 737-600'). */
  name: string
  /** Short name for headings and badges ('737-600'). */
  shortName: string
  /** Matched against the sim's TITLE and ATC MODEL to recognise the aircraft. */
  match: RegExp
  /** Climb, cruise, descent and approach figures; without them, pages use generic ones. */
  performance?: AircraftPerformance
}

const LB = 1 / 2.204_622_6

/**
 * Black Square Caravan Professional manual, Engine Power Settings (without cargo pod),
 * Standard Day: climb at 115 KIAS, normal cruise ≈ 164 KTAS (4,000–16,000 ft), descent at
 * 140 KIAS and −800 fpm. Max landing weight 8,500 lb. The manual gives no approach speed:
 * 78 KIAS with full flaps at max landing weight, from the Cessna 208B handbook.
 */
const CARAVAN_PERFORMANCE: AircraftPerformance = {
  climb: {
    speedKias: 115,
    table: [
      { altitudeFt: 4000, timeMin: 4, distanceNm: 9 },
      { altitudeFt: 8000, timeMin: 9, distanceNm: 18 },
      { altitudeFt: 12_000, timeMin: 15, distanceNm: 32 },
      { altitudeFt: 16_000, timeMin: 24, distanceNm: 48 },
      { altitudeFt: 20_000, timeMin: 33, distanceNm: 65 },
      { altitudeFt: 24_000, timeMin: 52, distanceNm: 107 },
    ],
  },
  cruise: { speedKtas: 164 },
  descent: {
    speedKias: 140,
    rateFpm: 800,
    table: [
      { altitudeFt: 4000, timeMin: 5, distanceNm: 14 },
      { altitudeFt: 8000, timeMin: 10, distanceNm: 28 },
      { altitudeFt: 12_000, timeMin: 15, distanceNm: 43 },
      { altitudeFt: 16_000, timeMin: 20, distanceNm: 59 },
      { altitudeFt: 20_000, timeMin: 25, distanceNm: 75 },
      { altitudeFt: 24_000, timeMin: 30, distanceNm: 91 },
    ],
  },
  approach: { speedKias: 78, atWeightKg: 8500 * LB },
}

/**
 * Black Square TBM 850 manual, Engine Power Settings, Standard Day: climb at 130 KIAS,
 * normal cruise ≈ 300 KTAS (270 at 10,000 ft, 312 at 25,000 ft), descent at 230 KIAS and
 * −2,000 fpm. Max landing weight 7,024 lb. The manual gives no approach speed: 85 KIAS
 * with landing flaps at max landing weight (≈ 1.3 × Vso 65 kt).
 */
const TBM850_PERFORMANCE: AircraftPerformance = {
  climb: {
    speedKias: 130,
    table: [
      { altitudeFt: 5000, timeMin: 1, distanceNm: 5 },
      { altitudeFt: 10_000, timeMin: 5, distanceNm: 12 },
      { altitudeFt: 15_000, timeMin: 8, distanceNm: 20 },
      { altitudeFt: 20_000, timeMin: 11, distanceNm: 28 },
      { altitudeFt: 25_000, timeMin: 14, distanceNm: 37 },
      { altitudeFt: 30_000, timeMin: 19, distanceNm: 53 },
    ],
  },
  cruise: { speedKtas: 300 },
  descent: {
    speedKias: 230,
    rateFpm: 2000,
    table: [
      { altitudeFt: 5000, timeMin: 1, distanceNm: 6 },
      { altitudeFt: 10_000, timeMin: 5, distanceNm: 21 },
      { altitudeFt: 15_000, timeMin: 8, distanceNm: 32 },
      { altitudeFt: 20_000, timeMin: 10, distanceNm: 44 },
      { altitudeFt: 25_000, timeMin: 13, distanceNm: 58 },
      { altitudeFt: 30_000, timeMin: 15, distanceNm: 72 },
    ],
  },
  approach: { speedKias: 85, atWeightKg: 7024 * LB },
}

/**
 * Detection tries these in order against the sim's TITLE and ATC MODEL, so put more
 * specific patterns first.
 */
export const AIRCRAFT: readonly Aircraft[] = [
  {
    // Also Black Square's Caravan Professional.
    id: 'c208b',
    name: 'Cessna 208B Grand Caravan',
    shortName: 'Caravan 208B',
    match: /grand\s?caravan|\b208\s?B\b|\bC208\b|caravan/i,
    performance: CARAVAN_PERFORMANCE,
  },
  {
    // Black Square's TBM 850 reports ATC MODEL as a plain "850"; the ICAO type is TBM8.
    id: 'tbm-850',
    name: 'Socata TBM 850',
    shortName: 'TBM 850',
    match: /\bTBM[\s-]?850\b|\bTBM8\b|\b850\b/i,
    performance: TBM850_PERFORMANCE,
  },
  {
    id: 'kingair-350',
    name: 'King Air 350',
    shortName: 'King Air 350',
    match: /king\s?air[\s-]*350|\bB350\b|\b350i\b|king\s?air\s?B300|\bB300\b/i,
  },
  {
    id: 'dash8-100',
    name: 'Dash 8-100',
    shortName: 'Dash 8-100',
    match: /\bQ100\b|dash[\s-]?8[\s-]?(q)?1\d\d|\bDH8A\b|DHC-?8-?1\d\d/i,
  },
  {
    id: 'dash8-200',
    name: 'Dash 8-200',
    shortName: 'Dash 8-200',
    match: /\bQ200\b|dash[\s-]?8[\s-]?(q)?2\d\d|\bDH8B\b|DHC-?8-?2\d\d/i,
  },
  {
    id: 'dash8-300',
    name: 'Dash 8-300',
    shortName: 'Dash 8-300',
    match: /\bQ300\b|dash[\s-]?8[\s-]?(q)?3\d\d|\bDH8C\b|DHC-?8-?3\d\d/i,
  },
  {
    id: 'dash8-q400',
    name: 'Dash 8-400 (Q400)',
    shortName: 'Q400',
    match: /\bQ400\b|dash[\s-]?8[\s-]?(q)?4\d\d|\bDH8D\b|DHC-?8-?4\d\d/i,
  },
  {
    id: 'b737-400',
    name: 'Boeing 737-400',
    shortName: '737-400',
    match: /737[\s-]?4\d\d|\bB734\b/i,
  },
  {
    id: 'b737-600',
    name: 'Boeing 737-600',
    shortName: '737-600',
    match: /737[\s-]?6\d\d|\bB736\b/i,
  },
]

/**
 * The aircraft whose `match` fits any of the given sim names (TITLE, ATC MODEL), or
 * undefined.
 */
export function detectAircraft(
  aircraft: readonly Aircraft[],
  ...names: (string | undefined)[]
): Aircraft | undefined {
  // The sim often reports ATC MODEL as a localisation key, "TT:ATCCOM.AC_MODEL_B736.0.text":
  // turn its separators into spaces so word-boundary patterns (\bB736\b) match.
  const text = names.filter(Boolean).join(' ').replace(/[_.:]/g, ' ')
  if (!text.trim()) return undefined
  return aircraft.find((a) => a.match.test(text))
}
