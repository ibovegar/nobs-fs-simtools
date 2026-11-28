import { describe, expect, it } from 'vitest'
import { airportDistances, slantRangeNm } from './airportDistances'

const ENBR = { ident: 'ENBR', lat: 60.2934, lon: 5.2181 }

describe('slantRangeNm', () => {
  it('adds the height: overhead at 6076 ft is 1 nm', () => {
    expect(slantRangeNm(0, 6076.12)).toBeCloseTo(1)
    expect(slantRangeNm(3, 0)).toBe(3)
    expect(slantRangeNm(3, -500)).toBe(3)
  })
})

describe('airportDistances', () => {
  it('gives the ground and slant distances, one decimal', () => {
    // 0.2° south: 12 nm, 12 000 ft above the airport (elevation 50 m ≈ 164 ft).
    const aircraft = { lat: 60.0934, lon: 5.2181, headingDeg: 0, altitudeFt: 12_164 }
    const d = airportDistances(aircraft, ENBR, 50)
    expect(d?.gps).toBe('12.0')
    expect(d?.dme).toBe('12.2')
    expect(d?.dmeHelp).toContain('ENBR')
  })

  it("shows '—' for what isn't known, nothing without an airport", () => {
    const at = { lat: 60.0934, lon: 5.2181, headingDeg: 0 }
    expect(airportDistances(at, ENBR, 50)).toMatchObject({ gps: '12.0', dme: '—' })
    expect(airportDistances({ ...at, altitudeFt: 5000 }, ENBR, undefined)?.dme).toBe('—')
    const nowhere = { lat: undefined, lon: undefined, headingDeg: undefined }
    expect(airportDistances(nowhere, ENBR, 50)).toMatchObject({ gps: '—', dme: '—' })
    expect(airportDistances(at, null, 50)).toBeUndefined()
  })
})
