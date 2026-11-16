import { describe, expect, it } from 'vitest'
import { AIRCRAFT } from '~/aircraft'
import { AIRCRAFT_PROFILES } from './domain'

describe('Planning takeoff profiles', () => {
  it('each belongs to an aircraft SimTools recognises', () => {
    const ids = new Set(AIRCRAFT.map((a) => a.id))
    for (const p of AIRCRAFT_PROFILES) expect(ids.has(p.id), p.id).toBe(true)
  })
})
