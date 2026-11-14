import { describe, expect, it } from 'vitest'
import { createMemoryStorage } from '../KeyValueStorage'
import { loadJson } from './usePersistentState'

describe('loadJson', () => {
  it('returns the fallback when the key is missing', () => {
    expect(loadJson(createMemoryStorage(), 'x', { a: 1 })).toEqual({ a: 1 })
  })

  it('merges stored objects over the fallback so new fields get defaults', () => {
    const storage = createMemoryStorage()
    storage.setItem('x', JSON.stringify({ a: 5 }))
    expect(loadJson(storage, 'x', { a: 1, b: 2 })).toEqual({ a: 5, b: 2 })
  })

  it('returns the fallback for corrupt JSON', () => {
    const storage = createMemoryStorage()
    storage.setItem('x', '{not json')
    expect(loadJson(storage, 'x', 'default')).toBe('default')
  })

  it('returns the fallback when the stored type does not match', () => {
    const storage = createMemoryStorage()
    storage.setItem('x', JSON.stringify([1, 2]))
    expect(loadJson(storage, 'x', { a: 1 })).toEqual({ a: 1 })
  })
})
