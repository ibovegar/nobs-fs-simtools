import { type SetStateAction, useEffect, useRef, useState } from 'react'
import { useStorage } from '~/providers/StorageProvider'
import type { KeyValueStorage } from '../KeyValueStorage'

/**
 * Read a JSON value from storage, merging it over `fallback` so fields added in a newer
 * version get their defaults. Corrupt or missing data yields `fallback`.
 *
 * Keys carry a schema version (`'tod.v1'`): bump it when a stored shape changes in an
 * incompatible way rather than writing migration code.
 */
export function loadJson<T>(storage: KeyValueStorage, key: string, fallback: T): T {
  const raw = storage.getItem(key)
  if (raw === null) return fallback
  try {
    const parsed: unknown = JSON.parse(raw)
    const kind = (v: unknown) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v)
    if (kind(parsed) !== kind(fallback)) return fallback
    if (kind(fallback) === 'object') return { ...fallback, ...(parsed as T) }
    return parsed as T
  } catch {
    return fallback
  }
}

/**
 * `useState` that survives panel reloads and sim restarts.
 *
 * Writes are debounced by default so high-frequency updates (ink strokes, countdowns)
 * don't hammer the sim's storage. Pass `debounceMs: 0` for values that change rarely and
 * must never be lost, such as navigation (the open page): those are written immediately.
 * A pending write is flushed on unmount and when the page is hidden or unloaded, since
 * quitting the sim doesn't unmount React.
 */
export function usePersistentState<T>(
  key: string,
  fallback: T,
  { debounceMs = 400 }: { debounceMs?: number } = {},
): [T, (action: SetStateAction<T>) => void] {
  const storage = useStorage()
  const [value, setValue] = useState<T>(() => loadJson(storage, key, fallback))

  const pending = useRef<{ json: string; timer: ReturnType<typeof setTimeout> } | null>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Don't write back the value we just loaded.
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const json = JSON.stringify(value)
    if (pending.current) clearTimeout(pending.current.timer)
    if (debounceMs <= 0) {
      pending.current = null
      storage.setItem(key, json)
      return
    }
    const timer = setTimeout(() => {
      storage.setItem(key, json)
      pending.current = null
    }, debounceMs)
    pending.current = { json, timer }
  }, [value, key, storage, debounceMs])

  // Flush a pending write on unmount, and when the page is hidden or about to unload.
  useEffect(() => {
    const flush = () => {
      if (!pending.current) return
      clearTimeout(pending.current.timer)
      storage.setItem(key, pending.current.json)
      pending.current = null
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
      document.removeEventListener('visibilitychange', onVisibility)
      flush()
    }
  }, [key, storage])

  return [value, setValue]
}
