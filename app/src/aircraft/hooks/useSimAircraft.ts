import { useSimText } from '~/sim'
import { AIRCRAFT, detectAircraft } from '../catalogue'

const AIRCRAFT_SIM_TEXT = {
  title: 'TITLE',
  atcModel: 'ATC MODEL',
}

/**
 * The aircraft loaded in the sim, recognised from its TITLE and ATC MODEL. There is no
 * picker: `aircraft` is undefined when SimTools doesn't know it (or there is no sim).
 *
 * Read when the page opens and then at 1 Hz (two short strings), so swapping aircraft
 * with the panel open is picked up too.
 */
export function useSimAircraft() {
  const text = useSimText(AIRCRAFT_SIM_TEXT)
  return {
    aircraft: detectAircraft(AIRCRAFT, text.title, text.atcModel),
    /** The sim's aircraft title (livery), to show what wasn't recognised. */
    title: text.title,
    atcModel: text.atcModel,
  }
}
