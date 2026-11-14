// The ATC quick-entry fields and their input rules. Pure and unit-tested.
import type { KeypadLayout } from '@nobs/ui'

export type AtcFieldKind = 'letter' | 'runway' | 'digits' | 'decimal' | 'squawk' | 'frequency'

export interface AtcFieldDef {
  id: string
  label: string
  kind: AtcFieldKind
  /** Maximum characters of raw input (frequency digits exclude the dot). */
  maxLength: number
  unit?: string
}

/** Field order = tile order. Ids are persisted, so keep them stable. */
export const ATC_FIELDS: readonly AtcFieldDef[] = [
  { id: 'atis', label: 'ATIS', kind: 'letter', maxLength: 1 },
  { id: 'runway', label: 'Runway', kind: 'runway', maxLength: 3 },
  { id: 'frequency', label: 'Frequency', kind: 'frequency', maxLength: 6 },
  { id: 'squawk', label: 'Squawk', kind: 'squawk', maxLength: 4 },
  { id: 'altitude', label: 'Altitude', kind: 'digits', maxLength: 5, unit: 'ft' },
  { id: 'heading', label: 'Heading', kind: 'digits', maxLength: 3, unit: '°' },
  { id: 'speed', label: 'Speed', kind: 'digits', maxLength: 3, unit: 'kt' },
  { id: 'qnh', label: 'QNH', kind: 'decimal', maxLength: 5 },
]

const RUNWAY_SIDES = ['L', 'C', 'R'] as const
const isDigit = (key: string) => key >= '0' && key <= '9'

export function keypadLayoutFor(kind: AtcFieldKind): KeypadLayout {
  if (kind === 'letter') return 'alpha'
  if (kind === 'decimal') return 'decimal'
  return 'numeric'
}

export function extraKeysFor(kind: AtcFieldKind): readonly string[] {
  return kind === 'runway' ? RUNWAY_SIDES : []
}

/** Keys that would produce invalid input from the current value. */
export function disabledKeysFor(def: AtcFieldDef, raw: string): string[] {
  switch (def.kind) {
    case 'squawk':
      return ['8', '9'] // transponder codes are octal
    case 'decimal':
      return raw.includes('.') ? ['.'] : []
    case 'runway': {
      const hasSide = RUNWAY_SIDES.some((s) => raw.endsWith(s))
      const digits = raw.replace(/\D/g, '').length
      if (hasSide) return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ...RUNWAY_SIDES]
      return digits === 0 ? [...RUNWAY_SIDES] : []
    }
    default:
      return []
  }
}

/** The raw value after pressing `key`, or the unchanged value if the key isn't allowed. */
export function applyKey(def: AtcFieldDef, raw: string, key: string): string {
  if (disabledKeysFor(def, raw).includes(key)) return raw
  if (def.kind === 'letter') return key // single letter: replace
  if (def.kind === 'runway') {
    const digits = raw.replace(/\D/g, '').length
    if (isDigit(key) && digits >= 2) return raw
  }
  if (raw.length >= def.maxLength) return raw
  return raw + key
}

/** How a raw value is displayed. */
export function formatAtcValue(def: AtcFieldDef, raw: string): string {
  if (def.kind === 'frequency' && raw.length > 3) return `${raw.slice(0, 3)}.${raw.slice(3)}`
  return raw
}

/** VHF airband COM: 118.000–136.990 MHz. */
const COM_MIN_KHZ = 118000
const COM_MAX_KHZ = 136990

/** Whether a finished value makes sense. Empty values count as valid (nothing to flag). */
export function isValidAtcValue(def: AtcFieldDef, raw: string): boolean {
  if (raw === '') return true
  switch (def.kind) {
    case 'frequency': {
      if (raw.length < 5) return false
      const khz = Number(raw.padEnd(6, '0'))
      return khz >= COM_MIN_KHZ && khz <= COM_MAX_KHZ
    }
    case 'squawk':
      return /^[0-7]{4}$/.test(raw)
    case 'runway': {
      const num = Number(raw.replace(/\D/g, ''))
      return num >= 1 && num <= 36
    }
    case 'digits':
      return def.id !== 'heading' || (Number(raw) >= 1 && Number(raw) <= 360)
    default:
      return true
  }
}
