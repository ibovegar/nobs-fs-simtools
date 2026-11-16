import { describe, expect, it } from 'vitest'
import { formatRunway, formatTrim, formatWeight } from './format'
import {
  AIRCRAFT_PROFILES,
  boeing737_400,
  boeing737_600,
  caravan208B,
  dash8_100,
  dash8Q400,
  kingAir350,
} from './profiles'
import {
  densityRatio,
  LB_PER_KG,
  lookup2d,
  planTakeoff,
  recommendFlap,
  requiredRunwayM,
  takeoffSpeeds,
  takeoffTrim,
} from './takeoffMath'
import type { AircraftProfile, FlapSetting, TakeoffConditions } from './types'

const STD: TakeoffConditions = {
  weightKg: 60_000,
  cgPercentMac: 20,
  oatC: 15,
  pressureAltitudeFt: 0,
  runwayLengthM: 0,
  wetRunway: false,
}

const flap = (p: AircraftProfile, id: string): FlapSetting => {
  const f = p.flaps.find((x) => x.id === id)
  if (!f) throw new Error(`${p.id} has no flap ${id}`)
  return f
}

describe('lookup2d', () => {
  const table = [
    [0, 10],
    [20, 30],
  ]
  it('interpolates bilinearly and clamps outside', () => {
    expect(lookup2d(table, [0, 100], [0, 1000], 50, 500)).toBe(15)
    expect(lookup2d(table, [0, 100], [0, 1000], -50, -500)).toBe(0)
    expect(lookup2d(table, [0, 100], [0, 1000], 500, 5000)).toBe(30)
  })
})

describe('densityRatio', () => {
  it('is 1 at sea level ISA and drops with altitude and heat', () => {
    expect(densityRatio(0, 15)).toBeCloseTo(1, 3)
    expect(densityRatio(5000, 5)).toBeCloseTo(0.862, 2)
    expect(densityRatio(0, 40)).toBeLessThan(0.93)
  })
})

describe('737-600 (737-700 table)', () => {
  it('reproduces the table at reference conditions (20 °C, sea level)', () => {
    const c = { ...STD, oatC: 20 }
    expect(takeoffSpeeds(boeing737_600, flap(boeing737_600, '5'), c)).toEqual({
      v1: 129,
      vr: 130,
      v2: 135,
    })
    expect(
      takeoffSpeeds(boeing737_600, flap(boeing737_600, '1'), { ...c, weightKg: 52_000 }),
    ).toEqual({ v1: 120, vr: 121, v2: 128 })
  })

  it('interpolates between weights', () => {
    const s = takeoffSpeeds(boeing737_600, flap(boeing737_600, '5'), {
      ...STD,
      oatC: 20,
      weightKg: 62_000,
    })
    expect(s).toEqual({ v1: 132, vr: 133, v2: 137 })
  })

  it('adds the hot-and-high adjustments (40 °C, 4,000 ft)', () => {
    const s = takeoffSpeeds(boeing737_600, flap(boeing737_600, '5'), {
      ...STD,
      oatC: 40,
      pressureAltitudeFt: 4000,
    })
    expect(s).toEqual({ v1: 131, vr: 133, v2: 135 })
  })

  it('computes trim from CG and rounds to a quarter unit', () => {
    const f = flap(boeing737_600, '5')
    expect(takeoffTrim(boeing737_600, f, { ...STD, cgPercentMac: 24 })).toBe(5.5)
    expect(takeoffTrim(boeing737_600, f, { ...STD, cgPercentMac: 8 })).toBe(7.75)
  })
})

describe('737-400', () => {
  it('reproduces the published flaps 5 points', () => {
    const f = flap(boeing737_400, '5')
    const c = { ...STD, oatC: 20 }
    expect(takeoffSpeeds(boeing737_400, f, { ...c, weightKg: 68_000 })).toEqual({
      v1: 154,
      vr: 159,
      v2: 166,
    })
    expect(takeoffSpeeds(boeing737_400, f, { ...c, weightKg: 52_000 })).toEqual({
      v1: 132,
      vr: 135,
      v2: 146,
    })
  })

  it('has no flaps 1', () => {
    expect(boeing737_400.flaps.map((f) => f.id)).toEqual(['5', '15'])
  })
})

describe('Q400 (speed card grid)', () => {
  it('reads the card: 24 t, sea level, cool day, flaps 5 = 118 / 118 / 122', () => {
    const s = takeoffSpeeds(dash8Q400, flap(dash8Q400, '5'), {
      ...STD,
      weightKg: 24_000,
      oatC: 10,
    })
    expect(s).toEqual({ v1: 118, vr: 118, v2: 122 })
  })

  it('uses the hot band above 20 °C', () => {
    const s = takeoffSpeeds(dash8Q400, flap(dash8Q400, '5'), {
      ...STD,
      weightKg: 28_000,
      oatC: 30,
      pressureAltitudeFt: 4000,
    })
    expect(s).toEqual({ v1: 133, vr: 133, v2: 133 })
  })

  it('applies the minimum VR and the wet-runway V1 reduction', () => {
    const light = { ...STD, weightKg: 18_000, oatC: 10 }
    expect(takeoffSpeeds(dash8Q400, flap(dash8Q400, '5'), light).vr).toBe(108)
    const wet = takeoffSpeeds(dash8Q400, flap(dash8Q400, '5'), {
      ...light,
      weightKg: 28_000,
      wetRunway: true,
    })
    expect(wet.v1).toBe(122)
  })
})

