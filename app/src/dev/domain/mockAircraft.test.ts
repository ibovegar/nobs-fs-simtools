import { describe, expect, it } from 'vitest'
import { AIRCRAFT, detectAircraft } from '~/aircraft'
import { MOCK_AIRCRAFT, mockAircraft } from './mockAircraft'

describe('mock aircraft', () => {
  it.each([
    ['bksq-caravan', 'c208b'],
    ['bksq-tbm850', 'tbm-850'],
    ['kingair-350', 'kingair-350'],
    ['q400', 'dash8-q400'],
    ['b737-600', 'b737-600'],
    ['a320', undefined],
    ['none', undefined],
  ])('SimTools recognises %s as %s', (id, profileId) => {
    const a = mockAircraft(id)
    expect(detectAircraft(AIRCRAFT, a.title, a.atcModel)?.id).toBe(profileId)
  })

  it('has unique ids and falls back to the first preset', () => {
    expect(new Set(MOCK_AIRCRAFT.map((a) => a.id)).size).toBe(MOCK_AIRCRAFT.length)
    expect(mockAircraft('nope')).toBe(MOCK_AIRCRAFT[0])
  })
})
