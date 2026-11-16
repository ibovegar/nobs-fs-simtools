import { describe, expect, it } from 'vitest'
import { alongTrack, greatCircleNm, initialBearingDeg, offsetLatLon } from './geo'

describe('greatCircleNm', () => {
  it('is 60 nm per degree of latitude', () => {
    expect(greatCircleNm({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(60.04, 1)
  })

  it('is zero for the same point', () => {
    expect(greatCircleNm({ lat: 59.9, lon: 10.7 }, { lat: 59.9, lon: 10.7 })).toBe(0)
  })

  it('measures a real city pair (Oslo → Bergen ≈ 175 nm)', () => {
    const engm = { lat: 60.1939, lon: 11.1004 }
    const enbr = { lat: 60.2934, lon: 5.2181 }
    expect(greatCircleNm(engm, enbr)).toBeCloseTo(176, -1)
  })
})

describe('initialBearingDeg', () => {
  it('gives the compass direction', () => {
    expect(initialBearingDeg({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(0, 6)
    expect(initialBearingDeg({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(90, 6)
    expect(initialBearingDeg({ lat: 0, lon: 0 }, { lat: -1, lon: 0 })).toBeCloseTo(180, 6)
    expect(initialBearingDeg({ lat: 0, lon: 0 }, { lat: 0, lon: -1 })).toBeCloseTo(270, 6)
  })
})

describe('offsetLatLon', () => {
  it('round-trips with distance and bearing', () => {
    const start = { lat: 60, lon: 10 }
    const end = offsetLatLon(start, 45, 100)
    expect(greatCircleNm(start, end)).toBeCloseTo(100, 6)
    expect(initialBearingDeg(start, end)).toBeCloseTo(45, 6)
  })
})

describe('alongTrack', () => {
  const a = { lat: 0, lon: 0 }
  const b = { lat: 0, lon: 2 }

  it('splits a position into along- and cross-track distance', () => {
    const t = alongTrack({ lat: 0.1, lon: 1 }, a, b)
    expect(t.alongNm).toBeCloseTo(60.04, 1)
    // North of an eastbound track is left of it: negative.
    expect(t.crossNm).toBeCloseTo(-6, 1)
  })

  it('is negative behind the start', () => {
    expect(alongTrack({ lat: 0, lon: -0.5 }, a, b).alongNm).toBeCloseTo(-30, 0)
  })
})
