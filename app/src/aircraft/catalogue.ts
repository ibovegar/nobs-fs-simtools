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
 * Standard Day: climb at 115 KIAS (torque from the climb table, 1,900 RPM, ITT 765 °C max
 * in the climb, from the limitations), normal cruise ≈ 164 KTAS (4,000–16,000 ft), descent at
 * 140 KIAS and −800 fpm. Max landing weight 8,500 lb. The manual gives no approach speed:
 * 78 KIAS with full flaps at max landing weight, from the Cessna 208B handbook.
 */
const CARAVAN_PERFORMANCE: AircraftPerformance = {
  climb: {
    speedKias: 115,
    power: {
      torqueUnit: 'ft-lb',
      torque: [
        { altitudeFt: 4000, torque: 1865 },
        { altitudeFt: 8000, torque: 1780 },
        { altitudeFt: 12_000, torque: 1600 },
        { altitudeFt: 16_000, torque: 1550 },
        { altitudeFt: 20_000, torque: 1350 },
        { altitudeFt: 24_000, torque: 1060 },
      ],
      propRpm: 1900,
      ittLimitC: 765,
    },
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
 * Black Square TBM 850 manual, Engine Power Settings, Standard Day: climb at 130 KIAS
 * ("850 mode" torque from the climb table, 2,000 RPM, ITT 840 °C max in climb / cruise),
 * normal cruise ≈ 300 KTAS (270 at 10,000 ft, 312 at 25,000 ft), descent at 230 KIAS and
 * −2,000 fpm. Max landing weight 7,024 lb. The manual gives no approach speed: 85 KIAS
 * with landing flaps at max landing weight (≈ 1.3 × Vso 65 kt).
 */
const TBM850_PERFORMANCE: AircraftPerformance = {
  climb: {
    speedKias: 130,
    power: {
      torqueUnit: '%',
      torque: [
        { altitudeFt: 5000, torque: 121 },
        { altitudeFt: 10_000, torque: 121 },
        { altitudeFt: 15_000, torque: 121 },
        { altitudeFt: 20_000, torque: 121 },
        { altitudeFt: 25_000, torque: 120 },
        { altitudeFt: 30_000, torque: 105 },
      ],
      propRpm: 2000,
      ittLimitC: 840,
    },
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
 * King Air 350i (MSFS default), simulator checklist (aviation.allanville.com, "only for
 * flight simulator use"): cruise climb 170 KIAS to 10,000 ft, then 10 kt less per 5,000 ft
 * down to 120 KIAS at 35,000 ft; climb limits 100 % torque, ITT 785 °C, prop 1,600 RPM
 * recommended. Max cruise 217 KIAS at FL240 (≈ 312 KTAS ISA); normal cruise 5 % torque less,
 * ≈ 300 KTAS. Descent M0.58 / 250 KIAS at about 1,500 fpm. Vref 109 KIAS at 15,000 lb
 * (flightchecklist.app MSFS 2024 quick reference). No climb / descent tables.
 */
const KINGAIR350_PERFORMANCE: AircraftPerformance = {
  climb: {
    speedKias: 170,
    schedule: [
      { upToFt: 10_000, speedKias: 170 },
      { upToFt: 15_000, speedKias: 160 },
      { upToFt: 20_000, speedKias: 150 },
      { upToFt: 25_000, speedKias: 140 },
      { upToFt: 30_000, speedKias: 130 },
      { upToFt: 35_000, speedKias: 120 },
    ],
    power: {
      torqueUnit: '%',
      torque: [{ altitudeFt: 0, torque: 100 }],
      propRpm: 1600,
      ittLimitC: 785,
    },
  },
  cruise: { speedKtas: 300 },
  descent: { speedKias: 250, rateFpm: 1500 },
  approach: { speedKias: 109, atWeightKg: 15_000 * LB },
}

/**
 * Dash 8 Q400, Majestic MJC8 Q400 Performance Manual: Type II climb 185 KIAS to 20,000 ft,
 * then 5 kt less per 1,000 ft to 160 KIAS at 25,000 ft; climb power at 900 RPM: 90.7 %
 * torque up to about 16,000 ft, then the ISA column (76 % at 18,000, 72 % at 20,000, 67 % at
 * 22,000, 60 % at 25,000); FADEC manages the ITT. High-speed cruise ≈ 230–240 KIAS at FL250
 * (≈ 340 KTAS ISA). Vref 121 KIAS with flaps 35 at 62,000 lb (max landing weight, ice
 * protection level 1). Descent at 250 KIAS or less and 1,500 fpm (Chuck's Majestic Q400
 * guide, VNAV descent). No climb / descent tables.
 */
const Q400_PERFORMANCE: AircraftPerformance = {
  climb: {
    speedKias: 185,
    schedule: [
      { upToFt: 20_000, speedKias: 185 },
      { upToFt: 21_000, speedKias: 180 },
      { upToFt: 22_000, speedKias: 175 },
      { upToFt: 23_000, speedKias: 170 },
      { upToFt: 24_000, speedKias: 165 },
      { upToFt: 25_000, speedKias: 160 },
    ],
    power: {
      torqueUnit: '%',
      torque: [
        { altitudeFt: 0, torque: 90.7 },
        { altitudeFt: 16_000, torque: 90.7 },
        { altitudeFt: 18_000, torque: 76 },
        { altitudeFt: 20_000, torque: 72 },
        { altitudeFt: 22_000, torque: 67 },
        { altitudeFt: 25_000, torque: 60 },
      ],
      propRpm: 900,
    },
  },
  cruise: { speedKtas: 340 },
  descent: { speedKias: 250, rateFpm: 1500 },
  approach: { speedKias: 121, atWeightKg: 62_000 * LB, flaps: '35' },
}

/**
 * Dash 8-100: a company climb option of 160 KIAS with 90 % torque and 1,050 RPM (NTSB
 * report on N1K, aerossurance.com); typical cruise 265 KTAS (Aircraft Commerce owner's
 * guide). Vref with flaps 35: 83 kt at 12 t to 95 kt at 16.5 t (PPRuNe, -100/-200).
 */
const DASH8_100_PERFORMANCE: AircraftPerformance = {
  climb: {
    speedKias: 160,
    power: { torqueUnit: '%', torque: [{ altitudeFt: 0, torque: 90 }], propRpm: 1050 },
  },
  cruise: { speedKtas: 265 },
  approach: { speedKias: 95, atWeightKg: 16_500, flaps: '35' },
}

/** Dash 8-200: only the -100/-200 Vref with flaps 35 (PPRuNe): 95 kt at 16.5 t. */
const DASH8_200_PERFORMANCE: AircraftPerformance = {
  approach: { speedKias: 95, atWeightKg: 16_500, flaps: '35' },
}

/** Dash 8-300: only its Vref with flaps 15 (PPRuNe): 93 kt at 14 t to 111 kt at 19.5 t. */
const DASH8_300_PERFORMANCE: AircraftPerformance = {
  approach: { speedKias: 111, atWeightKg: 19_500, flaps: '15' },
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
    performance: KINGAIR350_PERFORMANCE,
  },
  {
    id: 'dash8-100',
    name: 'Dash 8-100',
    shortName: 'Dash 8-100',
    match: /\bQ100\b|dash[\s-]?8[\s-]?(q)?1\d\d|\bDH8A\b|DHC-?8-?1\d\d/i,
    performance: DASH8_100_PERFORMANCE,
  },
  {
    id: 'dash8-200',
    name: 'Dash 8-200',
    shortName: 'Dash 8-200',
    match: /\bQ200\b|dash[\s-]?8[\s-]?(q)?2\d\d|\bDH8B\b|DHC-?8-?2\d\d/i,
    performance: DASH8_200_PERFORMANCE,
  },
  {
    id: 'dash8-300',
    name: 'Dash 8-300',
    shortName: 'Dash 8-300',
    match: /\bQ300\b|dash[\s-]?8[\s-]?(q)?3\d\d|\bDH8C\b|DHC-?8-?3\d\d/i,
    performance: DASH8_300_PERFORMANCE,
  },
  {
    id: 'dash8-q400',
    name: 'Dash 8-400 (Q400)',
    shortName: 'Q400',
    match: /\bQ400\b|dash[\s-]?8[\s-]?(q)?4\d\d|\bDH8D\b|DHC-?8-?4\d\d/i,
    performance: Q400_PERFORMANCE,
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
