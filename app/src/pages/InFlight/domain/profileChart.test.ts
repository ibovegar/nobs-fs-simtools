import { describe, expect, it } from 'vitest'
import {
  altitudeScale,
  chartLabel,
  clipProfile,
  inClimbWindow,
  labelWidthPx,
  niceStep,
  placeNames,
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

describe('chartLabel', () => {
  it('names a runway as the FMS does, other fixes by their ident', () => {
    expect(chartLabel({ ident: 'ENGM', runway: '01L' })).toBe('RW01L')
    expect(chartLabel({ ident: 'GM401' })).toBe('GM401')
  })
})

describe('labelWidthPx', () => {
  it('grows with the text and the font size', () => {
    expect(labelWidthPx('GM401', 10)).toBeCloseTo(31)
    expect(labelWidthPx('GM401', 20)).toBeCloseTo(62)
  })
})

describe('placeNames', () => {
  const options = { fontPx: 10, minX: 0, maxX: 300, groundY: 250, sidePx: 8, gapPx: 2 }
  const at = (pointX: number, pointY: number, preferRight = true) => ({
    pointX,
    pointY,
    widthPx: 30,
    preferRight,
  })

  it('puts a name level with its point, on the side it prefers', () => {
    expect(placeNames([at(100, 100), at(200, 100, false)], options)).toEqual([
      { left: 108, baseline: 103 },
      { left: 162, baseline: 103 },
    ])
  })

  it('moves to the other side, then a line up or down, rather than overlap', () => {
    const [, other, up] = placeNames([at(100, 100), at(110, 100, false), at(100, 100)], options)
    expect(other).toEqual({ left: 72, baseline: 103 })
    expect(up).toEqual({ left: 108, baseline: 93 })
  })

  it('goes a line below a point on a level stretch, and only further down when taken', () => {
    const level = { ...at(100, 100), below: true }
    const [first, second, third] = placeNames([level, level, level], options)
    expect(first?.baseline).toBe(113)
    expect(second?.left).toBe(62)
    expect(third?.baseline).toBe(123)
  })

  it('keeps clear of obstacles', () => {
    const obstacles = [{ left: 100, top: 90, right: 150, bottom: 110 }]
    expect(placeNames([at(100, 100)], { ...options, obstacles })[0]).toEqual({
      left: 62,
      baseline: 103,
    })
  })

  it('flips at the chart edge and leaves out a name with no room', () => {
    expect(placeNames([at(290, 100)], options)[0]?.left).toBe(252)
    expect(placeNames([at(100, 4)], { ...options, groundY: 5 })[0]).toBeUndefined()
  })
})
