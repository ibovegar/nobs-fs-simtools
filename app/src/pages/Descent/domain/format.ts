// Display formatting for the descent calculator. Pure and unit-tested.
//
// No `Intl` here: the sim's embedded browser may not ship it, and a missing global at
// module load stops the whole app from starting.

/** 1234.5 → "1,235", -1250 → "-1,250" */
export function formatInteger(n: number): string {
  const rounded = Math.round(n)
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return rounded < 0 ? `-${digits}` : digits
}

/** Distances: one decimal under 10 nm (where it matters), whole numbers above. */
export function formatDistance(nm: number): string {
  const abs = Math.abs(nm)
  return abs < 10 ? abs.toFixed(1) : formatInteger(abs)
}

/** Seconds → "m:ss", or "h:mm:ss" from an hour up. */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

/** Vertical speeds are flown to the nearest 50 fpm. */
export function formatRate(fpm: number): string {
  return formatInteger(Math.round(fpm / 50) * 50)
}

/** Altitudes: "FL350" at or above 18,000 ft, otherwise "3,000". */
export function formatAltitude(ft: number, transitionAltitudeFt = 18000): string {
  if (ft >= transitionAltitudeFt) return `FL${String(Math.round(ft / 100)).padStart(3, '0')}`
  return formatInteger(ft)
}
