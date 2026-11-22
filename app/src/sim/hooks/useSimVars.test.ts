import { describe, expect, it } from 'vitest'
import { shallowEqual } from './useSimVars'

describe('shallowEqual', () => {
  it('compares values', () => {
    expect(shallowEqual({ a: 1, b: undefined }, { a: 1, b: undefined })).toBe(true)
    expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false)
  })

  it('sees a change in which variables are polled', () => {
    expect(shallowEqual({}, { a: 1 })).toBe(false)
    expect(shallowEqual({ a: 1 }, {})).toBe(false)
  })
})
