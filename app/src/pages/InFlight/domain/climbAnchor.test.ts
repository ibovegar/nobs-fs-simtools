import { describe, expect, it } from 'vitest'
import { climbAnchor } from './climbAnchor'
import { computeVerticalProfile, type ProfileInputs } from './verticalProfile'

const inputs: ProfileInputs = {
  waypoints: [
    { distanceNm: 0, phase: 'departure' },
    { distanceNm: 100, phase: 'enroute' },
    { distanceNm: 200, phase: 'approach' },
  ],
  startFt: 0,
  endFt: 0,
  cruiseFt: 10000,
  climbFtPerNm: 500,
  descentFtPerNm: 300,
}
const planned = computeVerticalProfile(inputs)

describe('climbAnchor', () => {
  it('plans from the runway without a position', () => {
    expect(climbAnchor({ planned, aircraft: undefined, reachedTocNm: undefined })).toEqual({
      climbFrom: undefined,
      reachedTocNm: undefined,
    })
  })

  it('starts the climb ahead at the aircraft while climbing', () => {
    const aircraft = { distanceNm: 10, altitudeFt: 2000 }
    const anchor = climbAnchor({ planned, aircraft, reachedTocNm: undefined })
    expect(anchor).toEqual({ climbFrom: aircraft, reachedTocNm: undefined })
    // Late and low: TOC moves on, 16 nm of climb from there.
    const profile = computeVerticalProfile({ ...inputs, climbFrom: anchor.climbFrom })
    expect(planned.tocNm).toBeCloseTo(20)
    expect(profile.tocNm).toBeCloseTo(26)
  })

  it('fixes the TOC where cruise is reached, and keeps it', () => {
    const atCruise = { distanceNm: 30, altitudeFt: 9950 }
    const reached = climbAnchor({ planned, aircraft: atCruise, reachedTocNm: undefined })
    expect(reached.reachedTocNm).toBe(30)
    const later = climbAnchor({
      planned,
      aircraft: { distanceNm: 80, altitudeFt: 10000 },
      reachedTocNm: 30,
    })
    expect(later.climbFrom).toEqual({ distanceNm: 30, altitudeFt: 10000 })
    expect(computeVerticalProfile({ ...inputs, climbFrom: later.climbFrom }).tocNm).toBeCloseTo(30)
  })

  it('ignores a TOC ahead of the aircraft (an earlier flight)', () => {
    const anchor = climbAnchor({
      planned,
      aircraft: { distanceNm: 2, altitudeFt: 500 },
      reachedTocNm: 30,
    })
    expect(anchor.climbFrom).toEqual({ distanceNm: 2, altitudeFt: 500 })
  })

  it('uses the plan from the runway once past the descent', () => {
    const anchor = climbAnchor({
      planned,
      aircraft: { distanceNm: planned.todNm + 1, altitudeFt: 9000 },
      reachedTocNm: undefined,
    })
    expect(anchor.climbFrom).toBeUndefined()
  })
})
