import { describe, expect, it } from 'vitest'
import {
  formatAltitude,
  formatAltitudeLimit,
  formatDistance,
  formatDuration,
  formatInteger,
  formatRate,
  formatSpeedLimit,
} from './format'

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

describe('formatAltitudeLimit', () => {
  it('writes limits FMS-style', () => {
    expect(formatAltitudeLimit({ kind: 'at', lowerFt: 3000, upperFt: 3000 })).toBe('3,000')
    expect(formatAltitudeLimit({ kind: 'atOrAbove', lowerFt: 5000 })).toBe('5,000A')
    expect(formatAltitudeLimit({ kind: 'atOrBelow', upperFt: 24000 })).toBe('FL240B')
    expect(formatAltitudeLimit({ kind: 'between', lowerFt: 5000, upperFt: 7000 })).toBe(
      '5,000A 7,000B',
    )
  })
})

describe('formatSpeedLimit', () => {
  it('marks at-or-below and at-or-above', () => {
    expect(formatSpeedLimit({ kind: 'atOrBelow', kt: 210 })).toBe('210B')
    expect(formatSpeedLimit({ kind: 'atOrAbove', kt: 180 })).toBe('180A')
    expect(formatSpeedLimit({ kind: 'at', kt: 250 })).toBe('250')
  })
})
