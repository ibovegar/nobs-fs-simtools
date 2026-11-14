import { getSimDataStorage, isInSim } from '~/sim'

/** Minimal string key/value store. Implementations must never throw. */
export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/**
 * The sim's persistent DataStorage (survives sim restarts). `localStorage` is not
 * reliably persisted in the sim's Coherent browser, so this is what we use in-sim.
 */
export function createSimStorage(prefix = 'NOBS_SIMTOOLS.'): KeyValueStorage {
  const store = getSimDataStorage()
  if (!store) return createMemoryStorage()
  return {
    getItem(key) {
      try {
        // The sim returns '' (or null) for missing keys.
        return store.get(prefix + key) || null
      } catch {
        return null
      }
    },
    setItem(key, value) {
      try {
        store.set(prefix + key, value)
      } catch {
        // Nothing sensible to do — the in-memory React state still holds the value.
      }
    },
    removeItem(key) {
      try {
        if (store.delete) store.delete(prefix + key)
        else store.set(prefix + key, '')
      } catch {
        // ignore
      }
    },
  }
}

/** `localStorage`, for the browser dev harness. */
export function createBrowserStorage(prefix = 'nobs-simtools.'): KeyValueStorage {
  return {
    getItem(key) {
      try {
        return localStorage.getItem(prefix + key)
      } catch {
        return null
      }
    },
    setItem(key, value) {
      try {
        localStorage.setItem(prefix + key, value)
      } catch {
        // Private mode / quota — ignore.
      }
    },
    removeItem(key) {
      try {
        localStorage.removeItem(prefix + key)
      } catch {
        // ignore
      }
    },
  }
}

/** Non-persistent storage, for tests and as a last-resort fallback. */
export function createMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string>()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  }
}

/** The right storage for the current environment. */
export function createStorage(): KeyValueStorage {
  return isInSim() ? createSimStorage() : createBrowserStorage()
}
