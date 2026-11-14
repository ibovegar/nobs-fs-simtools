import { describe, expect, it } from 'vitest'
import { advanceFlight, INITIAL_MOCK_FLIGHT } from './mockFlight'

describe('advanceFlight', () => {
  it('closes the distance at groundspeed', () => {
    // 360 kt = 0.1 nm per second
    const next = advanceFlight({ ...INITIAL_MOCK_FLIGHT, groundSpeedKt: 360 }, 10)
    expect(next.gpsDistanceNm).toBeCloseTo(149, 6)
    expect(next.simTimeSec).toBe(10)
  })

  it('applies the time scale', () => {
    const next = advanceFlight({ ...INITIAL_MOCK_FLIGHT, groundSpeedKt: 360, timeScale: 10 }, 1)
    expect(next.simTimeSec).toBe(10)
    expect(next.gpsDistanceNm).toBeCloseTo(149, 6)
  })

  it('changes altitude by vertical speed', () => {
    const next = advanceFlight({ ...INITIAL_MOCK_FLIGHT, verticalSpeedFpm: -1200 }, 30)
    expect(next.altitudeFt).toBe(35000 - 600)
  })

  it('never goes below zero', () => {
    const next = advanceFlight(
      { ...INITIAL_MOCK_FLIGHT, gpsDistanceNm: 0.01, altitudeFt: 10, verticalSpeedFpm: -6000 },
      60,
    )
    expect(next.gpsDistanceNm).toBe(0)
    expect(next.altitudeFt).toBe(0)
  })
})
