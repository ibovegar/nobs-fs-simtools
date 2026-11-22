import { describe, expect, it } from 'vitest'
import { boeing737_600, caravan208B, dash8_100 } from './profiles'
import { takeoffSummary } from './takeoffSummary'
import type { AircraftProfile, TakeoffConditions, TakeoffResult } from './types'

const conditions: TakeoffConditions = {
  weightKg: 55000,
  cgPercentMac: 22.04,
  oatC: 15,
  pressureAltitudeFt: 0,
  runwayLengthM: 0,
  wetRunway: false,
}

const result = (profile: AircraftProfile, over: Partial<TakeoffResult> = {}): TakeoffResult => ({
  speeds: { v1: 138, vr: 141, v2: 147 },
  flap: profile.flaps[0] as TakeoffResult['flap'],
  requiredRunwayM: 1850,
  trim: 5.25,
  warnings: [],
  ...over,
})

const summary = (profile: AircraftProfile, over: Partial<TakeoffResult> = {}, lever = {}) =>
  takeoffSummary({
    profile,
    result: result(profile, over),
    conditions,
    leverFlap: undefined,
    leverKnown: false,
    ...lever,
  })

describe('takeoffSummary', () => {
  it('multi-engine: V1, VR and V2', () => {
    const s = summary(boeing737_600)
    expect(s.speeds.map((v) => [v.label, v.value])).toEqual([
      ['V1', '138'],
      ['VR', '141'],
      ['V2', '147'],
    ])
  })

  it('single-engine: VR and the speed at 50 ft', () => {
    const s = summary(caravan208B, { speeds: { vr: 65, v2: 75 }, trim: undefined })
    expect(s.speeds.map((v) => v.label)).toEqual(['VR', '50 ft'])
    expect(s.speeds[1]?.helpLabel).toBe('What is the 50 ft speed?')
  })

  it('shows dashes when the weight makes no sense', () => {
    const s = summary(boeing737_600, { warnings: ['weight-implausible'] })
    expect(s.speeds.every((v) => v.value === '—')).toBe(true)
  })

  it('trim from the CG when the profile computes it', () => {
    expect(summary(boeing737_600).trimOrRunway).toMatchObject({
      label: 'Trim',
      value: '5.25',
      caption: 'CG 22.0 % MAC',
    })
  })

  it('runway needed when the profile only gives trim advice', () => {
    const s = summary(dash8_100, { trim: undefined })
    expect(s.trimOrRunway).toEqual({
      label: 'Runway needed',
      value: '1,850',
      unit: 'm',
      caption: 'estimate, 6,070 ft',
    })
  })

  it("the lever's state, only when the sim reports it", () => {
    const [up, takeoff] = boeing737_600.flaps
    expect(summary(boeing737_600).flaps.lever).toBeUndefined()
    expect(summary(boeing737_600, {}, { leverKnown: true, leverFlap: up }).flaps.lever).toEqual({
      set: true,
      text: 'Lever set',
    })
    expect(
      summary(boeing737_600, {}, { leverKnown: true, leverFlap: takeoff }).flaps.lever,
    ).toEqual({ set: false, text: `Lever at ${takeoff?.label}` })
    expect(summary(boeing737_600, {}, { leverKnown: true }).flaps.lever).toEqual({
      set: false,
      text: 'Lever not set',
    })
  })
})
