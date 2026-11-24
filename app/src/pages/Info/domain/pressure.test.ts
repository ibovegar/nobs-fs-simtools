import { describe, expect, it } from 'vitest'
import { pressureReadouts } from './pressure'

describe('pressureReadouts', () => {
  it('gives the standard pressure in both units', () => {
    expect(pressureReadouts(1013.25)).toEqual({ hpa: '1013', inhg: '29.92' })
  })

  it('rounds hPa to whole and inHg to two decimals', () => {
    expect(pressureReadouts(992.6)).toEqual({ hpa: '993', inhg: '29.31' })
    expect(pressureReadouts(1030)).toEqual({ hpa: '1030', inhg: '30.42' })
  })

  it('shows a dash without a value', () => {
    expect(pressureReadouts(undefined)).toEqual({ hpa: '—', inhg: '—' })
    expect(pressureReadouts(0)).toEqual({ hpa: '—', inhg: '—' })
    expect(pressureReadouts(Number.NaN)).toEqual({ hpa: '—', inhg: '—' })
  })
})
