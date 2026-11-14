// Persistent key/value storage: sim DataStorage in MSFS, localStorage in the browser.
//
//   KeyValueStorage.ts  the interface + sim / browser / memory implementations
//   hooks/              usePersistentState (+ loadJson)

export { loadJson, usePersistentState } from './hooks'
export {
  createBrowserStorage,
  createMemoryStorage,
  createSimStorage,
  createStorage,
  type KeyValueStorage,
} from './KeyValueStorage'
