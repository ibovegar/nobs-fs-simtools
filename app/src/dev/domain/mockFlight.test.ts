import { describe, expect, it } from 'vitest'
import { advanceFlight, INITIAL_MOCK_FLIGHT } from './mockFlight'
import { mockRoutePath } from './mockRoutePath'
import { mockRoute } from './mockRoutes'

describe('INITIAL_MOCK_FLIGHT', () => {
  it('starts stopped on the ground at the start of its route', () => {
    const route = mockRoute(INITIAL_MOCK_FLIGHT.routeId)
    if (!route) throw new Error('no route')
    const path = mockRoutePath(route, false)
    expect(INITIAL_MOCK_FLIGHT.altitudeFt).toBe(Math.round(path.departureElevationFt))
    expect(INITIAL_MOCK_FLIGHT.groundSpeedKt).toBe(0)
    expect(INITIAL_MOCK_FLIGHT.routeProgressNm).toBe(0)
  })
})

describe('advanceFlight', () => {
  it('closes the distance at groundspeed', () => {
    // 360 kt = 0.1 nm per second
    const next = advanceFlight({ ...INITIAL_MOCK_FLIGHT, groundSpeedKt: 360 }, 10)
    expect(next.gpsDistanceNm).toBeCloseTo(149, 6)
    expect(next.routeProgressNm).toBeCloseTo(1, 6)
    expect(next.simTimeSec).toBe(10)
  })

  it('applies the time scale', () => {
    const next = advanceFlight({ ...INITIAL_MOCK_FLIGHT, groundSpeedKt: 360, timeScale: 10 }, 1)
    expect(next.simTimeSec).toBe(10)
    expect(next.gpsDistanceNm).toBeCloseTo(149, 6)
  })

  it('changes altitude by vertical speed', () => {
    const next = advanceFlight(
      {
        ...INITIAL_MOCK_FLIGHT,
        altitudeFt: 12_000,
        verticalSpeedFpm: -1200,
        selectedAltitudeFt: 0,
      },
      30,
    )
    expect(next.altitudeFt).toBe(11_400)
  })

  it('levels off at the selected altitude', () => {
    const climb = advanceFlight(
      {
        ...INITIAL_MOCK_FLIGHT,
        altitudeFt: 9900,
        verticalSpeedFpm: 1200,
        selectedAltitudeFt: 10000,
      },
      30,
    )
    expect(climb.altitudeFt).toBe(10000)
    expect(climb.verticalSpeedFpm).toBe(0)
    const descent = advanceFlight(
      {
        ...INITIAL_MOCK_FLIGHT,
        altitudeFt: 3100,
        verticalSpeedFpm: -1200,
        selectedAltitudeFt: 3000,
      },
      30,
    )
    expect(descent.altitudeFt).toBe(3000)
    expect(descent.verticalSpeedFpm).toBe(0)
  })

  it('leaves the selected altitude when a vertical speed is set while level at it', () => {
    const level = { ...INITIAL_MOCK_FLIGHT, altitudeFt: 12_000, selectedAltitudeFt: 12_000 }
    const descent = advanceFlight({ ...level, verticalSpeedFpm: -1200 }, 1)
    expect(descent.altitudeFt).toBe(11980)
    expect(descent.verticalSpeedFpm).toBe(-1200)
    const climb = advanceFlight({ ...level, verticalSpeedFpm: 600 }, 1)
    expect(climb.altitudeFt).toBe(12010)
    expect(climb.verticalSpeedFpm).toBe(600)
  })

  it('stops at the end of the flight plan', () => {
    const next = advanceFlight(
      { ...INITIAL_MOCK_FLIGHT, groundSpeedKt: 360, routeProgressNm: 99.5 },
      10,
      100,
    )
    expect(next.routeProgressNm).toBe(100)
  })

  it('never goes below zero', () => {
    const next = advanceFlight(
      {
        ...INITIAL_MOCK_FLIGHT,
        groundSpeedKt: 160,
        gpsDistanceNm: 0.01,
        altitudeFt: 10,
        verticalSpeedFpm: -6000,
        selectedAltitudeFt: -1000,
      },
      60,
    )
    expect(next.gpsDistanceNm).toBe(0)
    expect(next.altitudeFt).toBe(0)
  })
})
