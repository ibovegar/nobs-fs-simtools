// The barometric pressure card's values: the sea-level pressure (QNH) in hPa and inHg.

/** inHg in one hPa. */
export const INHG_PER_HPA = 0.029_529_98

export interface PressureReadouts {
  /** Whole hPa, as ATC gives it: '1013', or '—' without a value. */
  hpa: string
  /** Two decimals, as ATC gives it: '29.92', or '—'. */
  inhg: string
}

/** The QNH in both units; '—' when the sim has no value. */
export function pressureReadouts(hpa: number | undefined): PressureReadouts {
  if (hpa === undefined || !Number.isFinite(hpa) || hpa <= 0) return { hpa: '—', inhg: '—' }
  return {
    hpa: String(Math.round(hpa)),
    inhg: (hpa * INHG_PER_HPA).toFixed(2),
  }
}
