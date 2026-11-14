import { describe, expect, it } from 'vitest'
import { formatAltitude, formatDistance, formatDuration, formatInteger, formatRate } from './format'

describe('formatDistance', () => {
  it('shows a decimal under 10 nm', () => expect(formatDistance(4.26)).toBe('4.3'))
  it('rounds above 10 nm', () => expect(formatDistance(123.6)).toBe('124'))
  it('drops the sign', () => expect(formatDistance(-3.2)).toBe('3.2'))
})

describe('formatDuration', () => {
  it('formats minutes', () => expect(formatDuration(372)).toBe('6:12'))
  it('formats hours', () => expect(formatDuration(3725)).toBe('1:02:05'))
  it('clamps negatives', () => expect(formatDuration(-5)).toBe('0:00'))
})

describe('formatInteger', () => {
  it('groups thousands', () => expect(formatInteger(1234567)).toBe('1,234,567'))
  it('leaves small numbers alone', () => expect(formatInteger(950)).toBe('950'))
  it('rounds first', () => expect(formatInteger(999.6)).toBe('1,000'))
  it('keeps the sign', () => expect(formatInteger(-1250)).toBe('-1,250'))
})

describe('formatRate', () => {
  it('rounds to 50 fpm', () => expect(formatRate(1263)).toBe('1,250'))
})

describe('formatAltitude', () => {
  it('uses flight levels above transition', () => expect(formatAltitude(35000)).toBe('FL350'))
  it('pads low flight levels', () => expect(formatAltitude(18000)).toBe('FL180'))
  it('uses feet below transition', () => expect(formatAltitude(3000)).toBe('3,000'))
})
