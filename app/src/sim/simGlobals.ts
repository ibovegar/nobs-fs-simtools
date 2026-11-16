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

export function getSimDataStorage() {
  if (typeof GetStoredData !== 'function' || typeof SetStoredData !== 'function') return undefined
  return {
    get: GetStoredData,
    set: SetStoredData,
    delete: typeof DeleteStoredData === 'function' ? DeleteStoredData : undefined,
  }
}
