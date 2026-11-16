// Every aircraft SimTools recognises in the sim. Pages key their own per-aircraft data
// (e.g. Planning's takeoff profiles) by `id`. To add an aircraft, list it here and give it
// data where it's needed: see docs/takeoff-profiles.md.

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
  },
  {
    // Black Square's TBM 850 reports ATC MODEL as a plain "850"; the ICAO type is TBM8.
    id: 'tbm-850',
    name: 'Socata TBM 850',
    shortName: 'TBM 850',
    match: /\bTBM[\s-]?850\b|\bTBM8\b|\b850\b/i,
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
