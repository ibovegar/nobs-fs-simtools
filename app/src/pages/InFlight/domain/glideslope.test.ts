import { describe, expect, it } from 'vitest'
import {
  aimPointOffsetNm,
  distanceTicks,
  glideslopeHeightFt,
  glideslopePosition,
  profileRangeNm,
  slopeState,
  THRESHOLD_CROSSING_HEIGHT_FT,
} from './glideslope'

describe('glideslopeHeightFt', () => {
  it('crosses the threshold at the TCH', () => {
    expect(glideslopeHeightFt(0, 3)).toBeCloseTo(THRESHOLD_CROSSING_HEIGHT_FT, 6)
  })

  it('climbs about 318 ft per nm at 3°', () => {
    expect(glideslopeHeightFt(5, 3) - glideslopeHeightFt(4, 3)).toBeCloseTo(318.4, 0)
  })

  it('puts the aim point ~950 ft past the threshold at 3°', () => {
    expect(aimPointOffsetNm(3) * 6076.12).toBeCloseTo(954, 0)
  })
})

describe('glideslopePosition', () => {
  const onSlopeAt5nm = 1000 + glideslopeHeightFt(5, 3)

  it('is centred when exactly on the slope', () => {
    const p = glideslopePosition({
      altitudeFt: onSlopeAt5nm,
      runwayElevationFt: 1000,
      distanceNm: 5,
      degrees: 3,
    })
    expect(p.deviationFt).toBeCloseTo(0, 6)
    expect(p.deviationDots).toBeCloseTo(0, 6)
    expect(p.pathAltitudeFt).toBeCloseTo(onSlopeAt5nm, 6)
    expect(p.heightFt).toBeCloseTo(onSlopeAt5nm - 1000, 6)
  })

  it('reports high as positive feet and dots', () => {
    const p = glideslopePosition({
      altitudeFt: onSlopeAt5nm + 200,
      runwayElevationFt: 1000,
      distanceNm: 5,
      degrees: 3,
    })
    expect(p.deviationFt).toBeCloseTo(200, 6)
    // 200 ft at ~5.16 nm from the aim point ≈ 0.37° ≈ 1 dot.
    expect(p.deviationDots).toBeGreaterThan(0.9)
    expect(p.deviationDots).toBeLessThan(1.2)
  })

  it('reports low as negative and grows more sensitive close in', () => {
    const far = glideslopePosition({
      altitudeFt: glideslopeHeightFt(8, 3) - 100,
      runwayElevationFt: 0,
      distanceNm: 8,
      degrees: 3,
    })
    const near = glideslopePosition({
      altitudeFt: glideslopeHeightFt(2, 3) - 100,
      runwayElevationFt: 0,
      distanceNm: 2,
      degrees: 3,
    })
    expect(far.deviationDots).toBeLessThan(0)
    expect(near.deviationDots).toBeLessThan(far.deviationDots)
  })
})

describe('slopeState', () => {
  it('classifies dots', () => {
    expect(slopeState(0.3)).toBe('on-slope')
    expect(slopeState(-0.5)).toBe('on-slope')
    expect(slopeState(1)).toBe('high')
    expect(slopeState(-1.5)).toBe('low')
    expect(slopeState(2.5)).toBe('well-high')
    expect(slopeState(-3)).toBe('well-low')
  })
})

describe('profileRangeNm', () => {
  it('snaps to a range with room behind the aircraft', () => {
    expect(profileRangeNm(0)).toBe(2)
    expect(profileRangeNm(3)).toBe(4)
    expect(profileRangeNm(5)).toBe(6)
    expect(profileRangeNm(9)).toBe(15)
    expect(profileRangeNm(100)).toBe(30)
  })
})

describe('distanceTicks', () => {
  it('ticks every nm out to 10 nm, labelled every 1 or 2 nm', () => {
    expect(distanceTicks(5).map((t) => t.nm)).toEqual([0, 1, 2, 3, 4, 5])
    expect(distanceTicks(5).every((t) => t.label)).toBe(true)
    expect(
      distanceTicks(8)
        .filter((t) => t.label)
        .map((t) => t.nm),
    ).toEqual([0, 2, 4, 6, 8])
  })

  it('ticks every 5 nm beyond 10 nm', () => {
    expect(distanceTicks(15)).toEqual([
      { nm: 0, label: true },
      { nm: 5, label: true },
      { nm: 10, label: true },
      { nm: 15, label: true },
    ])
  })
})
