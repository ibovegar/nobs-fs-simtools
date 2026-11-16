import { describe, expect, it } from 'vitest'
import {
  altitudeScale,
  clipProfile,
  inClimbWindow,
  niceStep,
  pickLabels,
  ticks,
  trendEnd,
  trendLengthPx,
  viewRange,
} from './profileChart'
import { computeVerticalProfile } from './verticalProfile'

// TOC at 100 nm, TOD at 300 nm, 400 nm in all.
const profile = computeVerticalProfile({
  waypoints: [
    { distanceNm: 0, phase: 'departure' },
    { distanceNm: 400, phase: 'approach' },
  ],
  startFt: 0,
  endFt: 0,
  cruiseFt: 30000,
  climbFtPerNm: 300,
  descentFtPerNm: 300,
})

describe('viewRange', () => {
  it('shows the whole route, the climb, or the descent', () => {
    expect(viewRange(profile, 'all')).toEqual({ fromNm: 0, toNm: 400 })
    expect(viewRange(profile, 'departure')).toEqual({ fromNm: 0, toNm: 125 })
    expect(viewRange(profile, 'arrival')).toEqual({ fromNm: 275, toNm: 400 })
  })
})

describe('clipProfile', () => {
  it('cuts the profile to the range with interpolated ends', () => {
    const clipped = clipProfile(profile.points, { fromNm: 50, toNm: 350 })
    expect(clipped[0]).toEqual({ distanceNm: 50, altitudeFt: 15000 })
    expect(clipped.at(-1)).toEqual({ distanceNm: 350, altitudeFt: 15000 })
    expect(clipped.map((p) => p.distanceNm)).toEqual([50, 100, 300, 350])
  })
})

describe('niceStep / ticks', () => {
  it('picks 1-2-5 steps', () => {
    expect(niceStep(400, 5)).toBe(100)
    expect(niceStep(35000, 4)).toBe(10000)
    expect(niceStep(120, 5)).toBe(20)
    expect(niceStep(7, 5)).toBe(1)
  })

  it('lists the multiples in range', () => {
    expect(ticks(275, 400, 50)).toEqual([300, 350, 400])
    expect(ticks(0, 1, 0.5)).toEqual([0, 0.5, 1])
  })
})

describe('pickLabels', () => {
  it('keeps important labels and drops crowded ones', () => {
    const shown = pickLabels(
      [
        { x: 0, priority: 2 },
        { x: 20, priority: 0 },
        { x: 45, priority: 1 },
        { x: 100, priority: 0 },
        { x: 110, priority: 2 },
      ],
      40,
    )
    expect(shown).toEqual([true, false, true, false, true])
  })
})

describe('altitudeScale', () => {
  it('tops out at the cruise level', () => {
    expect(altitudeScale(25000)).toEqual({ maxFt: 25000, ticks: [10000, 20000, 25000] })
    expect(altitudeScale(37000)).toEqual({ maxFt: 37000, ticks: [10000, 20000, 30000, 37000] })
  })

  it('drops a step too close to the top', () => {
    expect(altitudeScale(11_560)).toEqual({ maxFt: 11_600, ticks: [5000, 11_600] })
  })

  it('has a floor for very low flights', () => {
    expect(altitudeScale(200).maxFt).toBe(1000)
  })
})

describe('trendEnd', () => {
  const aircraft = { distanceNm: 100, altitudeFt: 10000 }

  it('runs level or gently to the right edge', () => {
    expect(trendEnd(aircraft, 0, 200, 30000)).toEqual({ distanceNm: 200, altitudeFt: 10000 })
    expect(trendEnd(aircraft, 50, 200, 30000)).toEqual({ distanceNm: 200, altitudeFt: 15000 })
  })

  it('stops where it meets the ground', () => {
    expect(trendEnd(aircraft, -500, 200, 30000)).toEqual({ distanceNm: 120, altitudeFt: 0 })
  })

  it('stops where it meets the top of the chart', () => {
    expect(trendEnd(aircraft, 400, 200, 30000)).toEqual({ distanceNm: 150, altitudeFt: 30000 })
  })
})

describe('trendLengthPx', () => {
  it('grows with groundspeed, within limits', () => {
    expect(trendLengthPx(400)).toBeCloseTo(100, 6)
    expect(trendLengthPx(160)).toBeCloseTo(40, 6)
    expect(trendLengthPx(40)).toBe(20)
    expect(trendLengthPx(900)).toBe(150)
  })
})

describe('inClimbWindow', () => {
  it('is inside up to the end of the climb view', () => {
    // The climb view runs to 125 nm (TOC at 100 + 25).
    expect(inClimbWindow(profile, 50)).toBe(true)
    expect(inClimbWindow(profile, 125)).toBe(true)
    expect(inClimbWindow(profile, 126)).toBe(false)
    expect(inClimbWindow(profile, undefined)).toBeUndefined()
  })
})