describe('Dash 8 classics (derived)', () => {
  it('matches the flight-test point: -100 near MTOW, flaps 15 ≈ 93 / 96', () => {
    const s = takeoffSpeeds(dash8_100, flap(dash8_100, '15'), { ...STD, weightKg: 15_600 })
    expect(s.vr).toBeGreaterThanOrEqual(92)
    expect(s.vr).toBeLessThanOrEqual(94)
    expect(s.v2).toBeGreaterThanOrEqual(94)
    expect(s.v2).toBeLessThanOrEqual(97)
  })
})

describe('King Air 350', () => {
  it('gives the anchor speeds at 15,000 lb and holds minimums when light', () => {
    const up = flap(kingAir350, 'up')
    expect(takeoffSpeeds(kingAir350, up, { ...STD, weightKg: 15_000 / LB_PER_KG })).toEqual({
      v1: 106,
      vr: 111,
      v2: 117,
    })
    const light = takeoffSpeeds(kingAir350, up, { ...STD, weightKg: 10_000 / LB_PER_KG })
    expect(light.v2).toBe(104)
    expect(light.vr).toBeGreaterThanOrEqual(96)
  })
})

describe('Caravan 208B', () => {
  it('has no V1 and reproduces the short-field table', () => {
    const s = takeoffSpeeds(caravan208B, flap(caravan208B, '20'), {
      ...STD,
      weightKg: 8300 / LB_PER_KG,
    })
    expect(s).toEqual({ v1: undefined, vr: 67, v2: 80 })
  })
})

describe('every profile', () => {
  it.each(
    AIRCRAFT_PROFILES.map((p) => [p.id, p] as const),
  )('%s: V1 ≤ VR ≤ V2 at 70–100 % MTOW, and speeds rise with weight', (_id, p) => {
    expect(p.flaps.some((f) => f.id === p.defaultFlapId)).toBe(true)
    for (const f of p.flaps) {
      let previous = 0
      for (const share of [0.7, 0.85, 1]) {
        const s = takeoffSpeeds(p, f, { ...STD, weightKg: p.maxTakeoffWeightKg * share })
        if (s.v1 !== undefined) expect(s.v1).toBeLessThanOrEqual(s.vr)
        expect(s.vr).toBeLessThanOrEqual(s.v2)
        expect(s.vr).toBeGreaterThanOrEqual(previous)
        previous = s.vr
      }
    }
  })
})

describe('flap recommendation', () => {
  const heavy = { ...STD, weightKg: 65_000, oatC: 30, pressureAltitudeFt: 2000 }

  it('uses the usual flap when no runway is set or the runway is long', () => {
    expect(recommendFlap(boeing737_600, heavy).flap.id).toBe('5')
    expect(recommendFlap(boeing737_600, { ...heavy, runwayLengthM: 3500 }).flap.id).toBe('5')
  })

  it('moves to more flap on a short runway, and flags when nothing fits', () => {
    const need5 = requiredRunwayM(boeing737_600, flap(boeing737_600, '5'), heavy)
    const need15 = requiredRunwayM(boeing737_600, flap(boeing737_600, '15'), heavy)
    const between = (need5 + need15) / 2
    expect(recommendFlap(boeing737_600, { ...heavy, runwayLengthM: between }).flap.id).not.toBe('5')
    expect(recommendFlap(boeing737_600, { ...heavy, runwayLengthM: 1000 })).toMatchObject({
      fits: false,
    })
  })
})

describe('planTakeoff', () => {
  it('follows the recommendation and warns about weight and runway', () => {
    const plan = planTakeoff(boeing737_600, {
      ...STD,
      weightKg: 70_000,
      runwayLengthM: 1200,
    })
    expect(plan.warnings).toContain('over-mtow')
    expect(plan.warnings).toContain('runway-short')
    expect(plan.trim).toBeDefined()
  })

  it('always plans the recommended flap: more flap for a short runway', () => {
    const conditions = { ...STD, weightKg: 29_000 }
    expect(planTakeoff(dash8Q400, conditions).flap.id).toBe('5')
    expect(planTakeoff(dash8Q400, { ...conditions, runwayLengthM: 1350 }).flap.id).not.toBe('5')
  })

  it('flags a weight that cannot be this aircraft (e.g. a 737 weight on the Caravan)', () => {
    const plan = planTakeoff(caravan208B, { ...STD, weightKg: 54_000 })
    expect(plan.warnings).toContain('weight-implausible')
    expect(planTakeoff(caravan208B, { ...STD, weightKg: 3800 }).warnings).not.toContain(
      'weight-implausible',
    )
  })

  it('has no trim value for advice-only profiles', () => {
    expect(planTakeoff(kingAir350, { ...STD, weightKg: 6000 }).trim).toBeUndefined()
  })
})

describe('format', () => {
  it('formats weights, runways and trim', () => {
    expect(formatWeight(8750 / LB_PER_KG, 'lb')).toBe('8,750 lb')
    expect(formatWeight(62_500, 'kg')).toBe('62,500 kg')
    expect(formatRunway(2000)).toBe('2,000 m (6,562 ft)')
    expect(formatTrim(5.25)).toBe('5.25')
    expect(formatTrim(6)).toBe('6.0')
    expect(formatTrim(5.5)).toBe('5.5')
  })
})
