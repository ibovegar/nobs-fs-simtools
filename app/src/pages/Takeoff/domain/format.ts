// Display formatting for the Takeoff page. Pure and unit-tested. No `Intl` (the sim's
// browser may not ship it).
import { FT_PER_M, LB_PER_KG } from './takeoffMath'

/** 1234.5 → "1,235", -1250 → "-1,250" */
export function formatInteger(n: number): string {
  const rounded = Math.round(n)
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return rounded < 0 ? `-${digits}` : digits
}

export const kgToUnit = (kg: number, unit: 'kg' | 'lb') => (unit === 'lb' ? kg * LB_PER_KG : kg)
export const unitToKg = (value: number, unit: 'kg' | 'lb') =>
  unit === 'lb' ? value / LB_PER_KG : value

/** "62,500 kg" / "8,750 lb" */
export function formatWeight(kg: number, unit: 'kg' | 'lb'): string {
  return `${formatInteger(kgToUnit(kg, unit))} ${unit}`
}

/** "1,950 m (6,398 ft)" */
export function formatRunway(m: number): string {
  return `${formatInteger(m)} m (${formatInteger(m * FT_PER_M)} ft)`
}

/** Trim to its step: 5.25 → "5.25", 6 → "6.0", -0.5 → "-0.5". */
export function formatTrim(value: number): string {
  const fixed = value.toFixed(2)
  return fixed.endsWith('0') ? value.toFixed(1) : fixed
}
