import { describe, expect, it } from 'vitest'
import {
  canBeDescentReference,
  descentTarget,
  referenceAltitudeFt,
  resolveDescentReference,
} from './descentReference'
import type { AltitudeConstraint, RoutePhase } from './route'

const wp = (key: string, phase: RoutePhase, altitude?: AltitudeConstraint, runway?: string) => ({
  key,
  phase,
  altitude,
  runway,
})

const route = [
  wp('RWY-DEP', 'departure', undefined, '27'),
  wp('SID1', 'departure', { kind: 'atOrBelow', upperFt: 5000 }),
  wp('ENR', 'enroute'),
  wp('STAR1', 'arrival', { kind: 'atOrAbove', lowerFt: 9000 }),
  wp('IAF', 'approach', { kind: 'at', lowerFt: 4000, upperFt: 4000 }),
  wp('FAF', 'approach', { kind: 'at', lowerFt: 2000, upperFt: 2000 }),
  wp('RWY-ARR', 'approach', undefined, '09'),
]

describe('referenceAltitudeFt', () => {
  it('takes the top of a window, else the floor', () => {
    expect(referenceAltitudeFt({ kind: 'at', lowerFt: 3000, upperFt: 3000 })).toBe(3000)
    expect(referenceAltitudeFt({ kind: 'between', lowerFt: 3000, upperFt: 5000 })).toBe(5000)
    expect(referenceAltitudeFt({ kind: 'atOrBelow', upperFt: 6000 })).toBe(6000)
    expect(referenceAltitudeFt({ kind: 'atOrAbove', lowerFt: 7000 })).toBe(7000)
    expect(referenceAltitudeFt(undefined)).toBeUndefined()
  })
})

describe('resolveDescentReference', () => {
  it('defaults to the first approach fix with an altitude', () => {
    expect(resolveDescentReference(route, undefined)).toEqual({
      index: 4,
      source: 'default',
      altitudeFt: 4000,
    })
  })

  it('skips approach fixes without an altitude', () => {
    const r = [...route]
    r[4] = wp('IAF', 'approach')
    expect(resolveDescentReference(r, undefined)).toMatchObject({ index: 5, altitudeFt: 2000 })
  })

  it('falls back to the runway without an approach', () => {
    const r = [route[0], route[2], wp('RWY-ARR', 'approach', undefined, '09')].filter(
      (w) => w !== undefined,
    )
    expect(resolveDescentReference(r, undefined)).toEqual({ index: 2, source: 'runway' })
  })

  it('uses a picked fix, with its limit', () => {
    expect(resolveDescentReference(route, 'STAR1')).toEqual({
      index: 3,
      source: 'selected',
      altitudeFt: 9000,
    })
    expect(resolveDescentReference(route, 'ENR')).toEqual({
      index: 2,
      source: 'selected',
      altitudeFt: undefined,
    })
  })

  it('can pick the runway itself', () => {
    expect(resolveDescentReference(route, 'RWY-ARR')).toEqual({
      index: 6,
      source: 'selected',
      altitudeFt: undefined,
    })
  })

  it('ignores a pick that is gone or in the SID', () => {
    expect(resolveDescentReference(route, 'GONE').source).toBe('default')
    expect(resolveDescentReference(route, 'SID1').source).toBe('default')
  })
})

describe('canBeDescentReference', () => {
  it('allows fixes after the SID', () => {
    expect(route.map((_, i) => canBeDescentReference(route, i))).toEqual([
      false,
      false,
      true,
      true,
      true,
      true,
      true,
    ])
  })
})

describe('descentTarget', () => {
  it('is only set with an altitude', () => {
    expect(descentTarget({ index: 4, source: 'default', altitudeFt: 4000 })).toEqual({
      index: 4,
      altitudeFt: 4000,
      overridesEarlierLimits: false,
    })
    expect(descentTarget({ index: 4, source: 'selected', altitudeFt: 4000 })).toEqual({
      index: 4,
      altitudeFt: 4000,
      overridesEarlierLimits: true,
    })
    expect(descentTarget({ index: 6, source: 'runway' })).toBeUndefined()
  })
})
