import { describe, expect, it } from 'vitest'
import {
  type AirportCandidate,
  airportLabel,
  airportQuery,
  airportSuggestions,
  distanceNm,
  isIdentQuery,
  searchText,
  suggestionsStatus,
} from './airportSearch'

const ENGM: AirportCandidate = { ident: 'ENGM', name: 'Oslo Gardermoen', lat: 60.194, lon: 11.1 }
const ENKJ: AirportCandidate = { ident: 'ENKJ', name: 'Kjeller', lat: 59.97, lon: 11.036 }
const ENVA: AirportCandidate = { ident: 'ENVA', name: 'Trondheim Værnes', lat: 63.458, lon: 10.924 }
const ENBR: AirportCandidate = { ident: 'ENBR', name: 'Bergen Flesland', lat: 60.294, lon: 5.218 }
// Near Kjeller.
const HERE = { lat: 59.95, lon: 11.0 }

describe('airportSuggestions', () => {
  it('with nothing typed: the nearby airports, nearest first, with distances', () => {
    const s = airportSuggestions('', [ENGM, ENKJ], [], HERE)
    expect(s.map((a) => a.ident)).toEqual(['ENKJ', 'ENGM'])
    expect(s[0]?.distanceText).toBe('2 nm')
  })

  it('matches the code first, then a word of the name', () => {
    const s = airportSuggestions('EN', [ENGM, ENKJ, ENVA], [], HERE)
    expect(s.map((a) => a.ident)).toEqual(['ENKJ', 'ENGM', 'ENVA'])
    const oslo = airportSuggestions('OSLO', [ENGM, ENKJ], [], HERE)
    expect(oslo.map((a) => a.ident)).toEqual(['ENGM'])
    const gard = airportSuggestions('GARD', [ENGM, ENKJ], [], HERE)
    expect(gard.map((a) => a.ident)).toEqual(['ENGM'])
  })

  it('finds names with Norwegian letters as typed on the keypad', () => {
    expect(airportSuggestions('VAER', [ENVA], [], HERE).map((a) => a.ident)).toEqual(['ENVA'])
  })

  it("adds the sim's code search, without duplicates", () => {
    const s = airportSuggestions('ENBR', [ENGM], [ENBR, ENBR], HERE)
    expect(s.map((a) => a.ident)).toEqual(['ENBR'])
  })

  it('offers the last airport first while nothing is typed', () => {
    const s = airportSuggestions('', [ENGM, ENKJ], [], HERE, ENBR)
    expect(s.map((a) => a.ident)).toEqual(['ENBR', 'ENKJ', 'ENGM'])
    // Typing: it competes like any other airport.
    expect(airportSuggestions('OSLO', [ENGM], [], HERE, ENBR).map((a) => a.ident)).toEqual(['ENGM'])
  })

  it('has no distances without the aircraft position', () => {
    expect(airportSuggestions('', [ENGM], [], undefined)[0]?.distanceText).toBeUndefined()
  })
})

describe('query helpers', () => {
  it('tidies what is typed', () => {
    expect(airportQuery(' enbr')).toBe('ENBR')
    expect(airportQuery('Værnes!')).toBe('VAERNES')
    expect(searchText('Sørstokken Håland')).toBe('SORSTOKKEN HALAND')
  })

  it('asks the sim to search codes of 2–4 letters', () => {
    expect(isIdentQuery('EN')).toBe(true)
    expect(isIdentQuery('ENBR')).toBe(true)
    expect(isIdentQuery('E')).toBe(false)
    expect(isIdentQuery('BERGEN')).toBe(false)
  })

  it('labels a chosen airport with its code and name', () => {
    expect(airportLabel(ENBR)).toBe('ENBR  Bergen Flesland')
    expect(airportLabel({ ...ENBR, name: '' })).toBe('ENBR')
  })

  it('measures great-circle distances', () => {
    expect(distanceNm(ENGM, ENBR)).toBeCloseTo(178, -1)
  })

  it('says why there are no suggestions', () => {
    expect(suggestionsStatus(0, false, '', false)).toMatch(/No sim/)
    expect(suggestionsStatus(0, true, '', true)).toBe('Finding airports…')
    expect(suggestionsStatus(3, false, 'EN', true)).toBeUndefined()
    expect(suggestionsStatus(0, false, '', true)).toBe('No airports near you.')
    expect(suggestionsStatus(0, false, 'XX', true)).toBe('No airport found.')
  })
})
