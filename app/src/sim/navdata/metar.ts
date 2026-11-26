import type { NavMetar } from './navTypes'

const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined

/**
 * The sim's METAR answer as a NavMetar, cleaned as Microsoft's FacilityLoader does (an empty
 * `icao` means none; negative values mean "not given"); null when there is no METAR. MSFS
 * 2024 has been reported to answer "Invalid METAR": that counts as none too.
 */
export function cleanMetar(raw: unknown): NavMetar | null {
  if (!raw || typeof raw !== 'object') return null
  const m = raw as Record<string, unknown>
  const icao = typeof m.icao === 'string' ? m.icao.trim() : ''
  const metarString = typeof m.metarString === 'string' ? m.metarString.trim() : ''
  if (icao === '' || /invalid/i.test(metarString)) return null
  return {
    icao,
    day: num(m.day) ?? 0,
    hour: num(m.hour) ?? 0,
    min: num(m.min) ?? 0,
    windDir: num(m.windDir),
    windSpeed: num(m.windSpeed),
    gust: num(m.gust),
    windSpeedUnits: typeof m.windSpeedUnits === 'number' ? m.windSpeedUnits : -1,
    vrb: m.vrb === true,
    metarString,
  }
}
