// Cessna 208B Grand Caravan.
//
// Single engine: no V1/V2. The speeds are rotation (VR) and the speed at 50 ft, from the
// POH short-field takeoff table, flaps 20° (C. R. Burger's C208B checklist, 2003):
// 8,750 lb 70/83, 8,300 lb 67/80, 7,800 lb 64/76, 7,300 lb 61/73. Normal takeoff: rotate
// 70–75, climb 85–95 KIAS. Takeoff over 50 ft at MTOW, sea level, ISA ≈ 2,420 ft.
import { pointsFromPounds } from '../takeoffMath'
import type { AircraftProfile } from '../types'

export const caravan208B: AircraftProfile = {
  id: 'c208b',
  name: 'Cessna 208B Grand Caravan',
  shortName: 'Caravan 208B',
  match: /grand\s?caravan|\b208\s?B\b|\bC208\b|caravan/i,
  engines: 'single',
  maxTakeoffWeightKg: 8750 / 2.204_622_6,
  weightUnit: 'lb',
  defaultFlapId: '20',
  flaps: [
    {
      id: '20',
      label: '20°',
      handleIndex: 2,
      fieldLengthM: 740,
      speeds: {
        kind: 'weight-table',
        points: pointsFromPounds([
          { weightLb: 7300, vr: 61, v2: 73 },
          { weightLb: 7800, vr: 64, v2: 76 },
          { weightLb: 8300, vr: 67, v2: 80 },
          { weightLb: 8750, vr: 70, v2: 83 },
        ]),
      },
    },
  ],
  trim: {
    kind: 'advice',
    text: 'Elevator trim: set in the TAKEOFF range; rudder trim neutral.',
  },
  notes: [
    'Short-field speeds. Normal takeoff: rotate 70–75, climb 85–95 KIAS.',
    'Flaps 20° for every takeoff; retract to 10° above 85 KIAS.',
  ],
  sources: ['Cessna 208B checklist, short-field takeoff table (C. R. Burger, 2003)'],
}
