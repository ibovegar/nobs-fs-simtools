import { describe, expect, it } from 'vitest'
import { cleanMetar } from './metar'

const raw = {
  icao: 'ENBR',
  day: 26,
  hour: 14,
  min: 50,
  windDir: 170,
  windSpeed: 12,
  gust: -1,
  windSpeedUnits: 0,
  vrb: false,
  metarString: 'ENBR 261450Z 17012KT 9999 FEW020 08/04 Q1008',
}

describe('cleanMetar', () => {
  it('keeps the wind and leaves out what the sim marks as not given', () => {
    expect(cleanMetar(raw)).toEqual({
      icao: 'ENBR',
      day: 26,
      hour: 14,
      min: 50,
      windDir: 170,
      windSpeed: 12,
      gust: undefined,
      windSpeedUnits: 0,
      vrb: false,
      metarString: 'ENBR 261450Z 17012KT 9999 FEW020 08/04 Q1008',
    })
  })

  it('is null for no METAR: empty icao, "Invalid METAR", or no object', () => {
    expect(cleanMetar({ ...raw, icao: '' })).toBeNull()
    expect(cleanMetar({ ...raw, metarString: 'Invalid METAR' })).toBeNull()
    expect(cleanMetar(null)).toBeNull()
    expect(cleanMetar('ENBR')).toBeNull()
  })
})
