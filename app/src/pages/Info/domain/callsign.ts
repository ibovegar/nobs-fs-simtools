// The pilot's callsign: what ATC calls the aircraft, as filed (ICAO format, e.g. NAX123,
// LNABC, N12345). Entered on the alphanumeric keypad, so only letters and digits.

/** ICAO flight plan item 7 allows at most 7 characters. */
export const CALLSIGN_MAX_LENGTH = 7

/** Upper case, letters and digits only, at most CALLSIGN_MAX_LENGTH characters. */
export function normaliseCallsign(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, CALLSIGN_MAX_LENGTH)
}

/** The callsign after a keypad press: the key appended, unless it is already full. */
export function applyCallsignKey(callsign: string, key: string): string {
  return normaliseCallsign(callsign + key)
}

/** Every key on the alphanumeric keypad, to disable them all once the callsign is full. */
export const CALLSIGN_KEYS: readonly string[] = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/** Whether the callsign is full, so no more keys can be pressed. */
export function isCallsignFull(callsign: string): boolean {
  return callsign.length >= CALLSIGN_MAX_LENGTH
}
