// Aircraft the dev harness can "load" into the mock sim: what the sim reports as TITLE and
// ATC MODEL (the Planning page recognises the aircraft from these), plus a plausible
// takeoff weight, CG and flap lever so the plan makes sense straight away.

export interface MockAircraft {
  id: string
  /** Button label in the harness. */
  label: string
  /** The sim's TITLE ('' = the sim reports none). */
  title: string
  /** The sim's ATC MODEL: often a localisation key, sometimes a plain string. */
  atcModel: string
  totalWeightLb: number
  cgPercentMac: number
  flapHandleIndex: number
}

export const MOCK_AIRCRAFT = [
  {
    id: 'bksq-caravan',
    label: 'BKSQ Caravan',
    title: 'Black Square Caravan Professional',
    atcModel: 'TT:ATCCOM.AC_MODEL_C208.0.text',
    totalWeightLb: 8300,
    cgPercentMac: 25,
    flapHandleIndex: 2,
  },
  {
    id: 'bksq-tbm850',
    label: 'BKSQ TBM 850',
    title: 'Black Square TBM 850',
    // Black Square replaced the ATC MODEL key with a plain "850".
    atcModel: '850',
    totalWeightLb: 7100,
    cgPercentMac: 25,
    flapHandleIndex: 1,
  },
  {
    id: 'kingair-350',
    label: 'King Air 350',
    title: 'Beechcraft King Air 350i',
    atcModel: 'TT:ATCCOM.AC_MODEL_B350.0.text',
    totalWeightLb: 14_500,
    cgPercentMac: 20,
    flapHandleIndex: 0,
  },
  {
    id: 'q400',
    label: 'Q400',
    title: 'Dash 8 Q400',
    atcModel: 'TT:ATCCOM.AC_MODEL_DH8D.0.text',
    totalWeightLb: 60_000,
    cgPercentMac: 25,
    flapHandleIndex: 1,
  },
  {
    id: 'b737-600',
    label: '737-600',
    title: 'PMDG 737-600 House livery',
    atcModel: 'TT:ATCCOM.AC_MODEL_B736.0.text',
    totalWeightLb: 120_000,
    cgPercentMac: 22,
    flapHandleIndex: 3,
  },
  {
    // An aircraft SimTools has no data for.
    id: 'a320',
    label: 'A320 (none)',
    title: 'Airbus A320neo',
    atcModel: 'TT:ATCCOM.AC_MODEL_A20N.0.text',
    totalWeightLb: 150_000,
    cgPercentMac: 28,
    flapHandleIndex: 1,
  },
  {
    // The sim reports no aircraft.
    id: 'none',
    label: 'None',
    title: '',
    atcModel: '',
    totalWeightLb: 0,
    cgPercentMac: 0,
    flapHandleIndex: 0,
  },
] as const satisfies readonly MockAircraft[]

export type MockAircraftId = (typeof MOCK_AIRCRAFT)[number]['id']

/** The preset with this id; the first one for an unknown id. */
export function mockAircraft(id: string): MockAircraft {
  return MOCK_AIRCRAFT.find((a) => a.id === id) ?? MOCK_AIRCRAFT[0]
}
