// Guarded access to the sim's global JS API. Some of these are top-level `class` or
// `function` declarations in the sim's scripts, which are NOT properties of `window`,
// so they must be read as bare identifiers behind a `typeof` check.

/** True when running inside MSFS's Coherent browser with the sim scripts loaded. */
export function isInSim(): boolean {
  return typeof SimVar !== 'undefined' && typeof Coherent !== 'undefined'
}

export function getSimVar() {
  return typeof SimVar !== 'undefined' ? SimVar : undefined
}

export function getCoherent() {
  return typeof Coherent !== 'undefined' ? Coherent : undefined
}

export function getRegisterViewListener() {
  return typeof RegisterViewListener === 'function' ? RegisterViewListener : undefined
}

/**
 * True once the sim's DataStorage answers. dataStorage.js binds it only after the sim fires
 * `dataStorageReady` (JS_LISTENER_DATASTORAGE); until then GetStoredData returns null and
 * SetStoredData silently does nothing.
 */
export function isSimDataStorageReady(): boolean {
  if (typeof GetDataStorage !== 'function') return false
  try {
    return GetDataStorage() != null
  } catch {
    // `datastorage` isn't defined yet.
    return false
  }
}

/**
 * Runs `callback` once the sim's DataStorage is ready: at once if it already is, else on
 * the sim's `dataStorageReady` event. Returns a function that stops waiting.
 */
export function onSimDataStorageReady(callback: () => void): () => void {
  if (isSimDataStorageReady()) {
    callback()
    return () => {}
  }
  const onReady = () => {
    document.removeEventListener('dataStorageReady', onReady)
    callback()
  }
  document.addEventListener('dataStorageReady', onReady)
  return () => document.removeEventListener('dataStorageReady', onReady)
}

export function getSimDataStorage() {
  if (typeof GetStoredData !== 'function' || typeof SetStoredData !== 'function') return undefined
  return {
    get: GetStoredData,
    set: SetStoredData,
    delete: typeof DeleteStoredData === 'function' ? DeleteStoredData : undefined,
  }
}
