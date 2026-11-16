import { describe, expect, it } from 'vitest'
import { AIRCRAFT, detectAircraft } from './catalogue'

describe('detectAircraft', () => {
  it.each([
    ['PMDG 737-600 Asobo livery', 'b737-600'],
    ['Boeing 737-400 KLM', 'b737-400'],
    ['Cessna Grand Caravan 208B EX', 'c208b'],
    ['Black Square Caravan Professional', 'c208b'],
    ['Black Square TBM 850', 'tbm-850'],
    ['Socata TBM850 N850TB', 'tbm-850'],
    ['Beechcraft King Air 350i', 'kingair-350'],
    ['Dash 8 Q400 Wideroe', 'dash8-q400'],
    ['DHC-8-311 Dash 8', 'dash8-300'],
    ['Dash 8-202', 'dash8-200'],
    ['Dash8-100', 'dash8-100'],
  ])('%s → %s', (title, id) => {
    expect(detectAircraft(AIRCRAFT, title)?.id).toBe(id)
  })

  it.each([
    ['TT:ATCCOM.AC_MODEL_B736.0.text', 'b737-600'],
    ['TT:ATCCOM.AC_MODEL_B734.0.text', 'b737-400'],
    ['TT:ATCCOM.AC_MODEL_DH8D.0.text', 'dash8-q400'],
    ['TT:ATCCOM.AC_MODEL_DH8C.0.text', 'dash8-300'],
    ['TT:ATCCOM.AC_MODEL_B350.0.text', 'kingair-350'],
    ['TT:ATCCOM.AC_MODEL_C208.0.text', 'c208b'],
    ['TT:ATCCOM.AC_MODEL_TBM8.0.text', 'tbm-850'],
    // Black Square's TBM 850 reports a plain "850".
    ['850', 'tbm-850'],
  ])('recognises the sim ATC MODEL key %s → %s', (atcModel, id) => {
    expect(detectAircraft(AIRCRAFT, 'Unrecognisable livery title', atcModel)?.id).toBe(id)
  })

  it('uses ATC MODEL too, and returns undefined for unknown aircraft', () => {
    expect(detectAircraft(AIRCRAFT, 'Some livery', 'B736')?.id).toBe('b737-600')
    expect(detectAircraft(AIRCRAFT, 'Airbus', 'TT:ATCCOM.AC_MODEL_A20N.0.text')).toBeUndefined()
    expect(detectAircraft(AIRCRAFT, 'Airbus A320neo')).toBeUndefined()
    // Other TBMs aren't the 850.
    expect(
      detectAircraft(AIRCRAFT, 'Daher TBM 930', 'TT:ATCCOM.AC_MODEL_TBM9.0.text'),
    ).toBeUndefined()
    expect(detectAircraft(AIRCRAFT, undefined)).toBeUndefined()
  })
})

describe('AIRCRAFT', () => {
  it('has unique ids', () => {
    expect(new Set(AIRCRAFT.map((a) => a.id)).size).toBe(AIRCRAFT.length)
  })
})
