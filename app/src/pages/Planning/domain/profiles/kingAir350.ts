// Beechcraft King Air 350 (B300).
//
// No public POH table. Anchors at 15,000 lb (MTOW):
//  - Flaps UP: V1 106 / VR 110–111 / V2 117 (AOPA flight test at 14,820 lb: 106/110/117;
//    MSFS flight notes at 15,000 lb ISA: ~105/110/117).
//  - Flaps APPROACH: V1 104 / VR 105 / V2 109 (King Air Magazine performance example,
//    15,000 lb).
// Lighter weights scale by √(weight), with minimum speeds from VMCA (94 KIAS): V1 ≥ 92,
// VR ≥ 96, V2 ≥ 104 (≈ 1.1 VMCA). Field lengths: accelerate-stop ≈ 4,800 ft flaps up
// (AOPA, balanced field 4,680 ft at 14,820 lb), approach ≈ 83 % of that.
import { pointsFromPounds } from '../takeoffMath'
import type { AircraftProfile } from '../types'

export const kingAir350: AircraftProfile = {
  id: 'kingair-350',
  engines: 'multi',
  maxTakeoffWeightKg: 15_000 / 2.204_622_6,
  weightUnit: 'lb',
  defaultFlapId: 'up',
  flaps: [
    {
      id: 'up',
      label: 'Up',
      angleDeg: 0,
      handleIndex: 0,
      fieldLengthM: 1460,
      minV1: 92,
      minVr: 96,
      minV2: 104,
      speeds: {
        kind: 'weight-table',
        points: pointsFromPounds([{ weightLb: 15_000, v1: 106, vr: 111, v2: 117 }]),
      },
    },
    {
      id: 'approach',
      label: 'Approach',
      angleDeg: 14,
      handleIndex: 1,
      fieldLengthM: 1220,
      minV1: 92,
      minVr: 96,
      minV2: 104,
      speeds: {
        kind: 'weight-table',
        points: pointsFromPounds([{ weightLb: 15_000, v1: 104, vr: 105, v2: 109 }]),
      },
    },
  ],
  trim: {
    kind: 'advice',
    text: 'Elevator trim: set in the white T.O. range; rudder trim neutral.',
  },
  notes: [
    'Flaps up is the standard takeoff; approach flaps for a shorter runway.',
    'Speeds from a few published points scaled by weight: approximate.',
  ],
  sources: [
    'AOPA "The ultimate King Air" flight test (V-speeds at 14,820 lb)',
    'King Air Magazine "Using Big Numbers" (350, approach flaps, 15,000 lb)',
  ],
}
