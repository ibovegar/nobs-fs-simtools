import { describe, expect, it } from 'vitest'
import {
  applyCallsignKey,
  CALLSIGN_MAX_LENGTH,
  isCallsignFull,
  normaliseCallsign,
} from './callsign'

describe('normaliseCallsign', () => {
  it('upper-cases and keeps only letters and digits', () => {
    expect(normaliseCallsign('nax 12-3')).toBe('NAX123')
  })

  it('cuts it to the ICAO maximum', () => {
    expect(normaliseCallsign('ABCDEFGHIJ')).toHaveLength(CALLSIGN_MAX_LENGTH)
  })
})

describe('applyCallsignKey', () => {
  it('appends the key', () => {
    expect(applyCallsignKey('NAX', '1')).toBe('NAX1')
  })

  it('ignores keys once the callsign is full', () => {
    expect(applyCallsignKey('NAX1234', '5')).toBe('NAX1234')
    expect(isCallsignFull('NAX1234')).toBe(true)
    expect(isCallsignFull('NAX')).toBe(false)
  })
})
