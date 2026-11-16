// Socata TBM 850 (Black Square's TBM 850 for MSFS).
//
// Single engine: no V1/V2. The speeds are rotation (VR) and the speed at 50 ft. Black
// Square's manual (V-speeds, "Aircraft Performance") gives VR 85 KIAS and VX 95 KIAS, with a
// max takeoff weight of 7,394 lb; the TBM rotates at a fixed speed, so lighter weights keep
// 85 / 95 (minVr / minV2) and only an overweight aircraft scales up. Flaps TO (10°) for
// every takeoff. Takeoff over 50 ft at MTOW, sea level, ISA ≈ 2,840 ft (Plane & Pilot spec).
//
// Black Square sets ATC MODEL to "850"; the ICAO type is TBM8.
import { pointsFromPounds } from '../takeoffMath'
import type { AircraftProfile } from '../types'

export const tbm850: AircraftProfile = {
  id: 'tbm-850',
  engines: 'single',
  maxTakeoffWeightKg: 7394 / 2.204_622_6,
  weightUnit: 'lb',
  defaultFlapId: 'to',
  flaps: [
    {
      id: 'to',
      label: 'TO',
      angleDeg: 10,
      handleIndex: 1,
      fieldLengthM: 866,
      minVr: 85,
      minV2: 95,
      speeds: {
        kind: 'weight-table',
        points: pointsFromPounds([{ weightLb: 7394, vr: 85, v2: 95 }]),
      },
    },
  ],
  trim: {
    kind: 'advice',
    text: 'Pitch, rudder and aileron trim: set to the green takeoff marks.',
  },
  notes: [
    'Flaps TO for every takeoff; takeoff torque 100 % (850 mode after the climb starts).',
    'Climb at VX 95 KIAS over obstacles, then VY ≈ 123 KIAS.',
  ],
  sources: [
    'Black Square TBM 850 manual: V-speeds and limitations (Just Flight)',
    'Plane & Pilot TBM 850 specifications (takeoff over 50 ft, 2,840 ft)',
  ],
}
