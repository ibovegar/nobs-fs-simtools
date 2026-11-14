import { describe, expect, it } from 'vitest'
import {
  ATC_FIELDS,
  type AtcFieldDef,
  applyKey,
  disabledKeysFor,
  formatAtcValue,
  isValidAtcValue,
} from './atcFields'

const field = (id: string) => ATC_FIELDS.find((f) => f.id === id) as AtcFieldDef
const type = (def: AtcFieldDef, keys: string) =>
  [...keys].reduce((raw, k) => applyKey(def, raw, k), '')

describe('frequency', () => {
  const freq = field('frequency')
  it('inserts the decimal point for display', () => {
    expect(formatAtcValue(freq, type(freq, '118325'))).toBe('118.325')
    expect(formatAtcValue(freq, '1183')).toBe('118.3')
  })
  it('caps at six digits', () => expect(type(freq, '1183259')).toBe('118325'))
  it('validates the airband range', () => {
    expect(isValidAtcValue(freq, '121500')).toBe(true)
    expect(isValidAtcValue(freq, '108000')).toBe(false)
    expect(isValidAtcValue(freq, '1215')).toBe(false)
  })
})

describe('squawk', () => {
  const squawk = field('squawk')
  it('rejects 8 and 9', () => expect(type(squawk, '7890')).toBe('70'))
  it('validates four octal digits', () => {
    expect(isValidAtcValue(squawk, '7000')).toBe(true)
    expect(isValidAtcValue(squawk, '700')).toBe(false)
  })
})

describe('runway', () => {
  const rwy = field('runway')
  it('accepts two digits and a side', () => expect(type(rwy, '27L')).toBe('27L'))
  it('needs a digit before the side', () => expect(type(rwy, 'L09')).toBe('09'))
  it('locks after the side', () => {
    expect(type(rwy, '9R1')).toBe('9R')
    expect(disabledKeysFor(rwy, '9R')).toContain('L')
  })
  it('allows at most two digits', () => expect(type(rwy, '123')).toBe('12'))
  it('validates 1–36', () => {
    expect(isValidAtcValue(rwy, '36')).toBe(true)
    expect(isValidAtcValue(rwy, '37')).toBe(false)
  })
})

describe('atis letter', () => {
  const atis = field('atis')
  it('replaces the letter', () => expect(type(atis, 'AB')).toBe('B'))
})

describe('qnh', () => {
  const qnh = field('qnh')
  it('allows a single decimal point', () => expect(type(qnh, '29.9.2')).toBe('29.92'))
})

describe('heading', () => {
  const hdg = field('heading')
  it('validates 1–360', () => {
    expect(isValidAtcValue(hdg, '360')).toBe(true)
    expect(isValidAtcValue(hdg, '400')).toBe(false)
  })
})
